// src/pages/Profile.jsx
import React from "react";
import { LayoutWrapper } from './DashboardHome';  
import { Card, Header } from "../components/SharedComponents";
import { User, Settings } from "lucide-react";

const Profile = ({ onNavigate }) => {
  return (
    <LayoutWrapper currentPage="profile" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="Your Profile"
          description="Manage your account information and settings."
          icon={User}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"> 
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 mb-6">
              <p><strong>Name:</strong> Juan Dela Cruz</p>
              <p><strong>Email:</strong> juan.delacruz@example.com</p>
              <p><strong>Role:</strong> System Administrator</p>
            </div>

            {/* 👇 New Account Settings Button */}
            <button
              onClick={() => onNavigate("accountsettings")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </button>
          </Card>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Profile;