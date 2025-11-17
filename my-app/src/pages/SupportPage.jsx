import React from 'react';
import { HelpCircle, Mail, Phone, MessageCircle, FileText } from 'lucide-react';
import { LayoutWrapper } from './DashboardHome';
import { Card, Header } from '../components/SharedComponents';
import { useTheme } from '../components/ThemeContext';

const Support = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();

  return (
    <LayoutWrapper currentPage="support" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="Help & Support"
          description="Get assistance with your analytics platform"
          icon={HelpCircle}
          onBack={onBack}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
              <div className="space-y-3">
                <button className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                  <Mail className="w-5 h-5" style={{ color: theme.chart }} />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-500">support@3n8.com</p>
                  </div>
                </button>
                <button className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                  <Phone className="w-5 h-5" style={{ color: theme.chart }} />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                  </div>
                </button>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => onNavigate('about')}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <FileText className="w-4 h-4" />
                  <span>About Us</span>
                </button>
                <button 
                  onClick={() => onNavigate('home')}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <FileText className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Support;