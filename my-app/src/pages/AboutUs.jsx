// src/pages/AboutUs.jsx
import React from "react";
import { Card, Header } from "../components/SharedComponents";
import { Info } from "lucide-react";

const AboutUs = ({ onNavigate }) => {
  return (
    <LayoutWrapper currentPage="about" onNavigate={onNavigate}>
      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title="About Us"
          description="Learn more about the team and purpose behind this system."
          icon={Info}
        />

        <Card className="p-6 mt-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Our system, <span className="font-semibold">3N8 Beverage Analytics</span>, was
            developed as part of a thesis project aimed at optimizing supply chain operations
            for the beverage industry. The system integrates causal forecasting, simulation,
            and dynamic visualization tools to help distributors make smarter inventory
            decisions, reduce waste, and adapt to fluctuating consumer demand.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            This project was created by BSCS students with the guidance of our thesis advisers,
            combining research, data science, and system development to deliver a practical
            solution for real-world industry challenges.
          </p>
        </Card>
      </div>
    </LayoutWrapper>
  );
};

export default AboutUs;
