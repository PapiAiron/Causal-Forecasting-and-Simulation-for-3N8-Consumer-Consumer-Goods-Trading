// src/pages/AboutUs.jsx
import React from "react";
import { Card, Header } from "../components/SharedComponents";
import { LayoutWrapper } from "./DashboardHome";
import { Info } from "lucide-react";

const team = [
  { 
    name: "Marc Airon Cantal T.",
    position: "Lead Researcher | Backend",
    image: "/images/team/member1.jpg"
  },
  { 
    name: "Salabsab, Richard Sean B.",
    position: "Project Manager | Frontend",
    image: "/images/team/member2.jpg"
  },
  { 
    name: "Mangalindan, Giro B.",
    position: "Research | Documentation",
    image: "/images/team/member3.jpg"
  },
  { 
    name: "Canaling, John Jasper D.",
    position: "Data Scientist | Documentation",
    image: "/images/team/member4.jpg"
  }
];

export default function AboutUs({ onNavigate, onBack }) {
  return (
    <LayoutWrapper currentPage="about" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="About Us"
          description="Learn more about the team and the purpose behind this system."
          icon={Info}
          onBack={onBack}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Purpose Card — styled like GetStarted */}
          <Card className="p-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What is 3N8 Beverage Analytics?
            </h2>

            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              <span className="font-semibold">3N8 Beverage Analytics</span> was
              developed as a thesis project aimed at optimizing supply chain operations
              for the beverage industry. Using causal forecasting, simulation, and
              interactive visualization tools, the system helps distributors make
              smarter inventory decisions, reduce waste, and respond to dynamic market
              demand.
            </p>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This project was built by BSCS students of Laguna University, combining
              research, data science, and full-stack system development to deliver a
              practical and innovative real-world solution.
            </p>
          </Card>

          {/* Team Section */}
          <section className="mt-16 text-center">
            <h2 className="
              text-3xl sm:text-4xl font-bold 
              bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 
              dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 
              bg-clip-text text-transparent mb-4
            ">
              Our Research Team
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Innovators committed to transforming sales forecasting through research and technology.
            </p>

            {/* Team Grid - Horizontal Layout */}
            <div className="flex flex-wrap justify-center items-start gap-8 md:gap-12 max-w-6xl mx-auto">
              {team.map((member, index) => (
                <div 
                  key={index} 
                  className="group flex flex-col items-center w-40"
                >
                  <div className="relative mb-4 w-40 h-40">
                    {/* Hover glow */}
                    <div className="
                      absolute inset-0
                      bg-gradient-to-br from-blue-500 to-purple-600 
                      rounded-full opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300 blur-xl
                    " />

                    {/* Image container */}
                    <div className="
                      relative w-full h-full rounded-full overflow-hidden 
                      border-4 border-gray-300 dark:border-slate-600 
                      group-hover:border-blue-500 
                      transition-all duration-300 group-hover:scale-105
                      shadow-lg
                    ">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
                    {member.position}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </LayoutWrapper>
  );
}