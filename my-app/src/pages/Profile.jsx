// src/pages/Profile.jsx
import React from "react";
import { Card, Header } from "../components/SharedComponents";
import { User } from "lucide-react";

const Profile = ({ onNavigate }) => {
  return (
    <LayoutWrapper currentPage="profile" onNavigate={onNavigate}>
      <div className="pt-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title="Your Profile"
          description="Manage your account information and settings."
          icon={User}
        />

        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h3>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p><strong>Name:</strong> Juan Dela Cruz</p>
            <p><strong>Email:</strong> juan.delacruz@example.com</p>
            <p><strong>Role:</strong> System Administrator</p>
          </div>
        </Card>
      </div>
    </LayoutWrapper>
  );
};

export default Profile;
