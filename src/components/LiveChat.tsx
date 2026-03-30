import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Bot, Minus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const model = "gemini-3-flash-preview";

const SYSTEM_INSTRUCTION = `You are the Primewayz Support Bot. 
Primewayz is an elite software development agency that provides "Engineering as a Service".
Key features:
- No contracts, cancel anytime.
- Elite engineering talent.
- Scalable development teams.
- Fixed monthly pricing.
- Fast delivery.

Your goal is to be helpful, professional, and encourage users to book a call or fill out the contact form. 
Keep responses concise and friendly. If you don't know something, suggest they speak with a human expert.`;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp: Date;
}

export const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineCount, setOnlineCount] = useState(12);
  const [isBotAvailable, setIsBotAvailable] = useState(true);
  const [userName, setUserName] = useState(() => localStorage.getItem('chat_user_name') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('chat_user_email') || '');
  const [showLeadForm, setShowLeadForm] = useState(!userName || !userEmail);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('chat_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem('chat_session_id', newId);
    return newId;
  });
  const chatSessionRef = useRef<any>(null);

  // Fetch persistent chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat/${sessionId}`);
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setMessages(history.map((m: any) => ({
              ...m,
              id: m.id.toString(),
              timestamp: new Date(m.timestamp)
            })));
          } else {
            // Default welcome message if no history
            setMessages([{
              id: '1',
              text: 'Hi there! 👋 Welcome to Primewayz. How can we help you scale your development today?',
              sender: 'bot',
              timestamp: new Date(),
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchHistory();
  }, [sessionId]);

  // Polling for new messages (especially admin replies)
  useEffect(() => {
    if (!isOpen) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${sessionId}`);
        if (res.ok) {
          const history = await res.json();
          if (history.length > messages.length) {
            setMessages(history.map((m: any) => ({
              ...m,
              id: m.id.toString(),
              timestamp: new Date(m.timestamp)
            })));
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isOpen, sessionId, messages.length]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simulate real-time updates for online count
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => Math.max(5, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize Chat Session
  useEffect(() => {
    if (!chatSessionRef.current) {
      const dynamicInstruction = userName 
        ? `${SYSTEM_INSTRUCTION}\nThe user's name is ${userName}. Acknowledge them by name occasionally.`
        : SYSTEM_INSTRUCTION;

      chatSessionRef.current = ai.chats.create({
        model,
        config: {
          systemInstruction: dynamicInstruction,
        },
      });
    }
  }, [userName]);

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    localStorage.setItem('chat_user_name', userName);
    localStorage.setItem('chat_user_email', userEmail);
    
    try {
      await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: userName, email: userEmail })
      });
      setShowLeadForm(false);
    } catch (error) {
      console.error('Failed to save session details:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Save user message to database
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user', text: userMessage.text, sessionId })
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Get AI response
    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({
          model,
          config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
      }

      const result = await chatSessionRef.current.sendMessage({ message: userMessage.text });
      const botText = result.text;

      setIsTyping(false);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Save bot message to database
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'bot', text: botText, sessionId })
      });
    } catch (error) {
      console.error('AI Chat error:', error);
      setIsTyping(false);
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a little trouble connecting right now. Please try again in a moment or use our contact form!",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 border border-zinc-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-zinc-900 rounded-full ${isBotAvailable ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">Primewayz Support</h3>
                    <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">{onlineCount} Online</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Always Active</p>
                    <span className="w-0.5 h-0.5 bg-zinc-700 rounded-full" />
                    <p className="text-[10px] text-zinc-500 font-medium lowercase">Bot: {isBotAvailable ? 'Available' : 'Busy'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
              {showLeadForm ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">Welcome to Primewayz!</h4>
                    <p className="text-xs text-zinc-500 mt-1">Please introduce yourself to start chatting with our team.</p>
                  </div>
                  <form onSubmit={handleLeadSubmit} className="w-full space-y-3">
                    <input 
                      type="text"
                      placeholder="Your Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <input 
                      type="email"
                      placeholder="Your Email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <button 
                      type="submit"
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all"
                    >
                      Start Chatting
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-900/10' 
                          : msg.sender === 'admin'
                            ? 'bg-zinc-900 text-white rounded-bl-none shadow-lg'
                            : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.sender === 'admin' && (
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Support Agent</div>
                        )}
                        {msg.text}
                        <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-bl-none flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            {!showLeadForm && (
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-zinc-100 flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 bg-zinc-100 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none max-h-[120px] transition-[height] duration-100"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen && !isMinimized ? 'bg-zinc-900 text-white rotate-90' : 'bg-emerald-600 text-white'
        }`}
      >
        {isOpen && !isMinimized ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"
          />
        )}
      </motion.button>
    </div>
  );
};
