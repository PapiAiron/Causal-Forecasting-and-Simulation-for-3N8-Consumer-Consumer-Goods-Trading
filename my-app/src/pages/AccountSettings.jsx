import React, { useState, useEffect } from 'react';
import { LayoutWrapper } from './DashboardHome';
import { Card, Header } from '../components/SharedComponents';
import { Settings, User, Mail, Lock, Bell, Globe, Moon, Sun, Palette, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  updateEmail,
  updateProfile
} from 'firebase/auth';

const AccountSettings = ({ onNavigate }) => {
  const { theme, darkMode, toggleDarkMode, colorTheme, setColorTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  const colorThemes = [
    { key: 'blue', name: 'Ocean Blue', hex: '#3B82F6' },
    { key: 'purple', name: 'Royal Purple', hex: '#A855F7' },
    { key: 'emerald', name: 'Emerald Green', hex: '#10B981' },
    { key: 'orange', name: 'Sunset Orange', hex: '#F97316' },
    { key: 'rose', name: 'Rose Pink', hex: '#F43F5E' },
    { key: 'indigo', name: 'Deep Indigo', hex: '#6366F1' },
    { key: 'cyan', name: 'Bright Cyan', hex: '#06B6D4' },
    { key: 'amber', name: 'Golden Amber', hex: '#F59E0B' },
    { key: 'teal', name: 'Ocean Teal', hex: '#14B8A6' },
    { key: 'pink', name: 'Hot Pink', hex: '#EC4899' }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        alert('No user logged in');
        return;
      }

      // Fetch user data from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setFullName(userData.name || '');
        setEmail(userData.email || currentUser.email || '');
        setRole(userData.role || 'staff');
        setAccountStatus(userData.accountStatus || 'active');
        setEmailNotifications(userData.emailNotifications ?? true);
        setPushNotifications(userData.pushNotifications ?? true);
        setWeeklyReports(userData.weeklyReports ?? false);
      } else {
        // If user document doesn't exist, use auth data
        setEmail(currentUser.email || '');
        setFullName(currentUser.displayName || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      alert('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        alert('No user logged in');
        return;
      }

      // Update Firebase Auth displayName first
      await updateProfile(currentUser, {
        displayName: fullName
      });

      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: fullName,
        email: email,
        updatedAt: serverTimestamp()
      });

      // If email changed, update Firebase Auth email
      if (email !== currentUser.email) {
        try {
          await updateEmail(currentUser, email);
        } catch (emailError) {
          if (emailError.code === 'auth/requires-recent-login') {
            alert('Please log out and log back in to change your email address');
            setSaving(false);
            return;
          }
          throw emailError;
        }
      }

      // Force refresh auth state
      await currentUser.reload();
      
      // Dispatch event to notify all components about the profile update
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
        detail: { 
          name: fullName, 
          email: email,
          displayName: fullName,
          uid: currentUser.uid
        } 
      }));

      alert('Profile settings saved successfully! The page will refresh to update all information.');
      
      // Reload the page after a short delay to ensure all components update
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + error.message);
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser || !currentUser.email) {
        alert('No user logged in');
        return;
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);

      // Update Firestore to log password change
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        passwordChangedAt: serverTimestamp()
      });

      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        alert('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        alert('New password is too weak');
      } else if (error.code === 'auth/invalid-credential') {
        alert('Invalid credentials. Please check your current password.');
      } else {
        alert('Failed to change password: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        alert('No user logged in');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        emailNotifications,
        pushNotifications,
        weeklyReports,
        updatedAt: serverTimestamp()
      });

      alert('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      alert('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LayoutWrapper currentPage="accountsettings" onNavigate={onNavigate}>
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading account settings...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper currentPage="accountsettings" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="Account Settings"
          description="Manage your account preferences and security settings"
          icon={Settings}
        />
        
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Profile Information */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-5 h-5" style={{ color: theme.chart }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': theme.chart + '40' }}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This name will appear in the sidebar and profile dropdown
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': theme.chart + '40' }}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Changing your email requires re-authentication
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={role.charAt(0).toUpperCase() + role.slice(1)}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contact your administrator to change your role
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Status
                  </label>
                  <input
                    type="text"
                    value={accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 4px 15px ${theme.chart}40`
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </Card>

            {/* Change Password */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-5 h-5" style={{ color: theme.chart }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': theme.chart + '40' }}
                      placeholder="Enter current password"
                      disabled={saving}
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      type="button"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': theme.chart + '40' }}
                      placeholder="Enter new password (min. 6 characters)"
                      disabled={saving}
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      type="button"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': theme.chart + '40' }}
                      placeholder="Confirm new password"
                      disabled={saving}
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      type="button"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 4px 15px ${theme.chart}40`
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bell className="w-5 h-5" style={{ color: theme.chart }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h3>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive email updates about important events
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: theme.chart }}
                    disabled={saving}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive browser push notifications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: theme.chart }}
                    disabled={saving}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Weekly Reports
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive weekly summary reports via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyReports}
                    onChange={(e) => setWeeklyReports(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: theme.chart }}
                    disabled={saving}
                  />
                </label>

                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 4px 15px ${theme.chart}40`
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default AccountSettings;