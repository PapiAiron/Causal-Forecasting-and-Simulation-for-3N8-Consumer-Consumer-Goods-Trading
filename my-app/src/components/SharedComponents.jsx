import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const Header = ({ 
  title, 
  description, 
  icon: Icon, 
  onBack
}) => {
  const { theme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {/* Back Button - Only shows when onBack is provided */}
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all rounded-lg hover:shadow-sm active:scale-95"
                title="Go Back"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>
            )}
            
            <div className={`p-3 bg-gradient-to-r ${theme.gradient} rounded-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};