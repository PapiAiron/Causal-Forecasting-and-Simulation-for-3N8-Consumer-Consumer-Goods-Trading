import React from "react";
import { Card, Header } from "../components/SharedComponents";
import { LifeBuoy, Mail, Phone } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

const Support = ({ onNavigate }) => {
  const { theme } = useTheme();

  return (
    <LayoutWrapper currentPage="support" onNavigate={onNavigate}>
      <div className="pt-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title="Help & Support"
          description="Find answers, reach out to us, or explore resources to get the most out of the system."
          icon={LifeBuoy}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Support Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Support
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Our team is here to help you. Reach out through any of the channels
              below:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  support@3n8-analytics.com
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  +63 (2) 1234-5678
                </span>
              </li>
            </ul>
          </Card>

          {/* FAQ / Quick Help */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Help
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                • Learn how to navigate the system on the{" "}
                <button
                  onClick={() => onNavigate("how-to-use")}
                  style={{ color: theme.chart }}
                  className="font-medium hover:underline"
                >
                  How to Use
                </button>{" "}
                page
              </li>
              <li>
                • Check details about the project in{" "}
                <button
                  onClick={() => onNavigate("about")}
                  style={{ color: theme.chart }}
                  className="font-medium hover:underline"
                >
                  About Us
                </button>
              </li>
              <li>• Reach out to your system admin for account issues</li>
            </ul>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Support;
