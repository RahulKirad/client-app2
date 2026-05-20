import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useManagedSectionContent } from '../hooks/useManagedSectionContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DEFAULT_WELCOME =
  "Hi! I'm the Cottonunique assistant. I can help with our sustainable tote bags, GOTS certification, ordering (samples, bulk, custom), and how to get in touch. What would you like to know?";

const contactFallback = {
  phone: '+91 7020631149',
  whatsapp_number: '+91 7020631149',
  whatsapp_message: "Hi Cottonunique! I’d like to know more about your tote bags.",
};

function toWhatsAppE164Digits(input: string): string {
  const digitsOnly = input.replace(/[^\d]/g, '');
  // Basic sanity: wa.me requires country code + number without '+'.
  return digitsOnly;
}

function buildWhatsAppUrl(numberRaw: string, message: string): string | null {
  const digits = toWhatsAppE164Digits(numberRaw);
  if (digits.length < 8) return null;
  const qs = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${qs}`;
}

export default function Chatbot() {
  const { content: contact } = useManagedSectionContent('contact', contactFallback);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = () => {
    apiClient.getChatbotSettings().then((s) => {
      const nextEnabled = s.enabled === true;
      setEnabled(nextEnabled);
      if (!nextEnabled) setIsOpen(false);
      const welcome = s.welcomeMessage?.trim() || DEFAULT_WELCOME;
      setMessages((prev) => (prev.length === 0 ? [{ role: 'assistant', content: welcome, timestamp: new Date().toISOString() }] : prev));
    }).catch(() => {
      setEnabled(false);
      setIsOpen(false);
      setMessages((prev) => (prev.length === 0 ? [{ role: 'assistant', content: DEFAULT_WELCOME, timestamp: new Date().toISOString() }] : prev));
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const onFocus = () => fetchSettings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Poll settings so toggle Off in admin hides the chatbot without refresh (30s to avoid rate limit)
  useEffect(() => {
    const interval = setInterval(fetchSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await apiClient.sendChatMessage(userMessage.content, conversationHistory);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorContent = "I'm sorry, I'm having trouble connecting right now. Please try again later or use the contact form to reach us.";
      
      // Show debug info in development
      if (import.meta.env.DEV && error.debug) {
        errorContent += `\n\n[Debug Info]\nModel: ${error.debug.usingModel || error.debug.attemptedModel || 'unknown'}\nError: ${error.message || 'Unknown error'}`;
        if (error.debug.finalErrorStatus) {
          errorContent += `\nStatus: ${error.debug.finalErrorStatus}`;
        }
        console.log('Chatbot Debug Info:', error.debug);
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const whatsappNumberRaw = String(contact?.whatsapp_number || contact?.phone || '').trim();
  const whatsappUrl = buildWhatsAppUrl(whatsappNumberRaw, String(contact?.whatsapp_message || '').trim());

  // If chatbot settings haven't loaded yet, still show WhatsApp (if configured).
  if (enabled === null && !whatsappUrl) return null;

  return (
    <>
      {/* WhatsApp Button (stacked above chatbot) */}
      {!isOpen && whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={`fixed ${
            enabled === true ? 'bottom-20 right-4 sm:bottom-24 sm:right-6' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
          } z-50 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 hover:scale-110 hover:opacity-90 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16`}
          style={{ backgroundColor: '#25D366' }}
          aria-label="Chat on WhatsApp"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.52 3.48A11.82 11.82 0 0 0 12.04 0C5.46 0 .11 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.27-1.64a11.9 11.9 0 0 0 5.73 1.46h.01c6.58 0 11.93-5.35 11.94-11.93 0-3.18-1.24-6.17-3.43-8.41ZM12.01 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.9 9.9 0 0 1-1.51-5.26C2.15 6.46 6.57 2.04 12.05 2.04c2.64 0 5.12 1.03 6.98 2.9a9.8 9.8 0 0 1 2.89 6.99c-.01 5.48-4.43 9.9-9.91 9.9Zm5.76-7.87c-.31-.16-1.84-.91-2.13-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1.01 1.22-.18.21-.37.23-.68.08-.31-.16-1.31-.48-2.5-1.53-.92-.82-1.55-1.84-1.73-2.15-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.63-.52-.54-.71-.55l-.6-.01c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.47.26-.73.26-1.36.18-1.47-.08-.11-.29-.18-.6-.34Z" />
          </svg>
        </a>
      )}

      {/* Chatbot Toggle Button - pastel green */}
      {!isOpen && enabled === true && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 hover:scale-110 hover:opacity-90 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16"
          style={{ backgroundColor: '#A5D6A7' }}
          aria-label="Open chatbot"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chatbot Window - pastel green & white */}
      {isOpen && enabled === true && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] z-50 max-w-[calc(100vw-2rem)] sm:max-w-[400px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border-2 border-[#C8E6C9]">
          {/* Header - pastel green */}
          <div
            className="px-4 py-3 flex items-center justify-between text-white"
            style={{ backgroundColor: '#7CB342' }}
          >
            <div className="flex items-center gap-2">
              <img
                src="/images/favicon.png"
                alt="Cottonunique"
                className="w-8 h-8 rounded-full object-contain bg-white flex-shrink-0"
              />
              <h3 className="font-semibold text-base sm:text-lg truncate min-w-0">Cottonunique Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:opacity-90 rounded-full p-1 transition-opacity"
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages - white background */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white" style={{ maxHeight: '400px' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-[#C8E6C9] flex items-center justify-center overflow-hidden">
                    <img src="/images/favicon.png" alt="" className="w-6 h-6 object-contain" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'bg-white text-gray-800 border-2 border-[#C8E6C9]'
                  }`}
                  style={message.role === 'user' ? { backgroundColor: '#81C784' } : undefined}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C8E6C9' }}>
                    <User size={16} style={{ color: '#2E7D32' }} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-[#C8E6C9] flex items-center justify-center overflow-hidden">
                  <img src="/images/favicon.png" alt="" className="w-6 h-6 object-contain" />
                </div>
                <div className="bg-white text-gray-800 border-2 border-[#C8E6C9] rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#7CB342', animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#7CB342', animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#7CB342', animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - white with pastel green accents */}
          <div className="p-4 border-t-2 border-[#C8E6C9] bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-2 border-2 border-[#C8E6C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-[#7CB342] text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="text-white rounded-lg px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: '#7CB342' }}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by Google Gemini AI • Cottonunique assistant
            </p>
          </div>
        </div>
      )}
    </>
  );
}
