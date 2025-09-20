import React, { useState, createContext, useContext } from 'react';

const ThemeContext = createContext();

const themes = {
  blue: {
    name: 'Ocean Blue',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    secondary: 'bg-blue-50',
    accent: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-800',
    chart: '#3b82f6'
  },
  purple: {
    name: 'Royal Purple',
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    secondary: 'bg-purple-50',
    accent: 'text-purple-600',
    gradient: 'from-purple-600 to-purple-800',
    chart: '#9333ea'
  },
  green: {
    name: 'Forest Green',
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    secondary: 'bg-green-50',
    accent: 'text-green-600',
    gradient: 'from-green-600 to-green-800',
    chart: '#059669'
  },
  red: {
    name: 'Crimson Red',
    primary: 'bg-red-600',
    primaryHover: 'hover:bg-red-700',
    secondary: 'bg-red-50',
    accent: 'text-red-600',
    gradient: 'from-red-600 to-red-800',
    chart: '#dc2626'
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    secondary: 'bg-orange-50',
    accent: 'text-orange-600',
    gradient: 'from-orange-600 to-orange-800',
    chart: '#ea580c'
  },
  teal: {
    name: 'Ocean Teal',
    primary: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    secondary: 'bg-teal-50',
    accent: 'text-teal-600',
    gradient: 'from-teal-600 to-teal-800',
    chart: '#0d9488'
  },
  indigo: {
    name: 'Deep Indigo',
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    secondary: 'bg-indigo-50',
    accent: 'text-indigo-600',
    gradient: 'from-indigo-600 to-indigo-800',
    chart: '#4f46e5'
  },
  pink: {
    name: 'Rose Pink',
    primary: 'bg-pink-600',
    primaryHover: 'hover:bg-pink-700',
    secondary: 'bg-pink-50',
    accent: 'text-pink-600',
    gradient: 'from-pink-600 to-pink-800',
    chart: '#db2777'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setCurrentTheme,
      darkMode,
      setDarkMode,
      theme: themes[currentTheme],
      themes
    }}>
      <div className={darkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};