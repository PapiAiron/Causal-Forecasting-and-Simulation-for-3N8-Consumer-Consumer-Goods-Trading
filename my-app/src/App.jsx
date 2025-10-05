import React, { useState } from "react";
import { ThemeProvider } from "./components/ThemeContext";
import DashboardHome from "./pages/DashboardHome";
import Overview from "./pages/Overview";
import CausalAnalysis from "./pages/CausalAnalysis";
import Simulation from "./pages/Simulation";
import Profile from "./pages/Profile";
import Support from "./pages/SupportPage";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AccountSettings from "./pages/AccountSettings";

const App = () => {
  const [currentPage, setCurrentPage] = useState("login");

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
        {currentPage === "profile" && <Profile onNavigate={handleNavigation} />}
        {currentPage === "support" && <Support onNavigate={handleNavigation} />}
        {currentPage === "about" && <AboutUs onNavigate={handleNavigation} />}
        {currentPage === "login" && <Login onNavigate={handleNavigation} />}
        {currentPage === "signup" && <SignUp onNavigate={handleNavigation} />}
        {currentPage === "accountsettings" && <AccountSettings onNavigate={handleNavigation} />}
      </div>
    </ThemeProvider>
  );
};

export default App;