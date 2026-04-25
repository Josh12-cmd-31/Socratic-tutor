import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, GraduationCap, RefreshCw, ChevronRight, LayoutGrid, Clock, Lock, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { ChatBubble } from './components/ChatBubble';
import { MathInput } from './components/MathInput';
import { GlossaryOverlay } from './components/GlossaryOverlay';
import { VoiceChatMode } from './components/VoiceChatMode';
import { SocraticSolverOverlay } from './components/SocraticSolverOverlay';
import { PaymentButton } from './components/PaymentButton';
import { TopicsOverlay } from './components/TopicsOverlay';
import { ProfileOverlay } from './components/ProfileOverlay';
import { HistoryOverlay } from './components/HistoryOverlay';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { useAuth } from './contexts/AuthContext';
import { askAI } from './lib/externalAi';
import { chatStream, type Message } from './lib/gemini';
import { MATH_TOPICS, type MathTopic } from './constants';
import { cn } from '@/lib/utils';
import { speak, stopSpeaking } from './lib/speech';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getTrialState, setPaidStatus, type TrialState } from './lib/trial';
import confetti from 'canvas-confetti';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

const WELCOME_MESSAGES = [
  "Hello! I am your Socratic math tutor. I'm so glad you're here to learn with me today!",
  "I'm here to help you understand the 'why' behind mathematical concepts, not just the answers. What shall we explore together?"
];

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [isSolverOpen, setIsSolverOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initialGlossaryTerm, setInitialGlossaryTerm] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | null>(null);
  const [trial, setTrial] = useState<TrialState>(getTrialState(profile?.createdAt));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.createdAt) {
      setTrial(getTrialState(profile.createdAt));
    }
  }, [profile?.createdAt]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success' && user) {
      setPaymentStatus('success');
      setPaidStatus(true);
      // Sync with Firestore
      updateDoc(doc(db, 'users', user.uid), { isPremium: true });
      setTrial(getTrialState());
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

  useEffect(() => {
    if (user && profile && messages.length === 0 && !authLoading) {
      // Small delay to ensure voices are loaded and browser allows audio
      const timer = setTimeout(() => {
        speak(WELCOME_MESSAGES[0], selectedVoice);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, profile, authLoading]);

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
      const reply = await askAI(content);
      fullContent = reply;
      setCurrentStreamedText(fullContent);
    } catch (err) {
      console.error(err);
      fullContent = "I'm sorry, I encountered an error. Could you try rephrasing that?";
    } finally {
      setIsStreaming(false);
      const finalContent = fullContent || "I'm here to help! Could you please try rephrasing that?";
      const tutorResponse: Message = { role: "model", content: finalContent };
      const finalMessages = [...updatedMessages, tutorResponse];
      setMessages(finalMessages);
      setCurrentStreamedText("");
      
      // Automatically speak the tutor's response
      speakLastMessage(finalContent);

      // Save to history
      if (user) {
        saveConversation(finalMessages);
      }

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
      setCurrentConversationId(null);
    }
  };

  const saveConversation = async (msgs: Message[]) => {
    if (!user) return;
    
    const title = msgs[0]?.content.substring(0, 40) || "Tutoring Session";
    
    try {
      if (currentConversationId) {
        await updateDoc(doc(db, 'conversations', currentConversationId), {
          messages: msgs,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'conversations'), {
          userId: user.uid,
          title,
          messages: msgs,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setCurrentConversationId(docRef.id);
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  const loadConversation = (convo: any) => {
    stopSpeaking();
    setMessages(convo.messages);
    setCurrentConversationId(convo.id);
    setIsHistoryOpen(false);
  };

  const openGlossary = (term?: string) => {
    setInitialGlossaryTerm(term || null);
    setIsGlossaryOpen(true);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Preparing Lesson...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-4">
        {authView === 'login' ? (
          <Login onSwitchToSignUp={() => setAuthView('signup')} />
        ) : (
          <SignUp onSwitchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  const effectiveHasPaid = trial.hasPaid || profile?.isPremium;

  // Banned UI
  if (profile?.isBanned) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Account Banned</h2>
            <p className="text-slate-600">
              Your account has been automatically banned because we detected multiple accounts associated with this device. 
              <br/><br/>
              <span className="font-bold text-red-600 italic">"Only one account is allowed per phone/computer."</span>
            </p>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  // Mandatory Payment Wall if Trial Expired
  if (trial.isExpired && !effectiveHasPaid) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-indigo-600 p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white rounded-[40px] p-8 md:p-12 text-center space-y-8 shadow-2xl relative z-10"
        >
          <div className="space-y-4">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto rotate-12">
              <Lock size={40} />
            </div>
            <div className="space-y-2">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 px-4 py-1.5 bg-indigo-50 rounded-full">Trial Expired</span>
               <h2 className="text-3xl font-serif text-slate-900 italic">Your journey continues with full access</h2>
               <p className="text-slate-500 font-medium">
                 Your 3-day free trial has come to an end. To continue using SocraticAI and unlock all 50+ math topics, we require a one-time lifetime payment.
               </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase">One-time payment</p>
              <p className="text-3xl font-bold text-slate-800">$100<span className="text-sm font-normal text-slate-400 ml-1">USD</span></p>
            </div>
            <div className="text-right">
              <CheckCircle2 size={32} className="text-green-500 ml-auto" />
              <p className="text-[10px] font-bold text-green-600 uppercase mt-1">Lifetime Access</p>
            </div>
          </div>

          <div className="space-y-4">
            <PaymentButton />
            <button 
              onClick={() => logout()}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              Logout and return later
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 md:border-x md:border-slate-200 md:max-w-7xl md:mx-auto md:shadow-2xl">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTopicsOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Browse Topics"
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Chat History"
          >
            <Clock size={20} />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mr-1">
            <GraduationCap size={20} className="md:hidden" />
            <GraduationCap size={24} className="hidden md:block" />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-slate-800 shrink-0">Socratic<span className="text-indigo-600">AI</span></span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden lg:flex items-center gap-1 md:gap-2 mr-2" role="radiogroup" aria-label="Select tutor voice character">
            <button 
              type="button"
              onClick={() => changeVoice("male")}
              aria-checked={selectedVoice === "male"}
              role="radio"
              className={cn(
                "group relative flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-50",
                selectedVoice === "male" ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"
              )}
              aria-label="Paul, Male Socratic Tutor"
            >
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl md:text-2xl border-2 shadow-sm overflow-hidden group-hover:scale-110 transition-transform",
                selectedVoice === "male" ? "border-indigo-400" : "border-white"
              )}>
                👨‍🏫
              </div>
              <span className={cn(
                "text-[8px] md:text-[10px] font-bold uppercase tracking-tighter transition-colors",
                selectedVoice === "male" ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
              )}>Male</span>
            </button>
            <button 
              type="button"
              onClick={() => changeVoice("female")}
              aria-checked={selectedVoice === "female"}
              role="radio"
              className={cn(
                "group relative flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-50",
                selectedVoice === "female" ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"
              )}
              aria-label="Sarah, Female Socratic Tutor"
            >
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 bg-rose-100 rounded-full flex items-center justify-center text-xl md:text-2xl border-2 shadow-sm overflow-hidden group-hover:scale-110 transition-transform",
                selectedVoice === "female" ? "border-indigo-400" : "border-white"
              )}>
                👩‍🏫
              </div>
              <span className={cn(
                "text-[8px] md:text-[10px] font-bold uppercase tracking-tighter transition-colors",
                selectedVoice === "female" ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
              )}>Female</span>
            </button>
          </div>

          <div className="w-px h-8 bg-slate-100 hidden md:block mx-2"></div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {profile?.displayName?.[0] || user.email?.[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.isPremium ? 'Premium' : 'Student'}</p>
                <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{profile?.displayName || user.email?.split('@')[0]}</p>
              </div>
            </button>
          </div>

          <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

          <button
            onClick={() => setIsSolverOpen(true)}
            className="flex items-center gap-2 p-2 md:px-4 md:py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shrink-0 shadow-lg shadow-indigo-100"
            title="Step-by-Step Solver"
          >
            <BrainCircuit size={14} />
            <span className="hidden md:inline">Step Solver</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 p-2 md:px-4 md:py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-all shrink-0"
            title="Start New Lesson"
          >
            <RefreshCw size={14} />
            <span className="hidden md:inline">New Lesson</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 scroll-smooth bg-slate-50"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Trial Status Banner */}
          {!effectiveHasPaid && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3 rounded-xl flex items-center justify-between shadow-sm border",
                trial.isExpired 
                  ? "bg-red-50 border-red-100 text-red-700"
                  : "bg-indigo-50 border-indigo-100 text-indigo-700"
              )}
            >
              <div className="flex items-center gap-3">
                {trial.isExpired ? <Lock size={18} /> : <Clock size={18} />}
                <div className="text-xs">
                  {trial.isExpired ? (
                    <p className="font-bold uppercase tracking-tight">Your free trial has expired</p>
                  ) : (
                    <p className="font-bold uppercase tracking-tight">{trial.daysRemaining} {trial.daysRemaining === 1 ? 'day' : 'days'} remaining in your free trial</p>
                  )}
                  <p className="opacity-70 text-[10px]">Get lifetime access to continue exploring math Socrates-style.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTopicsOpen(true)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                  trial.isExpired 
                    ? "bg-red-600 text-white shadow-md shadow-red-100" 
                    : "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                )}
              >
                Unlock Lifetime Access
              </button>
            </motion.div>
          )}

          {/* Welcome Interface */}
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center space-y-8"
            >
              <div className="max-w-2xl mx-auto space-y-4">
                 <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-200 relative mb-4">
                  <div className="text-4xl">
                     {selectedVoice === "female" ? "👩‍🏫" : "👨‍🏫"}
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px]">Your Socratic Math Tutor</p>
                  <h2 className="text-4xl font-serif text-slate-900 italic">
                    How can I help you today?
                  </h2>
                </div>
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

              {/* Category Filter - REMOVED from welcome view */}

              {/* Topics Grid - REMOVED from welcome view */}
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
      <footer className="bg-white border-t border-slate-100 p-2 md:p-4 shrink-0 shadow-inner z-10 relative">
        {trial.isExpired && !effectiveHasPaid && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-red-100 text-red-600 rounded-full">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Your trial is complete</p>
                <p className="text-xs text-slate-500">Please purchase lifetime access to send more messages.</p>
              </div>
              <PaymentButton />
            </div>
          </div>
        )}
        <MathInput onSendMessage={handleSendMessage} disabled={isStreaming || (trial.isExpired && !effectiveHasPaid)} />
        <div className="text-center mt-1 pb-safe">
          <p className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            Socratic Intelligence • High Performance Reasoning
          </p>
        </div>
      </footer>
      
      {/* Action Footer */}
      <div className="h-10 md:h-12 bg-slate-100 border-t border-slate-200 px-4 md:px-8 flex items-center justify-between text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 md:gap-8 whitespace-nowrap">
          <button 
            onClick={() => openGlossary()}
            className="hover:text-indigo-600 transition-colors"
          >
            Glossary
          </button>
          <button className="hover:text-indigo-600 transition-colors">Formulas</button>
          <button className="hover:text-indigo-600 transition-colors">Help</button>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="hidden md:inline">AI System Ready</span>
          <span className="md:hidden">Ready</span>
        </div>
      </div>

      <TopicsOverlay 
        isOpen={isTopicsOpen} 
        onClose={() => setIsTopicsOpen(false)} 
        onSelectTopic={handleSendMessage}
      />

      <GlossaryOverlay 
        isOpen={isGlossaryOpen} 
        onClose={() => setIsGlossaryOpen(false)} 
        initialTerm={initialGlossaryTerm}
      />

      <SocraticSolverOverlay 
        isOpen={isSolverOpen}
        onClose={() => setIsSolverOpen(false)}
      />

      <ProfileOverlay
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <HistoryOverlay
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectConversation={loadConversation}
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
