import React, { useState } from 'react';
import { ThemeProvider } from './components/ThemeContext';
import DashboardHome from './pages/DashboardHome';
import Overview from './pages/Overview';
import CausalAnalysis from './pages/CausalAnalysis';
import Simulation from './pages/Simulation';

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
        {currentPage === "home" && <DashboardHome onNavigate={handleNavigation} />}
        {currentPage === "overview" && <Overview onNavigate={handleNavigation} />}
        {currentPage === "causal-analysis" && <CausalAnalysis onNavigate={handleNavigation} />}
        {currentPage === "simulation" && <Simulation onNavigate={handleNavigation} />}
      </div>
    </ThemeProvider>
  );
};

export default App;