import React from 'react';
import { LayoutWrapper } from './DashboardHome';
import { Settings, Moon, Sun, Palette, Check, User, Lock, Bell, ChevronRight } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { Card, Header } from '../components/SharedComponents';

const SettingsPage = ({ onNavigate, onBack }) => {
  const { theme, darkMode, setDarkMode, currentTheme, setCurrentTheme, themes } = useTheme();

  return (
    <LayoutWrapper currentPage="settings" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="Settings"
          description="Customize your dashboard appearance and manage your account"
          icon={Settings}
          onBack={onBack}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('accountsettings')}
                className="text-left p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-current transition-all duration-200 hover:shadow-lg group"
                style={{ '--hover-color': theme.chart }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                  style={{ 
                    backgroundColor: theme.chart + '20',
                    color: theme.chart
                  }}
                >
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Profile Settings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Manage your personal information and email
                </p>
                <div className="flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-200" style={{ color: theme.chart }}>
                  <span>Manage</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </button>

                <button
                onClick={() => onNavigate('appearance')}
                className="text-left p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-current transition-all duration-200 hover:shadow-lg group"
                style={{ '--hover-color': theme.chart }}
                >
                <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                    style={{ 
                    backgroundColor: theme.chart + '20',
                    color: theme.chart
                    }}
                >
                    <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Appearance
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Customize theme colors and display mode
                </p>
                <div className="flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-200" style={{ color: theme.chart }}>
                    <span>Customize</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                </div>
                </button>
                            

            </div>

            
            {/* Info Banner */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div 
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: theme.chart }}
                >
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Complete Account Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    For full access to profile settingsa and security options, visit the Account Settings page.
                  </p>
                  <button
                    onClick={() => onNavigate('accountsettings')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium rounded-lg shadow hover:shadow-md transition-all"
                    style={{ color: theme.chart }}
                  >
                    <User className="w-4 h-4" />
                    <span>Go to Account Settings</span>
                    <ChevronRight className="w-4 h-4" />
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

export default SettingsPage;