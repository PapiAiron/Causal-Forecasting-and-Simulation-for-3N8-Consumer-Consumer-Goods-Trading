import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Play, 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Home,
  Search,
  Info,
  UserPlus,
  Calendar,
  Truck
} from 'lucide-react';
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useTheme } from "../components/ThemeContext";
import { Card, Header } from '../components/SharedComponents';

const Sidebar = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const { theme } = useTheme();
  const [userRole, setUserRole] = useState('staff');
  
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'staff');
        }
      }
    };
    fetchUserRole();
  }, []);
  
  // Navigation items with role-based access
  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, roles: ['admin', 'staff', 'user'] },
    { id: 'causal-analysis', label: 'Causal Analysis', icon: TrendingUp, roles: ['admin', 'staff', 'user'] },
    { id: 'simulation', label: 'Simulation', icon: Play, roles: ['admin', 'staff', 'user'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'staff', 'user'] },
    { id: 'manage-accounts', label: 'Manage Accounts', icon: UserPlus, roles: ['admin'] }, // ONLY ADMIN
  ];
  
  // Filter navigation based on user role
  const filteredNav = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 z-50 transition-all duration-300 ease-out shadow-2xl ${
        isOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
      }`}>
        
<button 
  onClick={() => onTabChange('home')}
  className="flex items-center space-x-3 hover:opacity-80 transition-opacity  mt-6 ml-6 mb-7"
>
  <img 
    src="3N8.png" 
    alt="3N8 Logo" 
    className="w-12 h-12 object-contain rounded-2xl shadow-lg"
  />
  <div>
    <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
      3N8 Analytics
    </span>
    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Analytics Platform</p>
  </div>
</button>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gray-300/50 dark:bg-gray-600/50 mb-6" />
        </div>


        <div className="flex-1 px-6 py-2 overflow-y-auto max-h-[calc(100vh-300px)]">
          <nav className="space-y-2">
            {filteredNav.map((item) => {
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

        <div className="p-6 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.chart }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {auth.currentUser?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole}
              </p>
            </div>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </>
  );
};

const ProfileDropdown = ({ onNavigate }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState('staff');
  const { theme } = useTheme();

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'staff');
        }
      }
    };
    fetchUserRole();
  }, []);

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsProfileOpen(false);
  };

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
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {auth.currentUser?.displayName || 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
      </button>

      {isProfileOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200/30 dark:border-gray-700/30">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 8px 25px ${theme.chart}30`
                  }}
                >
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {auth.currentUser?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {auth.currentUser?.email || 'user@company.com'}
                  </p>
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-2 ${
                    userRole === 'admin' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {userRole === 'admin' ? 'Administrator' : 'Staff'}
                  </span>
                </div>
              </div>
            </div>

            <div className="py-2">
                {[
                  { icon: User, label: 'View Profile', action: 'profile' },
                  { icon: Settings, label: 'Settings', action: 'settings' },
                  { icon: HelpCircle, label: 'Help & Support', action: 'support' },
                  { icon: Info, label: 'About Us', action: 'about' }
                ].map((item, index) => (
                <button 
                  key={index}
                  onClick={() => handleNavigation(item.action)}
                  className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-200 w-full text-left group hover:text-gray-900 dark:hover:text-white"
                >
                  <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200/30 dark:border-gray-700/30">
              <button 
                onClick={async () => {
                  try {
                    await auth.signOut();
                    localStorage.removeItem("authToken");
                    sessionStorage.clear();
                    handleNavigation("login");
                  } catch (error) {
                    console.error("Logout error:", error);
                  }
                }}
                className="flex items-center space-x-3 px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full text-left group"
              >
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

const TopBar = ({ sidebarOpen, onSidebarToggle, onNavigate }) => {
  const [notifications, setNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [userRole, setUserRole] = useState('staff');
  const { theme } = useTheme();

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'staff');
        }
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    // Only fetch pending users if user is admin
    if (userRole !== 'admin') return;

    const fetchPendingUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const pendingQuery = query(usersRef, where("accountStatus", "==", "pending"));
        const snapshot = await getDocs(pendingQuery);
        
        const pending = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPendingUsers(pending);
        setNotifications(pending.length);
      } catch (error) {
        console.error("Error fetching pending users:", error);
      }
    };

    fetchPendingUsers();
    const interval = setInterval(fetchPendingUsers, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center">
            <button
              onClick={onSidebarToggle}
              className="p-2 sm:p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-2xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:scale-105 active:scale-95"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

<button 
  onClick={() => onNavigate('home')}
  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
>
  <img 
    src="3N8.png" 
    alt="3N8 Logo" 
    className="w-12 h-12 object-contain rounded-2xl shadow-lg"
  />
  <div>
    <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
      3N8 Analytics
    </span>
    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Analytics Platform</p>
  </div>
</button>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Only show notification bell for admins */}
            {userRole === 'admin' && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 sm:p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-xl sm:rounded-2xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:scale-105 active:scale-95"
                >
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

                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-full mt-3 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Pending Verifications
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {notifications} user{notifications !== 1 ? 's' : ''} awaiting approval
                        </p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {pendingUsers.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            No pending verifications
                          </div>
                        ) : (
                          pendingUsers.map((user) => (
                            <div key={user.id} className="p-4 border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <div className="flex items-start space-x-3">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                                  style={{ backgroundColor: theme.chart }}
                                >
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user.email}
                                  </p>
                                  <span className="inline-block text-xs font-medium px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full mt-1">
                                    {user.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {pendingUsers.length > 0 && (
                        <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30">
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              onNavigate('manage-accounts');
                            }}
                            className="w-full py-2 px-4 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                            style={{ backgroundColor: theme.chart }}
                          >
                            View All in Manage Accounts
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <ProfileDropdown onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </header>
  );
};

const DashboardContent = ({ onNavigate }) => {
  const { theme } = useTheme();

  // UPDATED: Dashboard cards (Overview removed, Settings added)
  const dashboardCards = [
        {
      id: 'delivery-tracking',
      title: 'Delivery Tracking',
      description: 'Track Deliveries & Performance Metrics',
      icon: Truck,
      stats: { Deliveries: '123', Damaged: '10' }
    },
        {
      id: 'store-analytics',
      title: 'Store Analytics',
      description: 'Top Buyers, Demand Patterns & Sales Trends',
      icon: BarChart3,
      stats: { topStores: '12', peakDay: 'Wednesday' }
    },
        {
      id: 'reporting',
      title: 'Full Reporting System',
      description: 'Monthly, weekly, and yearly sales + bottle category reports.',
      icon: Calendar,
      stats: { reports: '23',  Updated: 'Today' }
    },
    {
      id: 'causal-analysis',
      title: 'Causal Analysis',
      description: 'Factor Impact & Correlation Analysis',
      icon: TrendingUp,
      stats: { factors: '6', correlation: '85%' }
    },
    {
      id: 'simulation',
      title: 'Simulation',
      description: 'Scenario Analysis & Risk Assessment',
      icon: Play,
      stats: { scenarios: '4', lastRun: '2 hrs ago' }
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Customize Theme & Preferences',
      icon: Settings,
      stats: { theme: 'Ocean Blue', mode: 'Dark' }
    }
  ];

 return (
  <div className="pt-24">
    <Header
      title="Home"
      description="Welcome back! Here's what's happening with your forecasting system today."
      icon={Home}
    />
    
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* DASHBOARD CARDS */}
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
                      boxShadow: `0 8px 20px ${theme.chart}30`,
                    }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  <div className="text-right">
                    {card.id === "causal-analysis" && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Top Factor
                        </div>
                        <div
                          className="font-semibold"
                          style={{ color: theme.chart }}
                        >
                          {card.stats.correlation}
                        </div>
                      </>
                    )}

                    {card.id === "simulation" && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Last Run
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {card.stats.lastRun}
                        </div>
                      </>
                    )}

                    {card.id === "settings" && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Current Theme
                        </div>
                        <div
                          className="font-semibold"
                          style={{ color: theme.chart }}
                        >
                          {card.stats.theme}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {card.description}
                </p>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {card.id === "causal-analysis" &&
                      `${card.stats.factors} factors analyzed`}
                    {card.id === "simulation" &&
                      `${card.stats.scenarios} scenarios available`}
                    {card.id === "settings" && `Mode: ${card.stats.mode}`}
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

      {/* QUICK GLANCE SECTION */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Glance Overview
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow">
            <p className="text-sm text-gray-500">Inventory Level</p>
            <p className="text-2xl font-bold">83%</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow">
            <p className="text-sm text-gray-500">Top Stores</p>
            <p className="text-2xl font-bold">12</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow">
            <p className="text-sm text-gray-500">Deliveries Made</p>
            <p className="text-2xl font-bold">47</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow">
            <p className="text-sm text-gray-500">Out for Delivery</p>
            <p className="text-2xl font-bold">6</p>
          </div>
        </div>
      </Card>

      {/* RECENT ACTIVITY */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>

        <div className="space-y-3">
          {[
            {
              icon: Settings,
              title: "Theme updated",
              desc: "Changed to Ocean Blue theme",
              time: "1 hour ago",
            },
            {
              icon: Play,
              title: "Simulation completed",
              desc: "Seasonal Peak scenario",
              time: "4 hours ago",
            },
            {
              icon: TrendingUp,
              title: "New causal factor identified",
              desc: "Marketing spend correlation",
              time: "1 day ago",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div
                className="p-2 rounded-xl shadow-sm"
                style={{
                  backgroundColor: theme.secondary || theme.chart + "20",
                  color: theme.chart,
                }}
              >
                <activity.icon className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.desc} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  </div>
);
};

const LayoutWrapper = ({ children, currentPage, onNavigate }) => {
  const [activeTab, setActiveTab] = useState(currentPage || 'home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onNavigate(tabId);
    setSidebarOpen(false);
  };

  React.useEffect(() => {
    setActiveTab(currentPage || 'home');
  }, [currentPage]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 transition-all duration-500"
      style={{
        transform: 'scale(0.9)',
        transformOrigin: 'top left',
        width: '111.11%',
        height: '111.11%'
      }}
    >
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <div className="w-full">
        <TopBar 
          sidebarOpen={sidebarOpen} 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={onNavigate}
        />
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

const DashboardHome = ({ onNavigate = () => {} }) => {
  return (
    <LayoutWrapper currentPage="home" onNavigate={onNavigate}>
      <DashboardContent onNavigate={onNavigate} />
    </LayoutWrapper>
  );
};

export { LayoutWrapper };
export default DashboardHome;