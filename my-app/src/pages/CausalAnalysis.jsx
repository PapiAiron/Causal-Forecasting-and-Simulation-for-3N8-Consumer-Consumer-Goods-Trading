import React, { useState } from 'react';
import { TrendingUp, Upload, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useTheme } from "../components/ThemeContext";


import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';

const CausalAnalysis = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [causalFactorsData, setCausalFactorsData] = useState([]);
  const [seasonalData, setSeasonalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysisGenerated, setAnalysisGenerated] = useState(false);

  // Default data
  const defaultCausalFactors = [
    { factor: 'Price Changes', correlation: 0.85 },
    { factor: 'Marketing Spend', correlation: 0.72 },
    { factor: 'Competitor Activity', correlation: 0.68 },
    { factor: 'Weather Conditions', correlation: 0.45 },
    { factor: 'Economic Index', correlation: 0.38 },
    { factor: 'Social Media', correlation: 0.25 }
  ];

  const defaultSeasonalData = [
    { month: 'Jan', seasonalFactor: 1.2, promotionImpact: 0.1, actualDemand: 150 },
    { month: 'Feb', seasonalFactor: 1.1, promotionImpact: 0.05, actualDemand: 140 },
    { month: 'Mar', seasonalFactor: 1.3, promotionImpact: 0.2, actualDemand: 180 },
    { month: 'Apr', seasonalFactor: 1.5, promotionImpact: 0.15, actualDemand: 200 },
    { month: 'May', seasonalFactor: 1.6, promotionImpact: 0.3, actualDemand: 240 },
    { month: 'Jun', seasonalFactor: 1.4, promotionImpact: 0.25, actualDemand: 220 },
  ];

  // Initialize with default data
  React.useEffect(() => {
    setCausalFactorsData(defaultCausalFactors);
    setSeasonalData(defaultSeasonalData);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus('Analyzing causal factors...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/causal-analysis', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCausalFactorsData(data.causal_factors || defaultCausalFactors);
        setSeasonalData(data.seasonal_data || defaultSeasonalData);
        setAnalysisGenerated(true);
        setUploadStatus('Causal analysis completed!');
      } else {
        const error = await response.json();
        setUploadStatus(`Error: ${error.error}`);
        setCausalFactorsData(defaultCausalFactors);
        setSeasonalData(defaultSeasonalData);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setUploadStatus('Analysis failed. Showing sample data.');
      setCausalFactorsData(defaultCausalFactors);
      setSeasonalData(defaultSeasonalData);
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const insights = [
    {
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-800 dark:text-blue-300',
      title: 'Price Strategy',
      description: 'Monitor competitor pricing closely and implement dynamic pricing strategies.'
    },
    {
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-300',
      title: 'Marketing Focus',
      description: 'Increase marketing spend during high-seasonal periods for maximum impact.'
    },
    {
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-800 dark:text-orange-300',
      title: 'Seasonal Planning',
      description: 'Prepare inventory and resources for April-May seasonal peaks.'
    }
  ];

  const getTopFactor = () => {
    if (causalFactorsData.length === 0) return null;
    return causalFactorsData.reduce((prev, current) => 
      (prev.correlation > current.correlation) ? prev : current
    );
  };

  const getAverageCorrelation = () => {
    if (causalFactorsData.length === 0) return 0;
    const sum = causalFactorsData.reduce((acc, factor) => acc + factor.correlation, 0);
    return (sum / causalFactorsData.length).toFixed(2);
  };

  return (
    <LayoutWrapper currentPage="causal-analysis" onNavigate={onNavigate}>
      <Header
        title="Causal Analysis"
        description="Factor Impact & Correlation Analysis"
        icon={TrendingUp}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* File Upload Section */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Upload Data for Analysis</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload CSV with sales data and potential causal factors (price, marketing, promo, etc.)
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <label className={`flex items-center space-x-2 px-4 py-2 ${theme.primary} text-white rounded-lg cursor-pointer ${theme.primaryHover} transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload size={18} />
                  <span>{isLoading ? 'Analyzing...' : 'Upload CSV'}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="hidden"
                  />
                </label>
                {uploadStatus && (
                  <span className={`text-sm ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {uploadStatus}
                  </span>
                )}
              </div>
            </div>
            {analysisGenerated && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BarChart3 size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Analysis completed with {causalFactorsData.length} factors identified
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Main Analysis Chart */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Causal Factors Impact Analysis</h2>
                {!analysisGenerated && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Showing sample data - upload your CSV for real analysis</p>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <div>Correlation strength: 0.0 - 1.0</div>
                <div>Average: {getAverageCorrelation()}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={causalFactorsData} layout="horizontal" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(tick) => `${tick * 100}%`} />
                <YAxis dataKey="factor" type="category" width={120} />
                <Tooltip 
                  formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Correlation']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="correlation" fill={theme.chart} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Secondary Analysis Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Seasonal Impact by Month</h2>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(2), 'Seasonal Factor']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="seasonalFactor"
                    stroke="#f59e0b"
                    fill="#fef3c7"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Promotion Effectiveness</h2>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="promotionImpact" name="Promotion Impact" />
                  <YAxis type="number" dataKey="actualDemand" name="Actual Demand" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name === 'actualDemand' ? 'Actual Demand' : name]}
                    labelFormatter={() => ''}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Scatter dataKey="actualDemand" fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Insights and Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">Key Insights</h3>
              <div className="space-y-3 text-sm">
                {getTopFactor() && (
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {getTopFactor().factor} shows the strongest correlation ({(getTopFactor().correlation * 100).toFixed(0)}%) with demand
                    </span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {causalFactorsData.filter(f => f.correlation > 0.6).length} factors show strong correlation (60%+)
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                  <span className="text-gray-600 dark:text-gray-400">Seasonal factors peak in April-May period</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">Top Factors</h3>
              <div className="space-y-3">
                {causalFactorsData.slice(0, 4).map((factor, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">{factor.factor}</span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${factor.correlation * 100}%`,
                            backgroundColor: theme.chart
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {(factor.correlation * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">Recommendations</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {insights.map((insight, index) => (
                  <div key={index} className={`p-3 ${insight.bgColor} rounded-lg`}>
                    <strong className={insight.textColor}>{insight.title}:</strong>
                    <p className="mt-1">{insight.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Summary Statistics */}
          {analysisGenerated && (
            <Card className="p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">Analysis Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{causalFactorsData.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Factors Analyzed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">
                    {causalFactorsData.filter(f => f.correlation > 0.7).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">High Impact (70%+)</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{getAverageCorrelation()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Correlation</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">
                    {getTopFactor() ? (getTopFactor().correlation * 100).toFixed(0) + '%' : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Strongest Factor</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </LayoutWrapper>
  );
};

export default CausalAnalysis;