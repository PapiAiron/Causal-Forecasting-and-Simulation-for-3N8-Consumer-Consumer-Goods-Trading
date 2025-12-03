import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, TrendingUp, BarChart2, RefreshCw, ChevronDown, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  PieChart,
  Pie,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  Cell
} from 'recharts';
import { useTheme } from "../components/ThemeContext";
import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};

const Reporting = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [fullReports, setFullReports] = useState(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState(null);
  const [storeAnalytics, setStoreAnalytics] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Monitor authentication and load data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadReportingData(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load reporting data from Firebase
  const loadReportingData = async (userId) => {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'userFiles', userId);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✓ Loading reporting data from Firestore');
        
        // Load reporting data
        if (data.reportingData) {
          setFullReports(data.reportingData.fullReports);
          setCategoryAnalysis(data.reportingData.categoryAnalysis);
          setStoreAnalytics(data.reportingData.storeAnalytics);
          setLastUpdated(data.reportingData.savedAt);
        } else if (data.analysisData) {
          // Fallback: Load from analysisData if reportingData doesn't exist
          setFullReports(data.analysisData.fullReports);
          setCategoryAnalysis(data.analysisData.categoryAnalysis);
          setStoreAnalytics(data.analysisData.storeAnalytics);
          setLastUpdated(data.uploadedAt);
        }
      } else {
        console.log('No saved data found for this user');
      }
    } catch (error) {
      console.error('Error loading from Firestore:', error);
      setError('Failed to load reporting data');
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'monthly',
      title: 'Monthly Reports',
      description: 'Detailed monthly breakdown',
      icon: Calendar,
      color: '#8B5CF6',
      count: fullReports?.monthly?.length || 0
    },
    {
      id: 'weekly',
      title: 'Weekly Reports',
      description: 'Week-over-week analysis',
      icon: BarChart2,
      color: '#10B981',
      count: fullReports?.weekly?.length || 0
    },
    {
      id: 'yearly',
      title: 'Yearly Reports',
      description: 'Annual performance',
      icon: TrendingUp,
      color: '#F59E0B',
      count: fullReports?.yearly?.length || 0
    },
    {
      id: 'category',
      title: 'Category Analysis',
      description: 'Product & bottle size',
      icon: FileText,
      color: '#3B82F6',
      count: categoryAnalysis ? 1 : 0
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold text-xs mb-2">{payload[0].payload.month || payload[0].payload.week || payload[0].payload.year || payload[0].name}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-xs font-bold text-white">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

  if (isLoading) {
    return (
      <LayoutWrapper currentPage="reporting" onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your reports...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper currentPage="reporting" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header 
          title="Full Reporting System" 
          description="Comprehensive sales analytics with monthly, weekly, yearly reports and category insights"
          icon={FileText}
          onBack={onBack}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Info Banner */}
          {lastUpdated && (
            <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      Reports loaded from Causal Analysis
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Last updated: {new Date(lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('causal-analysis')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: theme.chart }}
                >
                  <RefreshCw size={16} />
                  Upload New Data
                </button>
              </div>
            </Card>
          )}

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
                    style={selectedPeriod === type.id ? { borderColor: type.color, borderWidth: '2px' } : {}}>
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: type.color + '20' }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: type.color }} />
                      </div>
                      <span className="text-2xl font-bold" style={{ color: type.color }}>
                        {type.count}
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

          {/* Monthly Reports */}
          {selectedPeriod === 'monthly' && fullReports?.monthly && (
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📅 Monthly Sales Reports</h3>
              
              {/* Monthly Trend Chart */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">Sales Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={fullReports.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="total_sales" fill="#8B5CF6" fillOpacity={0.2} stroke="#8B5CF6" name="Total Sales" />
                    <Line type="monotone" dataKey="total_sales" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} name="Sales" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Data Table */}
              <CollapsibleSection title="Detailed Monthly Breakdown" defaultOpen={true}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Month</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Total Sales</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Avg Daily</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fullReports.monthly.map((month, idx) => {
                        const prevMonth = fullReports.monthly[idx - 1];
                        const growth = prevMonth ? ((month.total_sales - prevMonth.total_sales) / prevMonth.total_sales * 100) : 0;
                        return (
                          <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{month.month}</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{month.total_sales.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{Math.round(month.total_sales / 30).toLocaleString()}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CollapsibleSection>
            </Card>
          )}

          {/* Weekly Reports */}
          {selectedPeriod === 'weekly' && fullReports?.weekly && (
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 Weekly Sales Reports</h3>
              
              {/* Weekly Bar Chart */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">Weekly Performance</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={fullReports.weekly.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="week" stroke="#9CA3AF" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="total_sales" fill="#10B981" name="Sales" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <CollapsibleSection title="Weekly Data" defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fullReports.weekly.slice(-12).map((week, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                      <div className="text-sm font-medium text-green-800 dark:text-green-400">{week.week}</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{week.total_sales.toLocaleString()}</div>
                      <div className="text-xs text-green-700 dark:text-green-400 mt-1">units sold</div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </Card>
          )}

          {/* Yearly Reports */}
          {selectedPeriod === 'yearly' && fullReports?.yearly && (
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📈 Yearly Sales Reports</h3>
              
              {/* Yearly Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {fullReports.yearly.map((year, idx) => {
                  const prevYear = fullReports.yearly[idx - 1];
                  const growth = prevYear ? ((year.total_sales - prevYear.total_sales) / prevYear.total_sales * 100) : 0;
                  return (
                    <div key={idx} className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800">
                      <div className="text-sm font-medium text-amber-800 dark:text-amber-400">Year {year.year}</div>
                      <div className="text-3xl font-bold text-amber-900 dark:text-amber-300 mt-2">{year.total_sales.toLocaleString()}</div>
                      {prevYear && (
                        <div className={`text-sm font-semibold mt-2 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs previous year
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Yearly Bar Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fullReports.yearly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="year" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_sales" fill="#F59E0B" name="Annual Sales" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Category Analysis */}
          {selectedPeriod === 'category' && categoryAnalysis && (
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📦 Category & Bottle Size Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Pie Chart */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">Sales by Category</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryAnalysis.categories}
                        dataKey="sales"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.category}: ${((entry.sales / categoryAnalysis.categories.reduce((sum, c) => sum + c.sales, 0)) * 100).toFixed(1)}%`}
                      >
                        {categoryAnalysis.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Category List */}
                  <div className="mt-6 space-y-2">
                    {categoryAnalysis.categories.map((cat, idx) => {
                      const total = categoryAnalysis.categories.reduce((sum, c) => sum + c.sales, 0);
                      const percentage = ((cat.sales / total) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="font-medium text-gray-900 dark:text-white">{cat.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 dark:text-white">{cat.sales.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottle Size Chart */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">Sales by Bottle Size</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryAnalysis.bottle_sizes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="size" stroke="#9CA3AF" width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sales" fill="#3B82F6" name="Sales" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Bottle Size List */}
                  <div className="mt-6 space-y-2">
                    {categoryAnalysis.bottle_sizes.map((size, idx) => {
                      const total = categoryAnalysis.bottle_sizes.reduce((sum, s) => sum + s.sales, 0);
                      const percentage = ((size.sales / total) * 100).toFixed(1);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">{size.size}</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>Total SKUs analyzed:</strong> {categoryAnalysis.total_skus}
                </div>
              </div>
            </Card>
          )}

          {/* Store Analytics */}
          {storeAnalytics && (
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🏪 Store Performance Analytics</h3>
              
              {/* Top Stores Bar Chart */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">Top 10 Stores</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={storeAnalytics.top_buyers?.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis type="number" stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sales" name="Sales" radius={[0, 8, 8, 0]}>
                      {storeAnalytics.top_buyers?.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Store Cards */}
              <CollapsibleSection title="All Store Details" defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeAnalytics.top_buyers?.map((store, idx) => (
                    <div key={idx} className="p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">#{idx + 1}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                          Store
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">{store.name}</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{store.sales.toLocaleString()}</div>
                      <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">total units</div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </Card>
          )}

          {/* No Data State */}
          {!fullReports && !isLoading && (
            <Card className="p-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Reports Available</p>
                <p className="text-sm mb-4">Upload your sales data in Causal Analysis to generate comprehensive reports</p>
                <button
                  onClick={() => onNavigate('causal-analysis')}
                  className="px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: theme.chart }}
                >
                  Go to Causal Analysis
                </button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Reporting;