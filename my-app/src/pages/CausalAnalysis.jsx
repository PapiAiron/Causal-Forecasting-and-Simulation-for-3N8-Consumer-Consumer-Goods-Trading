// ...existing code...
import React, { useState, useEffect } from 'react';
import { TrendingUp, Upload } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  Area
} from 'recharts';
import { useTheme } from "../components/ThemeContext";
import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';

const CausalAnalysis = ({ onNavigate }) => {
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  const [causalFactorsData, setCausalFactorsData] = useState([]);
  const [seasonalData, setSeasonalData] = useState([]);
  const [forecastPayload, setForecastPayload] = useState(null);
  const [scenarioGraph, setScenarioGraph] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState([]);

  const [file, setFile] = useState(null);
  const [futurePromo, setFuturePromo] = useState('');
  const [futureHoliday, setFutureHoliday] = useState('');

  useEffect(() => {
    setCausalFactorsData([]);
    setSeasonalData([]);
  }, []);

  const normalizeCsvForBackend = async (origFile) => {
    const txt = await origFile.text();
    const lines = txt.split(/\r?\n/);
    if (lines.length === 0) return { file: origFile, hasSku: false };
    const filtered = lines.filter((ln) => {
      const cols = ln.split(',');
      if (cols.length > 1) {
        const c1 = cols[1] ? cols[1].replace(/(^"|"$)/g, '').trim().toUpperCase() : '';
        const c0 = cols[0] ? cols[0].replace(/(^"|"$)/g, '').trim().toUpperCase() : '';
        if (c1 === 'OUTLET' || c0 === 'DATE') return false;
      }
      // drop entirely empty lines
      if (ln.trim() === '') return false;
      return true;
    });
    const newCsv = filtered.join('\n');
    const newFile = new File([newCsv], origFile.name, { type: origFile.type });
    const header = filtered[0] ? filtered[0].split(',').map(h => h.replace(/(^"|"$)/g, '').trim().toLowerCase()) : [];
    return { file: newFile, hasSku: header.includes('sku') };
  };

  const handleFileUploadAndAnalyze = async (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    setFile(f);
    setIsLoading(true);
    setUploadStatus('Preparing CSV...');
    setError('');
    try {
      const { file: normalizedFile } = await normalizeCsvForBackend(f);

      setUploadStatus('Running causal analysis...');
      const form = new FormData();
      form.append('file', normalizedFile);

      const causalRes = await fetch('http://127.0.0.1:5000/causal-analysis', { method: 'POST', body: form });
      if (!causalRes.ok) {
        const txt = await causalRes.text().catch(() => '');
        throw new Error(txt || 'Causal analysis failed');
      }
      const causalJson = await causalRes.json();
      setCausalFactorsData(causalJson.causal_factors || []);
      setSeasonalData(causalJson.seasonal_data || []);
      setUploadStatus('Causal analysis complete.');

      setUploadStatus('Generating forecast (saved model)...');
      await runForecast({ file: normalizedFile });
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
      setUploadStatus('');
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(''), 2500);
    }
  };

  const runForecast = async ({ file: f }) => {
    if (!f) {
      setError('No file selected for forecast.');
      return;
    }
    setIsLoading(true);
    setError('');
    setUploadStatus('Sending forecast request...');
    try {
      const form = new FormData();
      form.append('file', f);

      const causalObj = {};
      if (futurePromo && futurePromo.trim() !== '') {
        try { causalObj.promotion = JSON.parse(futurePromo); } catch { causalObj.promotion = Number(futurePromo); }
      }
      if (futureHoliday && futureHoliday.trim() !== '') {
        try { causalObj.holiday = JSON.parse(futureHoliday); } catch { causalObj.holiday = Number(futureHoliday); }
      }
      if (Object.keys(causalObj).length > 0) form.append('causal', JSON.stringify(causalObj));

      const resp = await fetch('http://127.0.0.1:5000/forecast', { method: 'POST', body: form });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        let parsed = null;
        try { parsed = JSON.parse(txt); } catch {}
        throw new Error(parsed?.error || txt || `Forecast failed ${resp.status}`);
      }
      const data = await resp.json();
      setForecastPayload(data);

      if (data.graph) {
        const dates = data.graph.dates || [];
        const series = data.graph.series || {};
        const keys = Object.keys(series || {});
        const seriesKeys = Array.from(new Set(keys)); // dedupe
        const rows = dates.map((d, i) => {
          const row = { ds: d };
          seriesKeys.forEach(k => {
            row[k] = (series[k] && series[k][i] !== undefined) ? series[k][i] : null;
          });
          return row;
        });
        setScenarioGraph({ rows, seriesNames: seriesKeys });
      } else {
        setScenarioGraph(null);
      }

      setDecisions(data.decisions || []);
      setFeatureImportance(data.feature_importance || []);
      setUploadStatus('Forecast generated.');
    } catch (err) {
      console.error('forecast error', err);
      setError(String(err.message || err));
      setForecastPayload(null);
      setScenarioGraph(null);
      setDecisions([]);
      setFeatureImportance([]);
      setUploadStatus('');
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(''), 2500);
    }
  };

  const forecast = forecastPayload?.forecast || [];
  const avgDaily = forecast.length ? Math.round(forecast.reduce((s, f) => s + (f.pred || 0), 0) / forecast.length) : 0;

  return (
    <LayoutWrapper currentPage="causal-analysis" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header title="Causal Analysis" description="Factor Impact, Forecasting & Insights (uses saved model)" icon={TrendingUp} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Upload CSV</h2>
                  <p className="text-sm">CSV must follow: Date, OUTLET, SKU, Value (header repeat rows removed automatically).</p>
                </div>

                <div className="flex items-center space-x-3">
                  <label className={`flex items-center space-x-2 px-4 py-2 ${theme.primary} text-white rounded-lg cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload size={18} />
                    <span>{isLoading ? 'Processing...' : 'Upload CSV'}</span>
                    <input type="file" accept=".csv" onChange={handleFileUploadAndAnalyze} disabled={isLoading} className="hidden" />
                  </label>

                  <button onClick={() => runForecast({ file })} disabled={!file || isLoading} className={`px-4 py-2 rounded-lg text-white ${!file || isLoading ? 'bg-gray-400' : theme.primary}`}>
                    Forecast
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={futurePromo} onChange={(e) => setFuturePromo(e.target.value)} placeholder='Promotion override (0 or "[0,1,1,...]")' className="px-3 py-2 rounded-lg border" />
                <input value={futureHoliday} onChange={(e) => setFutureHoliday(e.target.value)} placeholder='Holiday override (optional)' className="px-3 py-2 rounded-lg border" />
                <div className="flex items-center"><span className="text-sm">{uploadStatus}</span></div>
              </div>

              {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Forecast & Scenarios</h2>

              {scenarioGraph ? (
                <div style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scenarioGraph.rows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ds" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {scenarioGraph.seriesNames.map((name, idx) => (
                        <Line key={name} dataKey={name} name={name} stroke={idx === 0 ? theme.chart : (idx % 2 ? "#f59e0b" : "#ef4444")} dot={false} strokeWidth={2} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No scenario graph available. Upload CSV and generate forecast to see graph.</div>
              )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-transparent bg-green-50 text-gray-800 dark:bg-green-900/30 dark:border-green-800 dark:text-gray-100">
                <div className="text-sm">Avg Daily (30d)</div>
                <div className="text-2xl font-bold">{avgDaily.toLocaleString()}</div>
              </div>

              <div className="p-4 rounded border border-transparent bg-blue-50 text-gray-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-gray-100">
                <div className="text-sm">Model</div>
                <div className="text-lg font-medium">{forecastPayload?.model_used || 'saved_model'}</div>
              </div>

              <div className="p-4 rounded border border-transparent bg-yellow-50 text-gray-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-gray-100">
                <div className="text-sm">Monthly Total (pred)</div>
                <div className="text-2xl font-bold">{forecastPayload?.monthly_total ? Number(forecastPayload.monthly_total).toLocaleString() : '—'}</div>
              </div>
            </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg">Decisions & Recommendations</h3>
              <div className="mt-3">
                {decisions.length === 0 && <div className="text-sm text-gray-500">No decisions generated.</div>}
                {decisions.map((d, i) => (
                  <div key={i} className="py-2 border-b last:border-b-0">
                    <div className="text-sm font-medium">{d.scenario}</div>
                    <div className="text-sm">{d.advice} (avg change {d.avg_change_pct?.toFixed(1) ?? 0}%)</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg">Feature Importance</h3>
              <div className="mt-3">
                {featureImportance.length === 0 && <div className="text-sm text-gray-500">No feature importance available from model.</div>}
                {featureImportance.slice(0, 12).map((f, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <div className="text-sm">{f.feature}</div>
                    <div className="text-sm font-medium">{(f.importance * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default CausalAnalysis;