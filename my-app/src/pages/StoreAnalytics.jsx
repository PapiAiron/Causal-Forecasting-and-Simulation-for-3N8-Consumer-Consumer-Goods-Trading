import React from 'react';
import { BarChart3, TrendingUp, Store, Award, Calendar } from 'lucide-react';
import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';
import { useTheme } from '../components/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StoreAnalytics = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();

  // Sample data for top stores
  const topStores = [
    { name: 'Downtown Market', sales: 45230, growth: 12.5, rank: 1 },
    { name: 'Northside Store', sales: 38950, growth: 8.3, rank: 2 },
    { name: 'Southgate Mall', sales: 35120, growth: -2.1, rank: 3 },
    { name: 'Eastwood Plaza', sales: 32480, growth: 15.7, rank: 4 },
    { name: 'Westside Center', sales: 28900, growth: 5.2, rank: 5 },
  ];

  // Chart data
  const chartData = [
    { day: 'Mon', sales: 4200 },
    { day: 'Tue', sales: 3800 },
    { day: 'Wed', sales: 5100 },
    { day: 'Thu', sales: 4600 },
    { day: 'Fri', sales: 5500 },
    { day: 'Sat', sales: 6200 },
    { day: 'Sun', sales: 4900 },
  ];

  return (
    <LayoutWrapper currentPage="store-analytics" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header 
          title="Store Analytics" 
          description="Top buyers, demand patterns, and sales trends across all stores"
          icon={BarChart3}
          onBack={onBack}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Stores</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">24</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: theme.chart + '20' }}>
                  <Store className="w-6 h-6" style={{ color: theme.chart }} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">Downtown</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
                  <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Growth</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">+7.9%</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Peak Day</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Saturday</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Weekly Sales Chart */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Weekly Sales Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="sales" fill={theme.chart} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Stores List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Performing Stores
            </h3>
            <div className="space-y-3">
              {topStores.map((store) => (
                <div 
                  key={store.rank}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: theme.chart }}
                    >
                      #{store.rank}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {store.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Sales: ₱{store.sales.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${store.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {store.growth > 0 ? '+' : ''}{store.growth}%
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Growth</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </main>
      </div>
    </LayoutWrapper>
  );
};

export default StoreAnalytics;