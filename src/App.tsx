import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, GraduationCap, RefreshCw, ChevronRight } from 'lucide-react';
import { ChatBubble } from './components/ChatBubble';
import { MathInput } from './components/MathInput';
import { GlossaryOverlay } from './components/GlossaryOverlay';
import { VoiceChatMode } from './components/VoiceChatMode';
import { PaymentButton } from './components/PaymentButton';
import { chatStream, type Message } from './lib/gemini';
import { MATH_TOPICS, type MathTopic } from './constants';
import { cn } from '@/lib/utils';
import { speak, stopSpeaking } from './lib/speech';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const WELCOME_MESSAGES = [
  "Hello! I'm your Socratic math tutor. I'm here to help you understand the 'why' behind the math, not just the 'how'.",
  "Feel free to upload a photo of a problem you're working on, or just type it out. We'll take it one step at a time."
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setPaymentStatus('success');
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.3 },
        colors: ['#4f46e5', '#818cf8', '#ffffff']
      });
      // Clear the query param
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'cancel') {
      setPaymentStatus('cancel');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(MATH_TOPICS.map(t => t.category)))], []);
  
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "All") return MATH_TOPICS;
    return MATH_TOPICS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    // Scroll to bottom whenever messages or streaming text changes
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, currentStreamedText]);

  // Handle voice character introductions and feedback
  const changeVoice = (voice: "male" | "female") => {
    setSelectedVoice(voice);
    setIsVoiceChatMode(true);
    stopSpeaking();
  };

  const speakLastMessage = (content: string) => {
    // Clean markdown before speaking
    const cleanText = content.replace(/\[\[(.*?)\]\]/g, (_, p1) => p1).replace(/[#*`_]/g, '');
    speak(cleanText, selectedVoice);
  };

  const handleSendMessage = async (content: string, image?: string) => {
    stopSpeaking();
    const newUserMessage: Message = { role: "user", content, image };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setCurrentStreamedText("");
    
    let fullContent = "";

    try {
      await chatStream(updatedMessages, (chunk) => {
        fullContent += chunk;
        setCurrentStreamedText(fullContent);
      });
    } catch (err) {
      console.error(err);
      fullContent = "I'm sorry, I encountered an error. Could you try rephrasing that?";
    } finally {
      setIsStreaming(false);
      const finalContent = fullContent || "I'm here to help! Could you please try rephrasing that?";
      setMessages((prev) => [...prev, { role: "model", content: finalContent }]);
      setCurrentStreamedText("");
      
      // Automatically speak the tutor's response
      speakLastMessage(finalContent);

      const successKeywords = ["correct", "great job", "bingo", "exactly", "you got it", "excellent"];
      if (successKeywords.some(word => finalContent.toLowerCase().includes(word))) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5a5a40', '#d4af37', '#ffffff']
        });
      }
    }
  };

  const handleClear = () => {
    if (confirm("Would you like to start a fresh lesson?")) {
      stopSpeaking();
      setMessages([]);
    }
  };

  const openGlossary = (term?: string) => {
    setInitialGlossaryTerm(term || null);
    setIsGlossaryOpen(true);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 border-x border-slate-200 max-w-7xl mx-auto shadow-2xl">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">SocraticTutor<span className="text-indigo-600">AI</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Select tutor voice character">
            <button 
              type="button"
              onClick={() => changeVoice("male")}
              aria-checked={selectedVoice === "male"}
              role="radio"
              className={cn(
                "group relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-50",
                selectedVoice === "male" ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"
              )}
              aria-label="Paul, Male Socratic Tutor"
            >
              <div className={cn(
                "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-2xl border-2 shadow-sm overflow-hidden group-hover:scale-110 transition-transform",
                selectedVoice === "male" ? "border-indigo-400" : "border-white"
              )}>
                👨‍🏫
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                selectedVoice === "male" ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
              )}>Male</span>
            </button>
            <button 
              type="button"
              onClick={() => changeVoice("female")}
              aria-checked={selectedVoice === "female"}
              role="radio"
              className={cn(
                "group relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-50",
                selectedVoice === "female" ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"
              )}
              aria-label="Sarah, Female Socratic Tutor"
            >
              <div className={cn(
                "w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-2xl border-2 shadow-sm overflow-hidden group-hover:scale-110 transition-transform",
                selectedVoice === "female" ? "border-indigo-400" : "border-white"
              )}>
                👩‍🏫
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                selectedVoice === "female" ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
              )}>Female</span>
            </button>
          </div>

          
          <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Session</p>
            <p className="text-sm font-medium text-slate-700">Explore Math</p>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-all"
          >
            <RefreshCw size={14} />
            New Lesson
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-8 scroll-smooth bg-slate-50"
      >
        <div className="max-w-4xl mx-auto">
          {/* Welcome Interface */}
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center space-y-8"
            >
              <div className="max-w-2xl mx-auto space-y-4">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 relative mb-2">
                  <BrainCircuit size={32} className="text-white" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full border-4 border-slate-50"
                  />
                </div>
                <h2 className="text-3xl font-serif text-slate-900 italic">
                  What shall we explore today?
                </h2>
                <div className="space-y-2 text-slate-500 font-medium leading-relaxed max-w-lg mx-auto text-sm">
                  {WELCOME_MESSAGES.map((msg, i) => (
                    <motion.p 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                    >
                      {msg}
                    </motion.p>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col items-center gap-6 py-4">
                {paymentStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 text-green-700 font-medium shadow-sm"
                  >
                    <CheckCircle2 size={24} className="text-green-500" />
                    <div>
                      <p className="font-bold">Payment Successful!</p>
                      <p className="text-xs text-green-600/80">You've unlocked lifetime access to Socratic Math Tutor AI.</p>
                    </div>
                  </motion.div>
                ) : paymentStatus === 'cancel' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4 text-orange-700 font-medium shadow-sm"
                  >
                    <AlertCircle size={24} className="text-orange-500" />
                    <div>
                      <p className="font-bold">Payment Cancelled</p>
                      <p className="text-xs text-orange-600/80">Your transaction was not completed. No charges were made.</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Premium Socratic Experience</p>
                    <PaymentButton />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 px-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                      selectedCategory === cat 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto px-4 pb-12">
                <AnimatePresence mode="popLayout">
                  {filteredTopics.map((tag, i) => (
                    <motion.button 
                      layout
                      key={tag.text}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSendMessage(`Help me get started with a ${tag.text} problem.`)}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all text-left group"
                    >
                      <span className="text-2xl font-serif italic text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 w-10 text-center">
                        {tag.icon}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-slate-800 tracking-tight text-sm truncate">{tag.text}</div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5 truncate">{tag.sub}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <ChatBubble 
                  key={idx} 
                  message={msg} 
                  onTermClick={openGlossary}
                />
              ))}
              {isStreaming && (
                <ChatBubble 
                  message={{ role: "model", content: currentStreamedText || "Reflecting..." }} 
                  isStreaming={true}
                  onTermClick={openGlossary}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-100 p-4 shrink-0 shadow-inner z-10">
        <MathInput onSendMessage={handleSendMessage} disabled={isStreaming} />
        <div className="text-center mt-1">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            Socratic Intelligence • High Performance Reasoning
          </p>
        </div>
      </footer>
      
      {/* Action Footer */}
      <div className="h-12 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
        <div className="flex gap-8">
          <button 
            onClick={() => openGlossary()}
            className="hover:text-indigo-600 transition-colors"
          >
            Glossary
          </button>
          <button className="hover:text-indigo-600 transition-colors">Formula Sheet</button>
          <button className="hover:text-indigo-600 transition-colors">Help</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          AI System Ready
        </div>
      </div>

      <GlossaryOverlay 
        isOpen={isGlossaryOpen} 
        onClose={() => setIsGlossaryOpen(false)} 
        initialTerm={initialGlossaryTerm}
      />

      <AnimatePresence>
        {isVoiceChatMode && (
          <VoiceChatMode 
            gender={selectedVoice} 
            onClose={() => setIsVoiceChatMode(false)}
            history={messages}
            onNewUserMessage={(content) => {
              setMessages(prev => [...prev, { role: 'user', content }]);
            }}
            onNewAIResponse={(content) => {
              setMessages(prev => [...prev, { role: 'model', content }]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
