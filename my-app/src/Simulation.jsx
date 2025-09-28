import React, { useState } from 'react';
import { Play, Upload, BarChart3, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { useTheme } from './ThemeContext';
import { Card, Header } from './SharedComponents';
import { LayoutWrapper } from './DashboardHome';

const Simulation = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [forecastFile, setForecastFile] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [simulationParams, setSimulationParams] = useState({
    stock: 1000,
    lead_time: 2,
    days: 30
  });
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  const simulationScenarios = {
    baseline: { 
      name: 'Baseline', 
      demand: 100, 
      cost: 100, 
      efficiency: 85,
      description: 'Normal operating conditions'
    },
    promotion: { 
      name: 'High Promotion', 
      demand: 130, 
      cost: 115, 
      efficiency: 82,
      description: 'Promotional campaign period'
    },
    seasonal: { 
      name: 'Seasonal Peak', 
      demand: 150, 
      cost: 105, 
      efficiency: 78,
      description: 'Peak seasonal demand'
    },
    disruption: { 
      name: 'Supply Disruption', 
      demand: 70, 
      cost: 140, 
      efficiency: 60,
      description: 'Supply chain disruption scenario'
    },
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setForecastFile(file);
    setIsLoadingForecast(true);
    setUploadStatus('Processing forecast data...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/forecast', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setForecast(data);
        setUploadStatus('Forecast data loaded successfully!');
      } else {
        const error = await response.json();
        setUploadStatus(`Error: ${error.error}`);
        setForecast(null);
      }
    } catch (error) {
      console.error('Forecast error:', error);
      setUploadStatus('Failed to load forecast data.');
      setForecast(null);
    } finally {
      setIsLoadingForecast(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const runSimulation = async () => {
    setSimulationRunning(true);
    
    const simulationData = {
      scenario: selectedScenario,
      stock: simulationParams.stock,
      lead_time: simulationParams.lead_time,
      days: simulationParams.days,
    };

    // Add forecast data if available
    if (forecast && forecast.forecast) {
      simulationData.forecast = forecast.forecast.map(f => f.yhat);
    }

    try {
      const response = await fetch('http://localhost:5000/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationData),
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationResults(data);
      } else {
        const error = await response.json();
        console.error('Simulation error:', error.error);
        // Fallback to mock data
        const scenario = simulationScenarios[selectedScenario];
        setSimulationResults({
          scenario: selectedScenario,
          final_inventory: {
            stock: Math.floor(simulationParams.stock * (scenario.efficiency / 100)),
            shortages: Math.floor(50 * (1 - scenario.efficiency / 100)),
            service_level: scenario.efficiency / 100
          },
          scenario_impact: {
            demand: scenario.demand,
            cost: scenario.cost,
            efficiency: scenario.efficiency
          }
        });
      }
    } catch (error) {
      console.error('Simulation error:', error);
      // Fallback to mock data
      const scenario = simulationScenarios[selectedScenario];
      setSimulationResults({
        scenario: selectedScenario,
        final_inventory: {
          stock: Math.floor(simulationParams.stock * (scenario.efficiency / 100)),
          shortages: Math.floor(50 * (1 - scenario.efficiency / 100)),
          service_level: scenario.efficiency / 100
        },
        scenario_impact: {
          demand: scenario.demand,
          cost: scenario.cost,
          efficiency: scenario.efficiency
        }
      });
    } finally {
      setSimulationRunning(false);
    }
  };

  const getRecommendation = (scenarioKey) => {
    const recommendations = {
      baseline: 'Current operations are running within normal parameters. Continue monitoring key metrics.',
      promotion: 'Increase inventory levels by 20% and prepare additional logistics capacity for promotional campaigns.',
      seasonal: 'Scale up production capacity and ensure adequate safety stock to handle seasonal demand peaks.',
      disruption: 'Activate alternative suppliers and implement emergency inventory protocols immediately.'
    };
    return recommendations[scenarioKey];
  };

  const getScenarioRiskLevel = (scenarioKey) => {
    const riskLevels = {
      baseline: { level: 'Low', color: 'text-green-600' },
      promotion: { level: 'Medium', color: 'text-yellow-600' },
      seasonal: { level: 'High', color: 'text-orange-600' },
      disruption: { level: 'Critical', color: 'text-red-600' }
    };
    return riskLevels[scenarioKey];
  };

  const comparisonData = simulationResults ? [
    { metric: 'Demand', Baseline: 100, Scenario: simulationResults.scenario_impact?.demand || simulationScenarios[selectedScenario].demand },
    { metric: 'Cost', Baseline: 100, Scenario: simulationResults.scenario_impact?.cost || simulationScenarios[selectedScenario].cost },
    { metric: 'Efficiency', Baseline: 85, Scenario: simulationResults.scenario_impact?.efficiency || simulationScenarios[selectedScenario].efficiency }
  ] : [];

  const forecastChartData = forecast?.forecast?.slice(0, 7).map((item, index) => ({
    day: `Day ${index + 1}`,
    forecast: Math.round(item.yhat),
    lower: Math.round(item.yhat_lower || item.yhat * 0.9),
    upper: Math.round(item.yhat_upper || item.yhat * 1.1)
  })) || [];

  return (
    <LayoutWrapper currentPage="simulation" onNavigate={onNavigate}>
      <Header
        title="Simulation"
        description="Scenario Analysis & Risk Assessment"
        icon={Play}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* File Upload Section */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Upload Sales Data</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload CSV to use Prophet forecasting in simulation (optional)
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <label className={`flex items-center space-x-2 px-4 py-2 ${theme.primary} text-white rounded-lg cursor-pointer ${theme.primaryHover} transition ${isLoadingForecast ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload size={18} />
                  <span>{isLoadingForecast ? 'Processing...' : 'Choose CSV File'}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isLoadingForecast}
                    className="hidden"
                  />
                </label>
                {forecastFile && !isLoadingForecast && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {forecastFile.name}
                  </span>
                )}
                {uploadStatus && (
                  <span className={`text-sm ${uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {uploadStatus}
                  </span>
                )}
              </div>
            </div>
            {forecast && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      Forecast Generated: {forecast.forecast?.length || 0} data points
                    </span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">
                    {forecast.metrics?.mae && `MAE: ${forecast.metrics.mae.toFixed(2)}`}
                    {forecast.metrics?.rmse && `, RMSE: ${forecast.metrics.rmse.toFixed(2)}`}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Forecast Preview */}
          {forecast && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">7-Day Forecast Preview</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke={theme.chart} 
                    strokeWidth={2}
                    name="Forecast"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upper" 
                    stroke="#10b981" 
                    strokeDasharray="5 5" 
                    strokeWidth={1}
                    name="Upper Bound"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lower" 
                    stroke="#10b981" 
                    strokeDasharray="5 5" 
                    strokeWidth={1}
                    name="Lower Bound"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Simulation Parameters */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Simulation Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={simulationParams.stock}
                  onChange={(e) => setSimulationParams(prev => ({...prev, stock: parseInt(e.target.value) || 1000}))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  value={simulationParams.lead_time}
                  onChange={(e) => setSimulationParams(prev => ({...prev, lead_time: parseInt(e.target.value) || 2}))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Simulation Days
                </label>
                <input
                  type="number"
                  value={simulationParams.days}
                  onChange={(e) => setSimulationParams(prev => ({...prev, days: parseInt(e.target.value) || 30}))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="365"
                />
              </div>
            </div>
          </Card>

          {/* Scenario Selection and Simulation */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Scenario Simulation</h2>
              <button
                onClick={runSimulation}
                disabled={simulationRunning}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  simulationRunning
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : `${theme.primary} text-white ${theme.primaryHover}`
                }`}
              >
                <Play size={18} />
                <span>{simulationRunning ? 'Running...' : 'Run Simulation'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(simulationScenarios).map(([key, scenario]) => {
                const riskLevel = getScenarioRiskLevel(key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedScenario(key)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedScenario === key
                        ? 'border-current shadow-md'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    style={selectedScenario === key ? {
                      borderColor: theme.chart,
                      backgroundColor: theme.secondary,
                      color: theme.accent
                    } : {}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{scenario.name}</h3>
                      <div className="flex items-center space-x-1">
                        <AlertTriangle size={12} className={riskLevel.color} />
                        <span className={`text-xs ${riskLevel.color}`}>
                          {riskLevel.level}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs opacity-75 mb-3">{scenario.description}</p>
                    <div className="space-y-1 text-sm">
                      <div>Demand: {scenario.demand}%</div>
                      <div>Cost: {scenario.cost}%</div>
                      <div>Efficiency: {scenario.efficiency}%</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {simulationRunning && (
              <div className={`${theme.secondary} border rounded-lg p-4 mb-6`} style={{ borderColor: theme.chart }}>
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: theme.chart }}></div>
                  <span className={`${theme.accent} font-medium`}>
                    Simulating {simulationScenarios[selectedScenario].name} scenario for {simulationParams.days} days...
                  </span>
                </div>
              </div>
            )}

            {simulationResults && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white mb-4">Impact Comparison</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, '']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar dataKey="Baseline" fill="#9ca3af" name="Baseline" />
                      <Bar dataKey="Scenario" fill={theme.chart} name={simulationScenarios[selectedScenario].name} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white mb-4">Simulation Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Final Stock</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {simulationResults.final_inventory.stock.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Total Shortages</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {simulationResults.final_inventory.shortages.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Service Level</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {(simulationResults.final_inventory.service_level * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Scenario</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {simulationScenarios[simulationResults.scenario].name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Results Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">Scenario Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Selected Scenario:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {simulationScenarios[selectedScenario].name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risk Level:</span>
                  <span className={`text-sm font-medium ${getScenarioRiskLevel(selectedScenario).color}`}>
                    {getScenarioRiskLevel(selectedScenario).level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Demand Impact:</span>
                  <span className={`text-sm font-medium ${theme.accent}`}>
                    {simulationScenarios[selectedScenario].demand}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cost Impact:</span>
                  <span className={`text-sm font-medium ${theme.accent}`}>
                    {simulationScenarios[selectedScenario].cost}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Expected Efficiency:</span>
                  <span className={`text-sm font-medium ${theme.accent}`}>
                    {simulationScenarios[selectedScenario].efficiency}%
                  </span>
                </div>
                {forecast && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Forecast Data:</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">Recommendations</h3>
              <div className="text-sm">
                <div className="p-3 rounded-lg bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  <p className="mb-2">{getRecommendation(selectedScenario)}</p>
                  {simulationResults && (
                    <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                      <p className="font-medium mb-1">Based on simulation results:</p>
                      {simulationResults.final_inventory.service_level < 0.9 && (
                        <p className="text-red-600 dark:text-red-400">• Consider increasing safety stock levels</p>
                      )}
                      {simulationResults.final_inventory.shortages > 100 && (
                        <p className="text-orange-600 dark:text-orange-400">• High shortage risk - review reorder points</p>
                      )}
                      {simulationResults.final_inventory.service_level >= 0.95 && (
                        <p className="text-green-600 dark:text-green-400">• Excellent service level maintained</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </LayoutWrapper>
  );
};
export default Simulation;