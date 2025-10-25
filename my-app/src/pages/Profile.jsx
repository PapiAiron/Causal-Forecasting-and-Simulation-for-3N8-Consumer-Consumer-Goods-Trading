import React, { useState, useEffect } from "react";
import { LayoutWrapper } from './DashboardHome';  
import { Card, Header } from "../components/SharedComponents";
import { User, Settings, Mail, Shield, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "../components/ThemeContext";

const Profile = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUserData();
    };
    
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }

      // Fetch user data from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData({
          name: data.name || currentUser.displayName || 'User',
          email: data.email || currentUser.email || 'No email',
          role: data.role || 'staff',
          accountStatus: data.accountStatus || 'active',
          createdAt: data.createdAt?.toDate() || null,
          lastLoginAt: data.lastLoginAt?.toDate() || null,
          emailVerified: currentUser.emailVerified,
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          weeklyReports: data.weeklyReports ?? false
        });
      } else {
        // If user document doesn't exist, use auth data
        setUserData({
          name: currentUser.displayName || 'User',
          email: currentUser.email || 'No email',
          role: 'staff',
          accountStatus: 'active',
          createdAt: currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : null,
          lastLoginAt: currentUser.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime) : null,
          emailVerified: currentUser.emailVerified,
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: false
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'staff': return 'Staff Member';
      default: return 'User';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'staff': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'suspended': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'disabled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <LayoutWrapper currentPage="profile" onNavigate={onNavigate}>
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper currentPage="profile" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="Your Profile"
          description="View your account information and preferences"
          icon={User}
        />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Profile Header Card */}
            <Card className="p-6">
              <div className="flex items-start gap-6">
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 10px 30px ${theme.chart}40`
                  }}
                >
                  {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userData?.name}
                    </h2>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userData?.role)}`}>
                      {getRoleDisplay(userData?.role)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{userData?.email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(userData?.accountStatus)}`}>
                      {userData?.accountStatus?.charAt(0).toUpperCase() + userData?.accountStatus?.slice(1)}
                    </span>
                    
                    {userData?.emailVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Email Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <AlertCircle className="w-4 h-4" />
                        Email Not Verified
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate("accountsettings")}
                  className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 4px 15px ${theme.chart}40`
                  }}
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </Card>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ 
                      backgroundColor: theme.chart + '20',
                      color: theme.chart
                    }}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Account Created
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(userData?.createdAt)}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ 
                      backgroundColor: theme.chart + '20',
                      color: theme.chart
                    }}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Last Login
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(userData?.lastLoginAt)}
                </p>
              </Card>
            </div>

            {/* Notification Preferences */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5" style={{ color: theme.chart }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    userData?.emailNotifications 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {userData?.emailNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Push Notifications
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    userData?.pushNotifications 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {userData?.pushNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Weekly Reports
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    userData?.weeklyReports 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {userData?.weeklyReports ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Want to change your notification preferences?
                </p>
                <button
                  onClick={() => onNavigate("accountsettings")}
                  className="text-sm font-medium hover:underline"
                  style={{ color: theme.chart }}
                >
                  Go to Account Settings →
                </button>
              </div>
            </Card>

            {/* Additional Info Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div 
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: theme.chart }}
                >
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Account Security
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Keep your account secure by regularly updating your password and reviewing your notification settings.
                  </p>
                  <button
                    onClick={() => onNavigate("accountsettings")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium rounded-lg shadow hover:shadow-md transition-all"
                    style={{ color: theme.chart }}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Manage Security Settings</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Profile;