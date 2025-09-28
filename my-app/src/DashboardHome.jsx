import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Play, 
  User, 
  LogOut, 
  Mail, 
  Settings, 
  Bell, 
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Home,
  Moon,
  Sun,
  Palette
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { Card, Header } from './SharedComponents';

// Theme Settings Modal Component
const ThemeModal = ({ isOpen, onClose }) => {
  const { theme, darkMode, colorTheme, toggleDarkMode, setColorTheme } = useTheme();

  if (!isOpen) return null;

  const colorThemes = [
    { key: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
    { key: 'purple', name: 'Royal Purple', color: 'bg-purple-500' },
    { key: 'emerald', name: 'Emerald Green', color: 'bg-emerald-500' },
    { key: 'orange', name: 'Sunset Orange', color: 'bg-orange-500' },
    { key: 'rose', name: 'Rose Pink', color: 'bg-rose-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Appearance Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                  !darkMode
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Sun className="w-5 h-5 mr-2" />
                <span className="text-sm">Light</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Moon className="w-5 h-5 mr-2" />
                <span className="text-sm">Dark</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Color Theme
            </label>
            <div className="grid grid-cols-1 gap-2">
              {colorThemes.map((themeOption) => (
                <button
                  key={themeOption.key}
                  onClick={() => setColorTheme(themeOption.key)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-colors ${
                    colorTheme === themeOption.key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${themeOption.color} mr-3`} />
                  <span className="text-sm">{themeOption.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Bar Component
const TaskBar = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();
  
  const tabs = [
    { id: 'home', label: 'Home/Dashboard', icon: Home },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'causal-analysis', label: 'Causal Analysis', icon: TrendingUp },
    { id: 'simulation', label: 'Simulation', icon: Play }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? `border-current text-current`
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
                style={isActive ? { 
                  borderColor: theme.chart, 
                  color: theme.chart 
                } : {}}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Top Menu Bar Component
const TopMenuBar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [notifications] = useState(3);
  const { theme, darkMode, toggleDarkMode } = useTheme();

  const profileMenuItems = [
    { icon: User, label: 'Your Profile', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
    { icon: HelpCircle, label: 'Help Center', href: '#' },
    { icon: Mail, label: 'Contact Us', href: '#' },
    { icon: LogOut, label: 'Sign Out', href: '#', separator: true }
  ];

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8" style={{ color: theme.chart }} />
              <span className="text-xl font-bold text-gray-900 dark:text-white">3N8</span>
            </div>

            {/* Right side - theme toggle, notifications and profile */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--tw-ring-color': theme.chart }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.chart }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden md:block text-gray-700 dark:text-gray-300 font-medium">John Doe</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Profile dropdown menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@company.com</p>
                      </div>
                      {profileMenuItems.map((item) => (
                        <div key={item.label}>
                          {item.separator && <div className="border-t border-gray-200 dark:border-gray-700" />}
                          {item.action ? (
                            <button
                              onClick={() => {
                                item.action();
                                setIsProfileOpen(false);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors w-full text-left"
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </button>
                          ) : (
                            <a
                              href={item.href}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Click outside to close profile dropdown */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
        )}
      </nav>

      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </>
  );
};

// Dashboard Content Component
const DashboardContent = ({ onNavigate }) => {
  const { theme } = useTheme();

  const dashboardCards = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Key Performance Indicators & Forecasting',
      icon: BarChart3,
      stats: { accuracy: '92.5%', delivery: '98.2%' }
    },
    {
      id: 'simulation',
      title: 'Simulation',
      description: 'Scenario Analysis & Risk Assessment',
      icon: Play,
      stats: { scenarios: '4', lastRun: '2 hrs ago' }
    },
    {
      id: 'causal-analysis',
      title: 'Causal Analysis',
      description: 'Factor Impact & Correlation Analysis',
      icon: TrendingUp,
      stats: { factors: '6', correlation: '85%' }
    }
  ];

  const quickStats = [
    { label: 'Total Products', value: '248', change: '+12%', positive: true },
    { label: 'Active Simulations', value: '3', change: '+1', positive: true },
    { label: 'Forecast Accuracy', value: '92.5%', change: '+2.3%', positive: true },
    { label: 'System Uptime', value: '99.8%', change: '0%', positive: true }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back!</h2>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your forecasting system today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                stat.positive 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
              }`}>
                {stat.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="text-left group"
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-3 rounded-lg group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: theme.chart }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    {card.id === 'overview' && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                        <div className="font-semibold text-green-600 dark:text-green-400">{card.stats.accuracy}</div>
                      </>
                    )}
                    {card.id === 'simulation' && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Last Run</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{card.stats.lastRun}</div>
                      </>
                    )}
                    {card.id === 'causal-analysis' && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Top Factor</div>
                        <div className="font-semibold" style={{ color: theme.chart }}>{card.stats.correlation}</div>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{card.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {card.id === 'overview' && `Delivery: ${card.stats.delivery}`}
                    {card.id === 'simulation' && `${card.stats.scenarios} scenarios available`}
                    {card.id === 'causal-analysis' && `${card.stats.factors} factors analyzed`}
                  </span>
                  <span 
                    className="font-medium group-hover:translate-x-1 transition-transform"
                    style={{ color: theme.chart }}
                  >
                    View Details →
                  </span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { icon: BarChart3, title: 'Forecast model updated', desc: 'Accuracy improved to 92.5%', time: '2 hours ago' },
            { icon: Play, title: 'Simulation completed', desc: 'Seasonal Peak scenario', time: '4 hours ago' },
            { icon: TrendingUp, title: 'New causal factor identified', desc: 'Marketing spend correlation', time: '1 day ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div 
                className="p-2 rounded-full"
                style={{ 
                  backgroundColor: theme.secondary || (theme.chart + '20'), 
                  color: theme.chart 
                }}
              >
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.desc} • {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
};

// Layout Wrapper Component
const LayoutWrapper = ({ children, currentPage, onNavigate }) => {
  const [activeTab, setActiveTab] = useState(currentPage || 'home');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onNavigate(tabId);
  };

  React.useEffect(() => {
    setActiveTab(currentPage || 'home');
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <TopMenuBar />
      <TaskBar activeTab={activeTab} onTabChange={handleTabChange} />
      {children}
    </div>
  );
};

// Main Dashboard Component
const DashboardHome = ({ onNavigate }) => {
  return (
    <LayoutWrapper currentPage="home" onNavigate={onNavigate}>
      <Header
        title="Dashboard"
        description="Sales Forecasting & Simulation Platform"
        icon={BarChart3}
      />
      <DashboardContent onNavigate={onNavigate} />
    </LayoutWrapper>
  );
};

export { LayoutWrapper };
export default DashboardHome;