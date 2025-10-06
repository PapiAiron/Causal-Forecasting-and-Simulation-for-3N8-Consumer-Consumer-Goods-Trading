import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./components/ThemeContext";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
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
import GetStarted from "./pages/GetStarted"; // new page

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => {
    // Get saved page from sessionStorage, default to "getstarted"
    return sessionStorage.getItem("currentPage") || "getstarted";
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // If user logs out, redirect to getstarted
      if (!currentUser && currentPage !== "login" && currentPage !== "signup" && currentPage !== "getstarted") {
        setCurrentPage("getstarted");
        sessionStorage.removeItem("currentPage");
      }
    });

    return () => unsubscribe();
  }, [currentPage]);

  // Save current page to sessionStorage whenever it changes
  useEffect(() => {
    if (currentPage) {
      sessionStorage.setItem("currentPage", currentPage);
    }
  }, [currentPage]);

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Protected pages that require authentication
  const protectedPages = ["home", "overview", "causal-analysis", "simulation", "profile", "accountsettings"];
  const isProtectedPage = protectedPages.includes(currentPage);

  // Redirect to login if accessing protected page without auth
  if (isProtectedPage && !user) {
    return (
      <ThemeProvider>
        <Login onNavigate={handleNavigation} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
        {currentPage === "getstarted" && <GetStarted onNavigate={handleNavigation} />}
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