import React from 'react';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTheme } from './ThemeContext';
import { Card, Header } from './SharedComponents';
import { LayoutWrapper } from './DashboardHome';

const Overview = ({ onNavigate }) => {
  const { theme } = useTheme();

  const demandForecastData = [
    { month: 'Jan', actual: 120, predicted: 115, causal: 118 },
    { month: 'Feb', actual: 135, predicted: 125, causal: 132 },
    { month: 'Mar', actual: 148, predicted: 140, causal: 145 },
    { month: 'Apr', actual: 162, predicted: 155, causal: 160 },
    { month: 'May', actual: 175, predicted: 170, causal: 174 },
    { month: 'Jun', actual: 188, predicted: 185, causal: 187 }
  ];

  const kpiData = [
    { name: 'Forecast Accuracy', value: 92.5, unit: '%', target: 90 },
    { name: 'Inventory Turnover', value: 6.8, unit: '', target: 7 },
    { name: 'On-Time Delivery', value: 98.2, unit: '%', target: 98 },
    { name: 'Stockout Rate', value: 1.5, unit: '%', target: 2 },
  ];

  const inventoryData = [
    { product: 'Product A', current: 1200, optimal: 1000, status: 'high' },
    { product: 'Product B', current: 450, optimal: 500, status: 'low' },
    { product: 'Product C', current: 800, optimal: 800, status: 'good' },
    { product: 'Product D', current: 50, optimal: 200, status: 'critical' },
  ];

  const KPICard = ({ name, value, target, unit }) => {
    const isGood = name.toLowerCase().includes('rate') ? value <= target : value >= target;
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{name}</h3>
        </div>
        <p className={`text-2xl font-semibold mb-1 ${isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {value}{unit}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">Target: {target}{unit}</p>
          <div className={`text-xs px-2 py-1 rounded-full ${
            isGood 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            {isGood ? 'On Target' : 'Below Target'}
          </div>
        </div>
      </Card>
    );
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'low': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'high': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'critical': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <LayoutWrapper currentPage="overview" onNavigate={onNavigate}>
      <Header
        title="Overview"
        description="Key Performance Indicators & Forecasting"
        icon={BarChart3}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Demand Forecasting Comparison</h2>
              <div className="flex flex-wrap space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Actual</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: theme.chart }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Traditional</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Prophet</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={demandForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  name="Actual" 
                  stroke="#9ca3af" 
                  strokeWidth={2}
                  dot={{ fill: '#9ca3af', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  name="Traditional" 
                  stroke={theme.chart} 
                  strokeWidth={2}
                  dot={{ fill: theme.chart, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="causal" 
                  name="Prophet" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Current Inventory Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventoryData.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">{item.product}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Current:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.current.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Optimal:</span>
                      <span className="text-gray-900 dark:text-white">{item.optimal.toLocaleString()}</span>
                    </div>
                    <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-full text-center ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </LayoutWrapper>
  );
};

export default Overview;