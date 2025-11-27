import React, { useState } from 'react';
import { TrendingUp, Upload, Plus, X, Sun, Cloud, CloudRain, Zap, Users, Gift, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  Bar
} from 'recharts';
import { useTheme } from "../components/ThemeContext";
import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';

const CausalAnalysis = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [forecastPayload, setForecastPayload] = useState(null);
  const [scenarioGraph, setScenarioGraph] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [timeView, setTimeView] = useState('daily');
  const [causalEvents, setCausalEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    type: 'weather_hot',
    startDate: '',
    endDate: '',
    impact: 25,
    description: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const getForecastPeriodLimits = () => {
    if (!scenarioGraph?.rows?.length) return { minDate: today, maxDate: null };
    const forecastRows = scenarioGraph.rows.filter(row => row.predicted !== null && row.predicted !== undefined && row.predicted > 0);
    if (!forecastRows.length) return { minDate: today, maxDate: null };
    return {
      minDate: forecastRows[0].ds.split('T')[0],
      maxDate: forecastRows[forecastRows.length - 1].ds.split('T')[0]
    };
  };
  
  const forecastLimits = getForecastPeriodLimits();

  const eventTypes = [
    { value: 'weather_hot', label: 'Hot Weather', icon: Sun, color: '#F59E0B', impact: 25 },
    { value: 'weather_cold', label: 'Cold Weather', icon: Cloud, color: '#6B7280', impact: -15 },
    { value: 'weather_rainy', label: 'Rainy Season', icon: CloudRain, color: '#3B82F6', impact: -20 },
    { value: 'holiday', label: 'Holiday/Festival', icon: Gift, color: '#10B981', impact: 40 },
    { value: 'event', label: 'Major Event', icon: Users, color: '#8B5CF6', impact: 35 },
    { value: 'other', label: 'Other Causal Factors', icon: AlertTriangle, color: '#F59E0B', impact: 0 }
  ];

  const runForecastWithEvents = async (uploadedFile, events) => {
    setIsLoading(true);
    setUploadStatus('Processing forecast with events...');
    setError('');
    
    try {
      const causalForm = new FormData();
      causalForm.append('file', uploadedFile);
      const causalRes = await fetch('http://127.0.0.1:5000/causal-analysis', { method: 'POST', body: causalForm });
      if (!causalRes.ok) throw new Error(await causalRes.text() || 'Causal analysis failed');
      const causalData = await causalRes.json();
      
      if (causalData.causal_factors) {
        setFeatureImportance(causalData.causal_factors.map(f => ({ feature: f.factor, importance: f.correlation })));
      }

      setUploadStatus('Generating 1-year forecast...');
      const forecastForm = new FormData();
      forecastForm.append('file', uploadedFile);
      forecastForm.append('days', '365');
      const forecastRes = await fetch('http://127.0.0.1:5000/forecast', { method: 'POST', body: forecastForm });
      if (!forecastRes.ok) throw new Error(await forecastRes.text() || 'Forecast failed');
      const forecastData = await forecastRes.json();

      if (forecastData.graph?.dates && forecastData.graph?.series) {
        const { dates, series } = forecastData.graph;
        const actualSales = series.actual || [];
        
        const rows = dates.map((date, i) => {
            const baseValue = series.base?.[i];
            const actualValue = actualSales[i];
            const isHistorical = actualValue !== null && actualValue !== undefined;
            let totalImpact = 0;
            const eventImpacts = {};
            
            const validBaseValue = (baseValue !== null && baseValue !== undefined && !isNaN(baseValue) && baseValue > 0) ? baseValue : null;
            
            if (!isHistorical && validBaseValue !== null) {
              events.forEach(event => {
                const currentDate = date.includes('T') ? date.split('T')[0] : date.substring(0, 10);
                const startDate = (event.startDate.includes('T') ? event.startDate.split('T')[0] : event.startDate);
                const endDate = ((event.endDate || event.startDate).includes('T') ? (event.endDate || event.startDate).split('T')[0] : (event.endDate || event.startDate));
                
                if (currentDate >= startDate && currentDate <= endDate) {
                  const impactValue = validBaseValue * (event.impact / 100);
                  totalImpact += impactValue;
                  eventImpacts[`${event.typeLabel}_${event.id}`] = impactValue;
                }
              });
            }
            
            return {
              ds: date,
              actual: isHistorical ? actualValue : null,
              baseline: (!isHistorical && validBaseValue !== null) ? validBaseValue : null,
              predicted: (!isHistorical && validBaseValue !== null) ? Math.max(0, validBaseValue + totalImpact) : null,
              upper: (!isHistorical && validBaseValue !== null) ? Math.max(0, (validBaseValue + totalImpact) * 1.15) : null,
              lower: (!isHistorical && validBaseValue !== null) ? Math.max(0, (validBaseValue + totalImpact) * 0.85) : null,
              totalImpact,
              ...eventImpacts
            };
          });
       
        const validRows = rows.filter(row => {
          if (row.actual !== null) return true;
          return row.predicted !== null && row.predicted > 0;
        });

        const allEventKeys = new Set();
        validRows.forEach(row => Object.keys(row).forEach(key => {
          if (!['ds', 'actual', 'baseline', 'predicted', 'upper', 'lower', 'totalImpact'].includes(key)) allEventKeys.add(key);
        }));

        setScenarioGraph({ rows: validRows, seriesNames: ['actual', 'baseline', 'predicted', 'upper', 'lower'], eventNames: Array.from(allEventKeys) });
      }

      setForecastPayload(forecastData);
      setDecisions(forecastData.decisions || []);
      setUploadStatus('Analysis complete!');
      
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(''), 2500);
    }
  };

  const handleFileUploadAndAnalyze = async (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    setFile(f);
    await runForecastWithEvents(f, causalEvents);
  };

  const handleAddEvent = async () => {
    if (!newEvent.startDate) return alert('Please select a start date');
    const { minDate, maxDate } = forecastLimits;
    if (minDate && newEvent.startDate < minDate) return alert(`Start date must be on or after ${minDate}`);
    if (maxDate && newEvent.startDate > maxDate) return alert(`Start date must be on or before ${maxDate}`);
    if (newEvent.endDate && minDate && newEvent.endDate < minDate) return alert(`End date must be on or after ${minDate}`);
    if (newEvent.endDate && maxDate && newEvent.endDate > maxDate) return alert(`End date must be on or before ${maxDate}`);
    
    const newStart = new Date(newEvent.startDate);
    const newEnd = newEvent.endDate ? new Date(newEvent.endDate) : newStart;
    const hasConflict = causalEvents.some(event => {
      if (event.type !== newEvent.type) return false;
      const existingStart = new Date(event.startDate);
      const existingEnd = event.endDate ? new Date(event.endDate) : existingStart;
      return (newStart <= existingEnd && newEnd >= existingStart);
    });
    
    if (hasConflict) {
      const eventType = eventTypes.find(e => e.value === newEvent.type);
      return alert(`Date conflict! This overlaps with another "${eventType.label}" event.`);
    }
    
    const eventType = eventTypes.find(e => e.value === newEvent.type);
    const updatedEvents = [...causalEvents, { ...newEvent, id: Date.now(), typeLabel: eventType.label, color: eventType.color, icon: eventType.icon }];
    setCausalEvents(updatedEvents);
    setShowEventModal(false);
    setNewEvent({ type: 'weather_hot', startDate: '', endDate: '', impact: eventTypes[0].impact, description: '' });
    if (file) await runForecastWithEvents(file, updatedEvents);
  };

  const handleRemoveEvent = async (id) => {
    const updatedEvents = causalEvents.filter(e => e.id !== id);
    setCausalEvents(updatedEvents);
    if (file) await runForecastWithEvents(file, updatedEvents);
  };

  const aggregateData = (data, view) => {
    if (!data?.length || view === 'daily') return data || [];
    const grouped = {};
    
    data.forEach((item) => {
      const date = new Date(item.ds);
      let groupKey, sortKey;
      
      switch(view) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          sortKey = weekStart.toISOString();
          groupKey = `W${Math.ceil(weekStart.getDate() / 7)} ${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getFullYear()}`;
          break;
        case 'monthly':
          sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          groupKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          sortKey = `${date.getFullYear()}-Q${quarter}`;
          groupKey = `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'yearly':
          sortKey = groupKey = `${date.getFullYear()}`;
          break;
        default:
          sortKey = groupKey = item.ds;
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = { ds: groupKey, sortKey, actual: 0, baseline: 0, predicted: 0, upper: 0, lower: 0, totalImpact: 0, actualCount: 0, forecastCount: 0 };
        scenarioGraph?.eventNames?.forEach(eventName => { grouped[groupKey][eventName] = 0; });
      }
      
      if (item.actual != null && item.actual > 0) {
        grouped[groupKey].actual += item.actual;
        grouped[groupKey].actualCount += 1;
      }
      if (item.baseline != null && item.baseline > 0) {
        grouped[groupKey].baseline += item.baseline;
        grouped[groupKey].forecastCount += 1;
      }
      if (item.predicted != null && item.predicted > 0) grouped[groupKey].predicted += item.predicted;
      grouped[groupKey].upper += (item.upper || 0);
      grouped[groupKey].lower += (item.lower || 0);
      grouped[groupKey].totalImpact += (item.totalImpact || 0);
      scenarioGraph?.eventNames?.forEach(eventName => { if (item[eventName]) grouped[groupKey][eventName] += item[eventName]; });
    });
    
    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(g => {
      const result = { ...g };
      result.actual = result.actualCount > 0 ? result.actual : null;
      result.baseline = result.forecastCount > 0 ? result.baseline : null;
      result.predicted = result.forecastCount > 0 ? result.predicted : null;
      result.upper = result.forecastCount > 0 ? result.upper : null;
      result.lower = result.forecastCount > 0 ? result.lower : null;
      delete result.actualCount; delete result.forecastCount; delete result.sortKey;
      return result;
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center justify-between space-x-4">
              <span className="text-sm" style={{ color: entry.color }}>{entry.name}:</span>
              <span className="text-sm font-bold text-white">{entry.value ? Math.round(entry.value).toLocaleString() : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const displayData = scenarioGraph ? aggregateData(scenarioGraph.rows, timeView) : [];
  const forecastData = displayData.filter(d => d.predicted !== null && d.predicted > 0);
  const avgPredicted = forecastData.length ? Math.round(forecastData.reduce((s, f) => s + (f.predicted || 0), 0) / forecastData.length) : 0;
  const eventColors = {};
  causalEvents.forEach(event => { eventColors[`${event.typeLabel}_${event.id}`] = event.color; });
  const getChartHeight = () => ({ daily: 450, weekly: 400, monthly: 380, quarterly: 350 }[timeView] || 320);

  return (
    <LayoutWrapper currentPage="causal-analysis" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header title="Causal Analysis & Events" 
        description="Factor Impact, Event Planning & Advanced Forecasting for Beverage Sales" 
        icon={TrendingUp}
        onBack={onBack} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Upload & Analysis</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload historical sales data</p>
                </div>
                <label className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-white cursor-pointer transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`} style={{ backgroundColor: theme.chart }}>
                  <Upload size={18} />
                  <span>{isLoading ? 'Processing...' : 'Upload'}</span>
                  <input type="file" accept=".csv,.xlsx,.xls,.txt,.tsv" onChange={handleFileUploadAndAnalyze} disabled={isLoading} className="hidden" />
                </label>
              </div>
              {uploadStatus && <div className="text-sm font-medium" style={{ color: theme.chart }}>{uploadStatus}</div>}
              {error && <div className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</div>}
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Causal Events</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan and manage events that impact beverage sales</p>
                </div>
                <button 
                  onClick={() => setShowEventModal(true)} 
                  disabled={!file}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-white transition-all ${!file ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`} 
                  style={{ backgroundColor: theme.chart }}
                  title={!file ? 'Upload data first to add events' : 'Add a new causal event'}
                >
                  <Plus size={18} /><span>Add Event</span>
                </button>
              </div>
              <div className="space-y-2">
                {causalEvents.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No causal events added yet. Click "Add Event" to start planning.</div>
                ) : causalEvents.map(event => {
                  const Icon = event.icon;
                  return (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: event.color + '20' }}>
                          <Icon className="w-5 h-5" style={{ color: event.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{event.typeLabel}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.startDate} {event.endDate && `to ${event.endDate}`} • Impact: {event.impact > 0 ? '+' : ''}{event.impact}%
                          </p>
                          {event.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveEvent(event.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {showEventModal && (
              <>
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowEventModal(false)} />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Causal Event</h3>
                      <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Type</label>
                        <select value={newEvent.type} onChange={(e) => {
                          const selected = eventTypes.find(t => t.value === e.target.value);
                          setNewEvent({ ...newEvent, type: e.target.value, impact: selected?.impact || 0 });
                        }} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white">
                          {eventTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                          <input type="date" value={newEvent.startDate} onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})} min={forecastLimits.minDate || today} max={forecastLimits.maxDate || undefined} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date (Optional)</label>
                          <input type="date" value={newEvent.endDate} onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})} min={newEvent.startDate || forecastLimits.minDate || today} max={forecastLimits.maxDate || undefined} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impact (%)</label>
                        <input type="number" value={newEvent.impact} onChange={(e) => setNewEvent({...newEvent, impact: Number(e.target.value)})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white" placeholder="e.g., 25 for +25% or -15 for -15%" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                        <textarea value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 dark:text-white" rows={3} placeholder="Additional notes about this event..." />
                      </div>
                      <button onClick={handleAddEvent} disabled={isLoading} className="w-full py-2 rounded-xl text-white font-medium transition-all hover:scale-[1.02] disabled:opacity-50" style={{ backgroundColor: theme.chart }}>
                        {isLoading ? 'Adding Event...' : 'Add Event'}
                      </button>
                    </div>
                  </Card>
                </div>
              </>
            )}

            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Combined Sales Overview</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Historical data and forecast with events</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(view => (
                    <button key={view} onClick={() => setTimeView(view)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeView === view ? 'text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} style={timeView === view ? { backgroundColor: theme.chart } : {}}>
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {displayData.length > 0 ? (
                <div style={{ height: getChartHeight() }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: timeView === 'daily' ? 80 : 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="ds" stroke="#9CA3AF" tick={{ fontSize: timeView === 'daily' ? 10 : 11, fill: '#9CA3AF' }} angle={timeView === 'daily' ? -45 : timeView === 'weekly' ? -35 : 0} textAnchor={timeView === 'daily' || timeView === 'weekly' ? 'end' : 'middle'} height={timeView === 'daily' ? 80 : 60} interval={timeView === 'daily' && displayData.length > 30 ? Math.floor(displayData.length / 20) : 0} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => v.toLocaleString()} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                      {(timeView === 'monthly' || timeView === 'quarterly' || timeView === 'yearly') ? (
                        <>
                          <Bar dataKey="actual" fill="#10B981" fillOpacity={0.8} name="Actual Sales" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="baseline" fill="#9CA3AF" fillOpacity={0.3} name="Baseline (No Events)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="predicted" fill={theme.chart} fillOpacity={0.7} name="Predicted with Events" radius={[4, 4, 0, 0]} />
                          {scenarioGraph?.eventNames?.map((eventName, idx) => {
                            const color = eventColors[eventName] || `hsl(${idx * 60}, 70%, 60%)`;
                            return <Bar key={eventName} dataKey={eventName} fill={color} fillOpacity={0.5} name={`Impact: ${eventName.split('_').slice(0, -1).join(' ')}`} radius={[4, 4, 0, 0]} />;
                          })}
                        </>
                      ) : (
                        <>
                          <Area type="monotone" dataKey="upper" fill={theme.chart} fillOpacity={0.1} stroke="none" name="Upper Bound" />
                          <Area type="monotone" dataKey="lower" fill={theme.chart} fillOpacity={0.1} stroke="none" name="Lower Bound" />
                          <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} name="Actual Sales" connectNulls={false} />
                          <Line type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline (No Events)" connectNulls={true} />
                          <Line type="monotone" dataKey="predicted" stroke={theme.chart} strokeWidth={3} dot={{ fill: theme.chart, r: 4 }} activeDot={{ r: 6 }} name="Predicted with Events" connectNulls={true} />
                          {scenarioGraph?.eventNames?.map((eventName, idx) => {
                            const color = eventColors[eventName] || `hsl(${idx * 60}, 70%, 60%)`;
                            return <Line key={eventName} type="monotone" dataKey={eventName} stroke={color} strokeWidth={2} strokeDasharray="3 3" dot={false} name={`Impact: ${eventName.split('_').slice(0, -1).join(' ')}`} connectNulls={true} />;
                          })}
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Upload data to see forecast visualization</p>
                </div>
              )}
              
              {forecastPayload && displayData.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-800 dark:text-green-400">Avg {timeView === 'daily' ? 'Daily' : timeView === 'weekly' ? 'Weekly' : timeView === 'monthly' ? 'Monthly' : timeView === 'quarterly' ? 'Quarterly' : 'Yearly'} Sales</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{avgPredicted.toLocaleString()}</div>
                    {causalEvents.length > 0 && <div className="text-xs text-green-700 dark:text-green-400 mt-2">With {causalEvents.length} event{causalEvents.length > 1 ? 's' : ''} impact</div>}
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-400">Total Forecast Period</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{Math.round(forecastData.reduce((sum, d) => sum + (d.predicted || 0), 0)).toLocaleString()}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-400 mt-2">{forecastData.length} {timeView === 'daily' ? 'days' : timeView === 'weekly' ? 'weeks' : timeView === 'monthly' ? 'months' : timeView === 'quarterly' ? 'quarters' : 'years'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-400">Active Events</div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">{causalEvents.length}</div>
                    <div className="text-xs text-purple-700 dark:text-purple-400 mt-2">{causalEvents.filter(e => e.impact > 0).length} positive, {causalEvents.filter(e => e.impact < 0).length} negative</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                    <div className="text-sm font-medium text-orange-800 dark:text-orange-400">Total Impact</div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">
                      {(() => {
                        const totalPredicted = forecastData.reduce((sum, d) => sum + (d.predicted || 0), 0);
                        const totalBaseline = forecastData.reduce((sum, d) => sum + (d.baseline || 0), 0);
                        const impact = totalBaseline > 0 ? ((totalPredicted - totalBaseline) / totalBaseline * 100) : 0;
                        return (impact > 0 ? '+' : '') + impact.toFixed(1);
                      })()}%
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-400 mt-2">vs baseline forecast</div>
                  </div>
                </div>
              )}
            </Card>

            {displayData.length > 0 && forecastData.length > 0 && (
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Forecast with Event Impact Breakdown</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Detailed view of how each event affects the forecast</p>
                </div>
                {causalEvents.length === 0 ? (
                  <>
                    <div style={{ height: 420 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                          <XAxis dataKey="ds" stroke="#9CA3AF" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={80} interval={timeView === 'daily' && forecastData.length > 50 ? Math.floor(forecastData.length / 30) : 0} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => v.toLocaleString()} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
                          {(timeView === 'monthly' || timeView === 'quarterly' || timeView === 'yearly') ? (
                            <>
                              <Bar dataKey="baseline" fill="#9CA3AF" fillOpacity={0.4} name="Baseline Forecast" radius={[4, 4, 0, 0]} />
                              <Line type="monotone" dataKey="predicted" stroke={theme.chart} strokeWidth={3} dot={{ fill: theme.chart, r: 4 }} name="Baseline Forecast" />
                            </>
                          ) : (
                            <>
                              <Line type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline Forecast" connectNulls={true} />
                              <Line type="monotone" dataKey="predicted" stroke={theme.chart} strokeWidth={3} dot={{ fill: theme.chart, r: 4 }} activeDot={{ r: 6 }} name="Baseline Forecast" connectNulls={true} />
                            </>
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400" />
                      <p className="font-medium text-gray-700 dark:text-gray-300">No causal events added yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Add events above to see their impact breakdown on the forecast</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ height: 420 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                          <XAxis dataKey="ds" stroke="#9CA3AF" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={80} interval={timeView === 'daily' && forecastData.length > 50 ? Math.floor(forecastData.length / 30) : 0} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => v.toLocaleString()} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
                          {(timeView === 'monthly' || timeView === 'quarterly' || timeView === 'yearly') ? (
                            <>
                              <Bar dataKey="baseline" fill="#9CA3AF" fillOpacity={0.4} name="Baseline Forecast" radius={[4, 4, 0, 0]} />
                              {scenarioGraph?.eventNames?.map((eventName, idx) => {
                                const color = eventColors[eventName] || `hsl(${idx * 60}, 70%, 60%)`;
                                return <Bar key={eventName} dataKey={eventName} stackId="events" fill={color} fillOpacity={0.8} name={eventName.split('_').slice(0, -1).join(' ')} radius={idx === scenarioGraph.eventNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />;
                              })}
                              <Line type="monotone" dataKey="predicted" stroke={theme.chart} strokeWidth={3} dot={{ fill: theme.chart, r: 4 }} name="Total Predicted" />
                            </>
                          ) : (
                            <>
                              <Line type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline Forecast" connectNulls={true} />
                              {scenarioGraph?.eventNames?.map((eventName, idx) => {
                                const color = eventColors[eventName] || `hsl(${idx * 60}, 70%, 60%)`;
                                return <Line key={eventName} type="monotone" dataKey={eventName} stroke={color} strokeWidth={2} strokeDasharray="3 3" dot={false} name={eventName.split('_').slice(0, -1).join(' ')} connectNulls={true} />;
                              })}
                              <Line type="monotone" dataKey="predicted" stroke={theme.chart} strokeWidth={3} dot={{ fill: theme.chart, r: 4 }} activeDot={{ r: 6 }} name="Total Predicted" connectNulls={true} />
                            </>
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {causalEvents.map((event) => {
                        const eventKey = `${event.typeLabel}_${event.id}`;
                        const totalImpact = forecastData.reduce((sum, d) => sum + (d[eventKey] || 0), 0);
                        const Icon = event.icon;
                        return (
                          <div key={event.id} className="p-3 rounded-lg border" style={{ backgroundColor: event.color + '10', borderColor: event.color + '40' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" style={{ color: event.color }} />
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">{event.typeLabel}</span>
                            </div>
                            <div className="text-lg font-bold" style={{ color: event.color }}>
                              {totalImpact > 0 ? '+' : ''}{Math.round(totalImpact).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">cumulative impact</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
            )}

            {displayData.length > 0 && displayData.some(d => d.actual !== null) && (
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Historical Sales Analysis</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Actual sales performance and trends over time</p>
                </div>
                <div style={{ height: 420 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={displayData.filter(d => d.actual !== null)} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="ds" stroke="#9CA3AF" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => v.toLocaleString()} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      {(timeView === 'monthly' || timeView === 'quarterly' || timeView === 'yearly') ? (
                        <Bar dataKey="actual" fill="#10B981" fillOpacity={0.8} name="Actual Sales" radius={[4, 4, 0, 0]} />
                      ) : (
                        <>
                          <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} fill="url(#colorActual)" name="Actual Sales" />
                          <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={0} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const historicalData = displayData.filter(d => d.actual !== null && d.actual > 0);
                    const totalSales = historicalData.reduce((sum, d) => sum + d.actual, 0);
                    const avgSales = historicalData.length > 0 ? totalSales / historicalData.length : 0;
                    const maxSales = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.actual)) : 0;
                    
                    let growthRate = 0;
                    if (historicalData.length >= 2) {
                      const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
                      const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));
                      const firstAvg = firstHalf.reduce((s, d) => s + d.actual, 0) / firstHalf.length;
                      const secondAvg = secondHalf.reduce((s, d) => s + d.actual, 0) / secondHalf.length;
                      growthRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg * 100) : 0;
                    }
                    
                    return (
                      <>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                          <div className="text-sm font-medium text-green-800 dark:text-green-400">Total Sales</div>
                          <div className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{Math.round(totalSales).toLocaleString()}</div>
                          <div className="text-xs text-green-700 dark:text-green-400 mt-2">{historicalData.length} periods</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-400">Average Sales</div>
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{Math.round(avgSales).toLocaleString()}</div>
                          <div className="text-xs text-blue-700 dark:text-blue-400 mt-2">per {timeView === 'daily' ? 'day' : timeView === 'weekly' ? 'week' : timeView === 'monthly' ? 'month' : timeView === 'quarterly' ? 'quarter' : 'year'}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                          <div className="text-sm font-medium text-purple-800 dark:text-purple-400">Peak Sales</div>
                          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">{Math.round(maxSales).toLocaleString()}</div>
                          <div className="text-xs text-purple-700 dark:text-purple-400 mt-2">highest period</div>
                        </div>
                        <div className={`p-4 rounded-xl border ${growthRate >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'}`}>
                          <div className={`text-sm font-medium ${growthRate >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-orange-800 dark:text-orange-400'}`}>Growth Rate</div>
                          <div className={`text-2xl font-bold mt-1 ${growthRate >= 0 ? 'text-emerald-900 dark:text-emerald-300' : 'text-orange-900 dark:text-orange-300'}`}>
                            {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
                          </div>
                          <div className={`text-xs mt-2 ${growthRate >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>period over period</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>
            )}

            {featureImportance.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Importance</h3>
                <div className="space-y-3">
                  {featureImportance.slice(0, 8).map((f, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{f.feature}</span>
                        <span className="font-semibold" style={{ color: theme.chart }}>{(f.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${f.importance * 100}%`, backgroundColor: theme.chart }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default CausalAnalysis;