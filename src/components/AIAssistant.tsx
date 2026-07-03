import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, X, Send, Sparkles, Trash2, Sun, Moon, 
  User, CheckCircle, ArrowRight, CornerDownLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  accentColor?: string;
  glassClass?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function AIAssistant({ accentColor = "#3b82f6", glassClass = "glass-panel-medium" }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "👋 Hi! I'm Jaswanth's AI Assistant. Ask me anything about his skills, projects, education, experience, certifications, or how to contact him.",
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = [
    "What are his core skills?",
    "Tell me about his projects",
    "How can I contact him?",
    "Is he available for internships?"
  ];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsgText = textToSend.trim();
    setInput("");

    // Add User Message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Map history into expected backend format
      const chatHistory = messages.map(m => ({
        role: m.role,
        message: m.text
      }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsgText,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach assistant server.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Streaming reader not available on response body.");
      }

      // Initialize empty assistant message for streaming
      const assistantMsgId = `msg-${Date.now()}-assistant`;
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        text: "",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false); // Stop typing spinner immediately since real chunks are streaming in

      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode value and append to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process buffer by lines
        const lines = buffer.split("\n\n");
        // Keep the last partial line in buffer if any
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataText = line.trim().substring(6);
            if (dataText === "[DONE]") {
              continue;
            }
            accumulatedText += dataText;
            setMessages(prev =>
              prev.map(m => m.id === assistantMsgId ? { ...m, text: accumulatedText } : m)
            );
          }
        }
      }

      // Parse any remaining buffer content
      if (buffer.trim().startsWith("data: ")) {
        const dataText = buffer.trim().substring(6);
        if (dataText !== "[DONE]") {
          accumulatedText += dataText;
          setMessages(prev =>
            prev.map(m => m.id === assistantMsgId ? { ...m, text: accumulatedText } : m)
          );
        }
      }
    } catch (error) {
      console.error("AI assistant message error:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        text: "I ran into a connection error. Please verify your internet or contact Savani Jaswanth directly at savanijaswanth@gmail.com.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      setMessages([
        {
          id: "welcome-reset",
          role: "assistant",
          text: "👋 Hi! I'm Jaswanth's AI Assistant. Ask me anything about his skills, projects, education, experience, certifications, or how to contact him.",
          timestamp: new Date()
        }
      ]);
    }
  };

  // Safe formatting helper to render bold text and list bullets beautifully
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let cleanLine = line;
      // Check if line represents a bullet point
      const isBullet = line.startsWith("•") || line.trim().startsWith("*") || line.trim().startsWith("- ");
      if (isBullet) {
        cleanLine = line.replace(/^(•|\*|-)\s*/, "");
      }

      // Format bold markup: **text**
      const parts = cleanLine.split(/\*\*([^*]+)\*\*/g);
      const content = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return (
            <strong 
              key={pIdx} 
              className={`font-semibold ${isLightMode ? "text-gray-900" : "text-white"}`}
            >
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 pl-1">
            <span style={{ color: accentColor }} className="mt-1 select-none flex-shrink-0">•</span>
            <span className="flex-1 text-[11.5px] leading-relaxed">{content}</span>
          </div>
        );
      }

      return (
        <p key={idx} className={line.trim() === "" ? "h-2" : "my-1 text-[11.5px] leading-relaxed"}>
          {content}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300"
          style={{ 
            backgroundColor: isOpen ? "#ef4444" : accentColor,
            boxShadow: `0 10px 25px -5px ${accentColor}40, 0 8px 10px -6px ${accentColor}30`
          }}
          title="Chat with AI Assistant"
        >
          {/* Subtle radiating pulse */}
          {!isOpen && (
            <span 
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: accentColor }}
            />
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageSquare className="w-6 h-6 text-white" />
          )}

          {/* Quick badge */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-[#030303] animate-pulse" />
          )}
        </motion.button>
      </div>

      {/* Main Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed bottom-24 right-6 w-[360px] sm:w-[400px] h-[580px] max-h-[80vh] rounded-2xl border flex flex-col z-50 shadow-2xl overflow-hidden backdrop-blur-xl ${
              isLightMode 
                ? "bg-white/95 border-gray-200 text-gray-800" 
                : "bg-[#0b0c10]/95 border-white/10 text-gray-200"
            }`}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${
              isLightMode ? "bg-gray-50/80 border-gray-100" : "bg-white/5 border-white/5"
            }`}>
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white relative"
                  style={{ backgroundColor: accentColor }}
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-2 h-2 rounded-full border border-white" />
                </div>
                <div>
                  <h3 className={`text-xs font-bold font-mono uppercase tracking-wide ${
                    isLightMode ? "text-gray-900" : "text-white"
                  }`}>
                    Jaswanth AI Assistant
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-gray-400">Recruiter Assistant • Online</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Light / Dark Mode Toggle */}
                <button
                  onClick={() => setIsLightMode(!isLightMode)}
                  className={`p-1.5 rounded-lg transition border cursor-pointer ${
                    isLightMode 
                      ? "hover:bg-gray-100 border-gray-200 text-gray-600" 
                      : "hover:bg-white/5 border-white/5 text-gray-400"
                  }`}
                  title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </button>

                {/* Clear Chat History */}
                <button
                  onClick={handleClear}
                  className={`p-1.5 rounded-lg transition border cursor-pointer ${
                    isLightMode 
                      ? "hover:bg-gray-100 border-gray-200 text-gray-600" 
                      : "hover:bg-white/5 border-white/5 text-gray-400"
                  }`}
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition border cursor-pointer ${
                    isLightMode 
                      ? "hover:bg-gray-100 border-gray-200 text-gray-600" 
                      : "hover:bg-white/5 border-white/5 text-gray-400"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Icon/Avatar */}
                    <div className={`w-6 h-6 rounded-md flex items-shrink-0 items-center justify-center text-[10px] ${
                      msg.role === "user"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-1">
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 border-blue-500 text-white rounded-tr-none"
                          : isLightMode
                            ? "bg-gray-50 border-gray-100 text-gray-700 rounded-tl-none"
                            : "bg-white/5 border-white/5 text-gray-300 rounded-tl-none"
                      }`}>
                        {renderMessageContent(msg.text)}
                      </div>
                      <span className="block text-[8px] text-gray-500 font-mono text-right pl-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Animation */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-md flex items-shrink-0 items-center justify-center bg-purple-500/10 text-purple-400">
                      <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                    </div>
                    <div className={`p-3 rounded-xl border rounded-tl-none flex items-center gap-1 ${
                      isLightMode ? "bg-gray-50 border-gray-100" : "bg-white/5 border-white/5"
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions Area */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 block uppercase">Suggested queries</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition ${
                        isLightMode 
                          ? "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600" 
                          : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box Form */}
            <div className={`p-3 border-t ${
              isLightMode ? "bg-gray-50/50 border-gray-100" : "bg-black/20 border-white/5"
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me something about Savani..."
                  disabled={isLoading}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border focus:outline-none transition ${
                    isLightMode
                      ? "bg-white border-gray-200 text-gray-800 focus:border-blue-500"
                      : "bg-[#050505] border-white/10 text-white focus:border-white/20"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-lg text-white transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 text-[8px] text-gray-500 font-mono">
                <span>Grounded on dynamic portfolio database</span>
                <span className="flex items-center gap-0.5">
                  Powered by Gemini <Sparkles className="w-2 h-2 text-purple-400" />
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
