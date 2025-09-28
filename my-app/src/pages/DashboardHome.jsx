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
import { useTheme } from "../components/ThemeContext";

import { Card, Header } from '../components/SharedComponents';

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

// Modern Sidebar Component - Completely Hidden by Default
const Sidebar = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const { theme } = useTheme();
  
  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'causal-analysis', label: 'Causal Analysis', icon: TrendingUp },
    { id: 'simulation', label: 'Simulation', icon: Play }
  ];

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar - Slides in from left */}
      <div className={`fixed left-0 top-0 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 z-50 transition-all duration-300 ease-out shadow-2xl ${
        isOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div 
              className="p-3 rounded-2xl shadow-lg"
              style={{ 
                backgroundColor: theme.chart,
                boxShadow: `0 8px 25px ${theme.chart}40`
              }}
            >
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                3N8
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Analytics Platform</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pages..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-sm focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm"
              style={{ '--tw-ring-color': theme.chart + '40' }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-6 py-2">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'text-white shadow-lg transform scale-[0.98]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02]'
                  }`}
                  style={isActive ? { 
                    backgroundColor: theme.chart,
                    boxShadow: `0 10px 30px ${theme.chart}40`
                  } : {}}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white/30"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-6 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.chart }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </>
  );
};

// Modern Profile Component
const ProfileDropdown = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <div 
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ 
            backgroundColor: theme.chart,
            boxShadow: `0 6px 20px ${theme.chart}30`
          }}
        >
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">John Doe</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Modern Profile dropdown */}
      {isProfileOpen && (
        <>
          {/* Click outside overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-3 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-3 z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Profile info */}
            <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 8px 25px ${theme.chart}30`
                  }}
                >
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">John Doe</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@company.com</p>
                  <p className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mt-1 inline-block">
                    Administrator
                  </p>
                </div>
              </div>
            </div>

            {/* Profile menu items */}
            <div className="py-2">
              {[
                { icon: User, label: 'View Profile', color: 'text-gray-600 dark:text-gray-300' },
                { icon: Settings, label: 'Account Settings', color: 'text-gray-600 dark:text-gray-300' },
                { icon: HelpCircle, label: 'Help & Support', color: 'text-gray-600 dark:text-gray-300' }
              ].map((item, index) => (
                <button key={index} className="flex items-center space-x-3 px-6 py-3 text-sm hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-colors w-full text-left group">
                  <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                  <span className={item.color}>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-2">
              <button className="flex items-center space-x-3 px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left group">
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Modern Top Bar Component
const TopBar = ({ sidebarOpen, onSidebarToggle }) => {
  const [notifications] = useState(3);
  const { theme } = useTheme();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between relative">
          {/* Left side - Hamburger */}
          <div className="flex items-center">
            <button
              onClick={onSidebarToggle}
              className="p-2 sm:p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-2xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:scale-105 active:scale-95"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Center - App Title (hidden on small screens, shown on medium+) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-8">
            <div 
              className="p-5 rounded-3xl shadow-2xl flex items-center justify-center"
              style={{ 
                backgroundColor: theme.chart,
                boxShadow: `0 12px 35px ${theme.chart}40`
              }}
            >
              <BarChart3 className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-5xl lg:text-5xl xl:text-9xl 2xl:text-[10rem] font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
              3N8 Analytics Platform
            </h1>
          </div>

          {/* Mobile App Title (only on small screens) */}
          <div className="flex md:hidden items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
            <div 
              className="p-3 rounded-2xl shadow-xl flex items-center justify-center"
              style={{ 
                backgroundColor: theme.chart,
                boxShadow: `0 10px 30px ${theme.chart}40`
              }}
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wide bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              3N8 
            </h1>
          </div>


          {/* Right side - Notifications + Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications - hidden on very small screens */}
            <button className="relative p-2 sm:p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-xl sm:rounded-2xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:scale-105 active:scale-95 hidden xs:block">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {notifications > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-xs text-white rounded-full flex items-center justify-center shadow-lg"
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
    </header>
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
    <>
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your forecasting system today."
        icon={Home}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
    </>
  );
};

// Modern Layout Wrapper Component - Full Width Design
const LayoutWrapper = ({ children, currentPage, onNavigate }) => {
  const [activeTab, setActiveTab] = useState(currentPage || 'home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onNavigate(tabId);
    // Auto-close sidebar after navigation for better UX
    setSidebarOpen(false);
  };

  React.useEffect(() => {
    setActiveTab(currentPage || 'home');
  }, [currentPage]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500"
      style={{
        transform: 'scale(0.9)',
        transformOrigin: 'top left',
        width: '111.11%', // 100% / 0.9 to maintain full viewport coverage
        height: '111.11%' // 100% / 0.9 to maintain full viewport coverage
      }}
    >
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      {/* Full width main content - no margins */}
      <div className="w-full">
        <TopBar 
          sidebarOpen={sidebarOpen} 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="w-full">
          {children}
        </main>
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