import React from "react";
import { ArrowRight, UserPlus, BarChart3, Activity, FlaskConical } from "lucide-react";

const GetStarted = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-all duration-700 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-[100px] opacity-50 animate-pulse"></div>

      {/* Card */}
      <div className="relative bg-white/80 dark:bg-gray-900/70 backdrop-blur-2xl rounded-2xl shadow-xl border border-gray-200/30 dark:border-gray-700/40 p-6 w-[90%] sm:w-[420px] text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="3N8.png" 
            alt="3N8 Logo" 
            className="w-16 h-16 object-contain rounded-xl shadow-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          3N8 Analytics
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
          Smarter beverage sales forecasting & simulation.
        </p>

        {/* Feature Highlights (compact) */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-gray-700 dark:text-gray-300">
          <div className="flex flex-col items-center bg-white/50 dark:bg-gray-800/40 p-3 rounded-xl shadow hover:shadow-md transition">
            <BarChart3 className="w-6 h-6 text-blue-500 mb-1" />
            <p className="text-xs font-medium">Forecast</p>
          </div>
          <div className="flex flex-col items-center bg-white/50 dark:bg-gray-800/40 p-3 rounded-xl shadow hover:shadow-md transition">
            <Activity className="w-6 h-6 text-indigo-500 mb-1" />
            <p className="text-xs font-medium">Trends</p>
          </div>
          <div className="flex flex-col items-center bg-white/50 dark:bg-gray-800/40 p-3 rounded-xl shadow hover:shadow-md transition">
            <FlaskConical className="w-6 h-6 text-purple-500 mb-1" />
            <p className="text-xs font-medium">Simulate</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onNavigate("login")}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate("signup")}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-[11px] text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} 3N8 Consumer Goods Analytics
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
