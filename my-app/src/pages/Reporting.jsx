import React, { useState } from 'react';
import { Calendar, Download, FileText, TrendingUp, BarChart2 } from 'lucide-react';
import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';
import { useTheme } from '../components/ThemeContext';

const Reporting = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const reportTypes = [
    {
      id: 'monthly',
      title: 'Monthly Reports',
      description: 'Detailed monthly sales breakdown and trends',
      icon: Calendar,
      color: theme.chart,
      reports: 12
    },
    {
      id: 'weekly',
      title: 'Weekly Reports',
      description: 'Week-over-week performance analysis',
      icon: BarChart2,
      color: '#10B981',
      reports: 52
    },
    {
      id: 'yearly',
      title: 'Yearly Reports',
      description: 'Annual performance and growth metrics',
      icon: TrendingUp,
      color: '#F59E0B',
      reports: 3
    },
    {
      id: 'category',
      title: 'Category Reports',
      description: 'Sales by product category and bottle size',
      icon: FileText,
      color: '#8B5CF6',
      reports: 8
    }
  ];

  const sampleReports = [
    { name: 'December 2024 Sales', date: '2024-12-01', size: '2.4 MB', type: 'monthly' },
    { name: 'November 2024 Sales', date: '2024-11-01', size: '2.1 MB', type: 'monthly' },
    { name: 'October 2024 Sales', date: '2024-10-01', size: '2.3 MB', type: 'monthly' },
    { name: 'Week 48 Report', date: '2024-11-25', size: '856 KB', type: 'weekly' },
    { name: 'Week 47 Report', date: '2024-11-18', size: '892 KB', type: 'weekly' },
    { name: 'Q4 2024 Summary', date: '2024-10-01', size: '4.2 MB', type: 'yearly' },
  ];

  const filteredReports = selectedPeriod === 'all' 
    ? sampleReports 
    : sampleReports.filter(r => r.type === selectedPeriod);

  return (
    <LayoutWrapper currentPage="reporting" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header 
          title="Full Reporting System" 
          description="Comprehensive sales reports: monthly, weekly, yearly, and category analysis"
          icon={FileText}
          onBack={onBack}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Report Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {reportTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedPeriod(type.id)}
                  className={`text-left transition-all duration-200 ${
                    selectedPeriod === type.id ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <Card className={`p-6 ${selectedPeriod === type.id ? 'ring-2' : ''}`}
                    style={selectedPeriod === type.id ? { ringColor: type.color } : {}}>
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: type.color + '20' }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: type.color }} />
                      </div>
                      <span className="text-2xl font-bold" style={{ color: type.color }}>
                        {type.reports}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {type.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {type.description}
                    </p>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Reports List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Reports
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <button
                onClick={() => setSelectedPeriod('all')}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ 
                  backgroundColor: selectedPeriod === 'all' ? theme.chart : 'transparent',
                  color: selectedPeriod === 'all' ? 'white' : theme.chart,
                  border: `2px solid ${theme.chart}`
                }}
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reports available for this category</p>
                </div>
              ) : (
                filteredReports.map((report, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: theme.chart + '20' }}
                      >
                        <FileText className="w-5 h-5" style={{ color: theme.chart }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {report.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(report.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                            {report.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      style={{ backgroundColor: theme.chart }}
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Reporting;