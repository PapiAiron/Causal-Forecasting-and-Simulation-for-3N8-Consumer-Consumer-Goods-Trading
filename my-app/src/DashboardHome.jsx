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
  ChevronDown
} from 'lucide-react';

// Mock theme context (you can replace this with your actual ThemeContext)
const useTheme = () => ({
  theme: {
    gradient: 'from-blue-500 to-purple-600',
    accent: 'text-blue-600'
  }
});

// Mock Card and Header components (replace with your actual components)
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

const Header = ({ title, description, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
    <div className="max-w-7xl mx-auto flex items-center space-x-3">
      <Icon className="w-8 h-8 text-blue-600" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  </div>
);

const TopMenuBar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState(3); // Mock notification count

  const menuItems = [
    { label: 'Dashboard', href: '#', current: true },
    { label: 'Analytics', href: '#' },
    { label: 'Reports', href: '#' },
    { label: 'Settings', href: '#' }
  ];

  const profileMenuItems = [
    { icon: User, label: 'Your Profile', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
    { icon: HelpCircle, label: 'Help Center', href: '#' },
    { icon: Mail, label: 'Contact Us', href: '#' },
    { icon: LogOut, label: 'Sign Out', href: '#', separator: true }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and primary navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Pepsi-Cola</span>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex space-x-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right side - notifications and profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
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
                className="flex items-center space-x-3 text-sm bg-white dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
                        <a
                          href={item.href}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </a>
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

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close profile dropdown */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </nav>
  );
};

const DashboardHome = ({ onNavigate }) => {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Menu Bar */}
      <TopMenuBar />
      
      <Header
        title="Dashboard"
        description="Sales Forecasting & Simulation Platform"
        icon={BarChart3}
      />

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
                onClick={() => onNavigate && onNavigate(card.id)}
                className="text-left group"
              >
                <Card className="p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${theme.gradient} rounded-lg group-hover:scale-105 transition-transform`}>
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
                          <div className={`font-semibold ${theme.accent} dark:text-purple-400`}>{card.stats.correlation}</div>
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
                    <span className={`font-medium ${theme.accent} group-hover:translate-x-1 transition-transform`}>
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
              { icon: BarChart3, title: 'Forecast model updated', desc: 'Accuracy improved to 92.5%', time: '2 hours ago', color: 'blue' },
              { icon: Play, title: 'Simulation completed', desc: 'Seasonal Peak scenario', time: '4 hours ago', color: 'green' },
              { icon: TrendingUp, title: 'New causal factor identified', desc: 'Marketing spend correlation', time: '1 day ago', color: 'purple' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`p-2 bg-${activity.color}-100 dark:bg-${activity.color}-900/20 rounded-full`}>
                  <activity.icon className={`w-4 h-4 text-${activity.color}-600 dark:text-${activity.color}-400`} />
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
    </div>
  );
};

export default DashboardHome;