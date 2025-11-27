import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your 3N8 System Assistant. I can help you with:\n\n📊 Causal Analysis & Events - Sales forecasting with event planning\n📦 Inventory Simulation - Stock management and optimization\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Gemini API Configuration
  const GEMINI_API_KEY = "AIzaSyDls9Ny2ciONGXc-QC5QI1o77eXtaWGydE";
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close chatbot when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.chatbot-window') && !event.target.closest('.chatbot-button')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ------------------------
  //  AI RESPONSE HANDLER (Gemini API)
  // ------------------------
  const getAIResponse = async (userMessage, conversationHistory) => {
    try {
      // System prompt to restrict responses to system functions only
      const systemPrompt = `You are a specialized AI assistant for the 3N8 Beverage Sales Analytics System. You can ONLY answer questions about these two main features:

**1. CAUSAL ANALYSIS & EVENTS MODULE:**
- Upload historical sales data (CSV, XLSX, XLS, TXT, TSV formats)
- Automatically generates 1-year sales forecasts
- Analyze feature importance and causal factors affecting sales
- Add causal events that impact sales (weather conditions, holidays, festivals, major events)
- Event types: Hot Weather (+25%), Cold Weather (-15%), Rainy Season (-20%), Holidays (+40%), Major Events (+35%), Other factors
- View data in multiple time periods: Daily, Weekly, Monthly, Quarterly, Yearly
- Three visualization charts: Combined Sales Overview, Forecast with Event Impact Breakdown, Historical Sales Analysis
- Track metrics: Average Sales, Total Forecast, Active Events, Total Impact percentage
- Events must be within forecast period and cannot overlap with same type
- Visual breakdown showing baseline forecast vs predicted with events

**2. INVENTORY SIMULATION MODULE:**
- Industry-standard continuous review (Q, r) inventory policy
- Configure parameters: Average Daily Demand, Replenishment Quantity (Q), Lead Time (days), Simulation Period
- Market scenarios: Normal, Promotional (+30% demand), Holiday (+50% demand), Economic Downturn (-20% demand)
- Key metrics displayed: Replenishment Qty, Reorder Point, Service Level, Total Shortages
- Performance tracking: Total Demand, Demand Fulfilled, Avg Inventory, Stockout Days, Inventory Turnover, Fill Rate, Peak/Min Stock, Safety Stock
- Interactive chart showing Daily Inventory & Demand Tracking with On-Hand Stock, Daily Demand, Unmet Demand, Inventory Position
- Automated decision recommendations based on service level and shortage analysis
- Color-coded alerts: Green (excellent ≥95%), Yellow (acceptable ≥90%), Red (below target)

**IMPORTANT RULES:**
- If asked about anything outside these two modules, politely redirect: "I'm specialized in the Causal Analysis and Inventory Simulation features of the 3N8 system. I can help you understand how to use these modules. What would you like to know about sales forecasting or inventory management?"
- Provide specific, actionable guidance on using these features
- Use clear, professional language
- Reference specific UI elements, buttons, and workflows when relevant
- If unsure about a detail, say "I don't have that specific information, but I can explain the general functionality"

Respond to the user's question now:`;

      // Build conversation history for Gemini
      const contents = [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will only provide assistance related to the Causal Analysis & Events module and the Inventory Simulation module of the 3N8 Beverage Sales Analytics System. I'm ready to help users understand and use these features effectively." }]
        }
      ];

      // Add conversation history (last 4 exchanges to stay within context)
      conversationHistory.slice(-8).forEach(msg => {
        contents.push({
          role: msg.type === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });

      // Add the new user message
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            response: "⏱️ Rate limit reached! Please wait a moment and try again.",
            isRateLimit: true
          };
        }
        if (response.status === 503) {
          return {
            success: false,
            response: "⏳ Service temporarily unavailable. Try again in a moment.",
            isRateLimit: true
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error:", errorData);
        
        return {
          success: false,
          response: `❌ Error ${response.status}: Unable to get response. Please try again.`
        };
      }

      const data = await response.json();

      // Extract text from Gemini response
      let text = "";
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = data.candidates[0].content.parts[0].text;
      } else {
        text = "I'm having trouble generating a response. Could you try rephrasing?";
      }

      return { success: true, response: text.trim() };
    } catch (err) {
      console.error("AI ERROR:", err);
      return {
        success: false,
        response: "❌ Network error. Please check your connection and try again."
      };
    }
  };

  // ------------------------
  //  SEND MESSAGE
  // ------------------------
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    const result = await getAIResponse(
      userMessage.text,
      [...messages, userMessage]
    );

    const botResponse = {
      id: Date.now() + 1,
      type: "bot",
      text: result.response,
      timestamp: new Date(),
      isError: !result.success,
      isRateLimit: result.isRateLimit
    };

    setMessages(prev => [...prev, botResponse]);
    setIsLoading(false);
  };

  const handleKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        text: "Chat cleared! How can I assist you with Causal Analysis or Inventory Simulation?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Button - Responsive positioning */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`chatbot-button fixed z-50 p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95
          bottom-4 right-4 sm:bottom-6 sm:right-6
          ${isOpen ? "bg-red-500" : "bg-gradient-to-r from-blue-600 to-cyan-600"}`}
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Chat Window - Fully Responsive */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Chat Container */}
          <div className={`chatbot-window fixed z-50 flex flex-col overflow-hidden
            bg-white dark:bg-gray-800 
            shadow-2xl border border-gray-200 dark:border-gray-700
            
            /* Mobile: Full screen */
            inset-0 rounded-none
            
            /* Tablet: Compact bottom sheet */
            sm:inset-x-4 sm:bottom-4 sm:top-auto sm:h-[500px] sm:max-h-[70vh] sm:rounded-2xl
            
            /* Desktop: Compact side panel */
            md:right-4 md:left-auto md:bottom-20 md:top-auto md:w-80 md:h-[480px] md:max-h-[70vh] md:rounded-2xl
            
            /* Large Desktop: Slightly larger */
            lg:w-[360px] lg:h-[520px] lg:max-h-[75vh]`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 sm:p-4 flex items-center flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white mr-2 sm:mr-3" />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm sm:text-base truncate">3N8 Assistant</h3>
                <p className="text-white/80 text-xs hidden sm:block">Causal Analysis & Inventory</p>
              </div>
              <button 
                onClick={clearChat} 
                className="text-white text-xs px-2 py-1 sm:px-3 sm:py-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-white/20 rounded ml-1 sm:ml-2"
              >
                <X className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Messages Container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 space-y-3 sm:space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : ""}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
                      msg.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.type === "user"
                          ? "bg-blue-500"
                          : msg.isError
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-blue-600 to-cyan-600"
                      }`}
                    >
                      {msg.type === "user" ? (
                        <User className="text-white w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Bot className="text-white w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                          msg.type === "user"
                            ? "bg-blue-500 text-white"
                            : msg.isError
                            ? "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-line break-words">{msg.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1 sm:px-2">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                    <Bot className="text-white w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box - Fixed at bottom */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about forecasting or inventory..."
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 resize-none dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center hidden sm:block">
                Press Enter to send • Shift+Enter for new line
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center sm:hidden">
                Tap Send or press Enter
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Chatbot;