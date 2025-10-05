import React, { useState } from 'react';
import { LayoutWrapper } from './DashboardHome';
import { Card, Header } from '../components/SharedComponents';
import { Settings, User, Mail, Lock, Bell, Globe, Moon, Sun, Palette, Save, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';

const AccountSettings = ({ onNavigate }) => {
  const { theme, darkMode, toggleDarkMode, colorTheme, setColorTheme } = useTheme();
  
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@company.com');
  const [role] = useState('Administrator');
  
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

  const handleSaveProfile = () => {
    console.log('Saving profile:', { fullName, email });
    alert('Profile settings saved successfully!');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    console.log('Changing password');
    alert('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', { emailNotifications, pushNotifications, weeklyReports });
    alert('Notification settings saved successfully!');
  };

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
                  />
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contact your administrator to change your role
                  </p>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="w-full sm:w-auto px-6 py-2 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 4px 15px ${theme.chart}40`
                  }}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </Card>

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
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  className="w-full sm:w-auto px-6 py-2 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                  style={{ 
                    backgroundColor: theme.chart,
                    boxShadow: `0 4px 15px ${theme.chart}40`
                  }}
                >
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
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