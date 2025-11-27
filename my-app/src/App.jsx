import React, { useState, useEffect } from "react";
import PageTransition from "./components/PageTransition";
import { ThemeProvider } from "./components/ThemeContext";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import DashboardHome from "./pages/DashboardHome";
import CausalAnalysis from "./pages/CausalAnalysis";
import Simulation from "./pages/Simulation";
import Profile from "./pages/Profile";
import Support from "./pages/SupportPage";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AccountSettings from "./pages/AccountSettings";
import GetStarted from "./pages/GetStarted";
import ManageAccounts from "./pages/ManageAccounts";
import AdminUserVerification from "./pages/AdminUserVerification";
import SettingsPage from "./pages/SettingsPage";
import AppearanceSettings from "./pages/AppearanceSettings";
import Chatbot from "./components/Chatbot";

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => {
    return sessionStorage.getItem("currentPage") || "getstarted";
  });
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation history for back button
  const [history, setHistory] = useState(() => {
    const savedHistory = sessionStorage.getItem("navigationHistory");
    return savedHistory ? JSON.parse(savedHistory) : ["getstarted"];
  });

  // Listen for auth state changes and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch user role and status from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || "staff");
            setAccountStatus(userData.accountStatus || "active");
            
            // Check if account is not active
            if (userData.accountStatus === "pending") {
              setCurrentPage("login");
              sessionStorage.removeItem("currentPage");
            } else if (userData.accountStatus === "suspended" || userData.accountStatus === "disabled") {
              setCurrentPage("login");
              sessionStorage.removeItem("currentPage");
            }
          } else {
            setUserRole("staff");
            setAccountStatus("active");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserRole("staff");
          setAccountStatus("active");
        }
      } else {
        setUserRole(null);
        setAccountStatus(null);
        
        // If user logs out, redirect to getstarted
        if (currentPage !== "login" && currentPage !== "signup" && currentPage !== "getstarted" && currentPage !== "support" && currentPage !== "about") {
          setCurrentPage("getstarted");
          sessionStorage.removeItem("currentPage");
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentPage]);

  // Save current page to sessionStorage whenever it changes
  useEffect(() => {
    if (currentPage) {
      sessionStorage.setItem("currentPage", currentPage);
    }
  }, [currentPage]);

  // Save navigation history to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("navigationHistory", JSON.stringify(history));
  }, [history]);

  const handleNavigation = (page) => {
    // Check if navigating to admin pages and user has permission
    if ((page === "manage-accounts" || page === "user-verification") && userRole !== "admin") {
      alert("Access Denied: You need admin privileges to access this page.");
      return;
    }
    
    // Add to history and navigate
    setHistory([...history, page]);
    setCurrentPage(page);
  };

  const handleGoBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]);
    }
  };

  // Determine if back button should be shown
  const canGoBack = history.length > 1;
  const onBack = canGoBack ? handleGoBack : null;

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
  const protectedPages = [
    "home", 
    "causal-analysis", 
    "simulation",
    "settings",
    "appearance",
    "profile", 
    "accountsettings",
    "manage-accounts",
    "user-verification"
  ];
  
  // Admin-only pages
  const adminPages = ["manage-accounts", "user-verification"];
  
  const isProtectedPage = protectedPages.includes(currentPage);
  const isAdminPage = adminPages.includes(currentPage);

  // Redirect to login if accessing protected page without auth
  if (isProtectedPage && !user) {
    return (
      <ThemeProvider>
        <Login onNavigate={handleNavigation} />
      </ThemeProvider>
    );
  }

  // Redirect to home if accessing admin page without admin role
  if (isAdminPage && userRole !== "admin") {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need admin privileges to access this page.
            </p>
            <button
              onClick={() => handleNavigation("home")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show account status message if account is not active
  if (user && accountStatus !== "active" && currentPage !== "login") {
    const statusMessages = {
      pending: "Your account is pending verification. Please wait for an administrator to approve your account.",
      suspended: "Your account has been suspended. Please contact support for more information.",
      disabled: "Your account has been disabled. Please contact support for assistance.",
      rejected: "Your account verification was not approved. Please contact support for more information."
    };

    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">
              Account {accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {statusMessages[accountStatus] || "There is an issue with your account."}
            </p>
            <button
              onClick={() => {
                auth.signOut();
                handleNavigation("login");
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <PageTransition key={currentPage}>
              <div className="text-gray-900 dark:text-white font-sans">
        {currentPage === "getstarted" && <GetStarted onNavigate={handleNavigation} />}
        {currentPage === "home" && <DashboardHome onNavigate={handleNavigation} onBack={null} />}
        {currentPage === "causal-analysis" && <CausalAnalysis onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "simulation" && <Simulation onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "settings" && <SettingsPage onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "appearance" && <AppearanceSettings onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "profile" && <Profile onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "support" && <Support onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "about" && <AboutUs onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "login" && <Login onNavigate={handleNavigation} />}
        {currentPage === "signup" && <SignUp onNavigate={handleNavigation} />}
        {currentPage === "accountsettings" && <AccountSettings onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "manage-accounts" && <ManageAccounts onNavigate={handleNavigation} onBack={onBack} />}
        {currentPage === "user-verification" && <AdminUserVerification onNavigate={handleNavigation} onBack={onBack} />}
      </div>
      </PageTransition>
       {user && currentPage !== "login" && currentPage !== "signup" && currentPage !== "getstarted" && <Chatbot />}
    </ThemeProvider>
  );
};

export default App;