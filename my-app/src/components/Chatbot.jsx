import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your AI assistant powered by Gemini. How can I help you today?",
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

  // ------------------------
  //  AI RESPONSE HANDLER (Gemini API)
  // ------------------------
  const getAIResponse = async (userMessage, conversationHistory) => {
    try {
      // Build conversation history for Gemini
      const contents = conversationHistory
        .slice(-6)
        .map(msg => ({
          role: msg.type === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

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
        text: "Chat cleared! How can I help you today?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-red-500" : "bg-gradient-to-r from-blue-600 to-cyan-600"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[550px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center">
            <Sparkles className="w-6 h-6 text-white mr-3" />
            <div className="flex-1">
              <h3 className="text-white font-semibold">3N8 Assistant</h3>
              {/* <p className="text-white/80 text-xs">Powered by Gemini 2.5 Flash</p> */}
            </div>
            <button 
              onClick={clearChat} 
              className="text-white text-xs px-3 py-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded ml-2">
              <X className="text-white w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : ""}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[85%] ${
                    msg.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === "user"
                        ? "bg-blue-500"
                        : msg.isError
                        ? "bg-red-500"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600"
                    }`}
                  >
                    {msg.type === "user" ? (
                      <User className="text-white w-4 h-4" />
                    ) : (
                      <Bot className="text-white w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.type === "user"
                          ? "bg-blue-500 text-white"
                          : msg.isError
                          ? "bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line break-words">{msg.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                  <Bot className="text-white w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
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

          {/* Input Box */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 resize-none dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;