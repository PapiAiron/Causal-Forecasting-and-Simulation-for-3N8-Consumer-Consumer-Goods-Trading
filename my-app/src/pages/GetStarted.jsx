import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, FlaskConical, Truck, Store, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      const sections = ['overview', 'about'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Forecasting',
      description: 'Uses AI to predict sales with Causal Analysis'
    },
    {
      icon: FlaskConical,
      title: 'Simulate',
      description: 'Simulate your techniques to improve your sales'
    },
    {
      icon: Truck,
      title: 'Delivery Tracking',
      description: 'Track ongoing, delivered and performance metrics'
    },
    {
      icon: Store,
      title: 'Store Analytics',
      description: 'Monitor which stores is your top buyers, demand patterns and sales trends'
    },
    {
      icon: FileText,
      title: 'Full Reporting System',
      description: 'Monthly, weekly and yearly sales report'
    }
  ];

  const steps = [
    {
      title: 'Sign Up',
      description: 'Create your account and an admin will review your account creation request and have full access to the system\'s overall features.'
    },
    {
      title: 'AI-Powered Forecasting',
      description: 'Upload your CSV file or sales report and the AI model will process and predict your future sales with causal inference'
    },
    {
      title: 'Simulate',
      description: 'Configure your inventory parameters and test your techniques and pick the best way to boost your profit, for more informed and data-driven decision making.'
    },
    {
      title: 'Delivery Tracking',
      description: 'Add or mark as done deliveries and performance metrics'
    },
    {
      title: 'Full Reporting System',
      description: 'Select whether monthly, weekly or yearly full sales report'
    }
  ];

const team = [
  { 
    name: 'Marc Airon, Cantal T.',
    position: 'Lead Researcher | Backend',
    image: '/images/team/member1.jpg'
  },
  { 
    name: 'Salabsab, Richard Sean B.',
    position: 'Project Manager | Frontend',
    image: '/images/team/member2.jpg'
  },
  { 
    name: 'Mangalindan, Giro B.',
    position: 'Research | Documentation',
    image: '/images/team/member3.jpg'
  },
  { 
    name: 'Canaling, John Jasper D.',
    position: 'Data Scientist | Documentation',
    image: '/images/team/member4.jpg'
  }
];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/80 backdrop-blur-lg shadow-lg shadow-blue-500/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg transform group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/50">
                3N8
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Analytics
              </span>
            </div>
            
            <div className="flex items-center space-x-2 bg-slate-900/50 backdrop-blur-sm rounded-full p-1">
              {['overview', 'about'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`relative px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                    activeSection === section
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {activeSection === section && (
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                  )}
                  <span className="relative capitalize">{section === 'overview' ? 'Overview' : 'About Us'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Overview Section */}
      <section id="overview" className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Welcome to 3N8 Analytics
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-4xl mx-auto leading-relaxed">
              A smarter way to forecast sales, simulate your techniques, track deliveries, and monitor your distribution business growth
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate("login")}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => onNavigate("login")}
                className="px-8 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full font-semibold text-lg hover:bg-slate-800 hover:border-blue-500 transition-all duration-300 hover:scale-105"
              >
                Log In
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/50">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="group p-6 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-500/50">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <CheckCircle2 className="flex-shrink-0 w-6 h-6 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="min-h-screen py-20 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Our Research Team
          </h2>
          <p className="text-xl text-slate-300 mb-16 max-w-3xl mx-auto">
            Laguna University researchers to revolutionize and innovate sales forecasting
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {team.map((member, index) => (
              <div
                key={index}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative mb-4 mx-auto w-40 h-40">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

                  {/* Image container */}
                  <div className="
                    relative w-full h-full rounded-full overflow-hidden 
                    border-4 border-slate-600 group-hover:border-blue-500 
                    transition-all duration-300 group-hover:scale-105
                  ">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">
                  {member.name}
                </h3>

                <p className="text-slate-400">
                  {member.position}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="max-w-2xl mx-auto p-10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl">
            <h3 className="text-3xl font-bold mb-4">
              Ready to try the new age of sales forecasting?
            </h3>
            <p className="text-slate-300 mb-8">
              Join us today and transform your business intelligence
            </p>
            <button 
              onClick={() => onNavigate("login")}
              className="group px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center space-x-2 mx-auto"
            >
              <span>Start</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}