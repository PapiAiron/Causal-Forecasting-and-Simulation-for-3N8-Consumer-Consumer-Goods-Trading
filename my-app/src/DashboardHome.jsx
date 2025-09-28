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
  ChevronLeft,
  Home,
  Moon,
  Sun,
  Palette,
  Search
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { Card, Header } from './SharedComponents';

// Use the actual theme context and components from imports

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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
                onClick={!darkMode ? null : toggleDarkMode}
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
                onClick={darkMode ? null : toggleDarkMode}
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

// Modern Sidebar Component
const Sidebar = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { theme, darkMode, toggleDarkMode } = useTheme();
  
  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'causal-analysis', label: 'Causal Analysis', icon: TrendingUp },
    { id: 'simulation', label: 'Simulation', icon: Play }
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setIsThemeModalOpen(true) },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'theme', label: darkMode ? 'Light Mode' : 'Dark Mode', icon: darkMode ? Sun : Moon, action: toggleDarkMode }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${
        isOpen ? 'w-72' : 'w-20'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {isOpen ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.chart }}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">3N8</span>
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2 w-full">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.chart }}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar (only when open) */}
        {isOpen && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': theme.chart }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 px-4 py-2">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'text-white shadow-lg transform scale-[0.98]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  style={isActive ? { 
                    backgroundColor: theme.chart,
                    boxShadow: `0 8px 20px ${theme.chart}40`
                  } : {}}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''} ${!isOpen ? 'mx-auto' : ''}`} />
                  {isOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom items for collapsed mode */}
        {!isOpen && (
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <Settings className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 mx-auto" /> : <Moon className="w-5 h-5 mx-auto" />}
            </button>
          </div>
        )}

        {/* Bottom items for expanded mode */}
        {isOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {bottomItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    }
                  }}
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors w-full text-left rounded-lg"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </>
  );
};

// Profile Component (moved from sidebar to topbar)
const ProfileDropdown = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.chart }}
        >
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Profile dropdown */}
      {isProfileOpen && (
        <>
          {/* Click outside overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            {/* Profile info */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.chart }}
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">john.doe@company.com</p>
                </div>
              </div>
            </div>

            {/* Profile menu items */}
            <div className="py-2">
              <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors w-full text-left">
                <User className="w-4 h-4" />
                <span>View Profile</span>
              </button>
              <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors w-full text-left">
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
              <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors w-full text-left">
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <button className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Top Bar Component with Profile moved here
const TopBar = ({ sidebarOpen, onSidebarToggle }) => {
  const [notifications] = useState(3);
  const { theme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Hamburger menu for mobile/collapsed sidebar */}
        <div className="flex items-center space-x-4">
          {!sidebarOpen && (
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right side - notifications and profile */}
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span 
                className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                style={{ backgroundColor: theme.chart }}
              >
                {notifications}
              </span>
            )}
          </button>
          
          <ProfileDropdown />
        </div>
      </div>
    </div>
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
    <main className="px-6 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back!</h2>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your forecasting system today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-all duration-200">
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
              <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-3 rounded-xl group-hover:scale-110 transition-all duration-300 shadow-lg"
                    style={{ 
                      backgroundColor: theme.chart,
                      boxShadow: `0 8px 20px ${theme.chart}30`
                    }}
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
                    className="font-medium group-hover:translate-x-2 transition-transform duration-300"
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
            <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div 
                className="p-2 rounded-xl shadow-sm"
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onNavigate(tabId);
  };

  React.useEffect(() => {
    setActiveTab(currentPage || 'home');
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        <TopBar 
          sidebarOpen={sidebarOpen} 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        {children}
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardHome = ({ onNavigate = () => {} }) => {
  return (
    <LayoutWrapper currentPage="home" onNavigate={onNavigate}>
      <DashboardContent onNavigate={onNavigate} />
    </LayoutWrapper>
  );
};

export { LayoutWrapper };
export default DashboardHome;