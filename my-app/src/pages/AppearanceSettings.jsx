import React from 'react';
import { LayoutWrapper } from './DashboardHome';
import { Palette, Moon, Sun, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { Card, Header } from '../components/SharedComponents';

const AppearanceSettings = ({ onNavigate, onBack}) => {
  const { theme, darkMode, setDarkMode, currentTheme, setCurrentTheme, themes } = useTheme();

  return (
    <LayoutWrapper currentPage="settings" onNavigate={onNavigate}>
      <div className="pt-24 bg-gray-50 dark:bg-gray-900 min-h-screen">
      

        <Header
          title="Appearance"
          description="Customize how your dashboard looks and feels"
          icon={Palette}
          onBack={onBack}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Appearance Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dark Mode Card */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div 
                    className="p-3 rounded-xl shadow-lg"
                    style={{ 
                      backgroundColor: theme.chart,
                      boxShadow: `0 8px 20px ${theme.chart}30`
                    }}
                  >
                    {darkMode ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Appearance Mode
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose between light and dark theme
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      !darkMode
                        ? 'border-current shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={!darkMode ? { 
                      borderColor: theme.chart,
                      backgroundColor: theme.chart + '10'
                    } : {}}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Light Mode</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bright and clean interface</p>
                      </div>
                    </div>
                    {!darkMode && (
                      <div 
                        className="p-1 rounded-full"
                        style={{ backgroundColor: theme.chart }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setDarkMode(true)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      darkMode
                        ? 'border-current shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={darkMode ? { 
                      borderColor: theme.chart,
                      backgroundColor: theme.chart + '10'
                    } : {}}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                      </div>
                    </div>
                    {darkMode && (
                      <div 
                        className="p-1 rounded-full"
                        style={{ backgroundColor: theme.chart }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </Card>

              {/* Theme Color Card */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div 
                    className="p-3 rounded-xl shadow-lg"
                    style={{ 
                      backgroundColor: theme.chart,
                      boxShadow: `0 8px 20px ${theme.chart}30`
                    }}
                  >
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Theme Color
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select your preferred color scheme
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(themes).map(([key, themeOption]) => (
                    <button
                      key={key}
                      onClick={() => setCurrentTheme(key)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        currentTheme === key
                          ? 'border-current shadow-lg scale-[0.98]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105'
                      }`}
                      style={currentTheme === key ? { 
                        borderColor: themeOption.chart,
                        backgroundColor: themeOption.chart + '10'
                      } : {}}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg shadow-md"
                          style={{ backgroundColor: themeOption.chart }}
                        />
                        <div className="text-left">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {themeOption.name}
                          </p>
                        </div>
                      </div>
                      {currentTheme === key && (
                        <div 
                          className="p-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: themeOption.chart }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Tips Card */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-4">
                <div 
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: theme.chart }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Pro Tip
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your appearance preferences are saved automatically and will persist across sessions. Try different combinations to find what works best for you!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default AppearanceSettings;