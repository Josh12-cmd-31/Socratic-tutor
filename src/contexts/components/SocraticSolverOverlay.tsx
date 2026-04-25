import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  BookOpen
} from 'lucide-react';
import { askAI } from '../../lib/externalAi';
import { chatStream, type Message } from '../../lib/gemini';
import { MathInput } from './MathInput';
import { ChatBubble } from './ChatBubble';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface SocraticSolverOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOLVER_SYSTEM_PROMPT = `You are a dedicated Socratic Math Problem Solver. Your task is to lead the student through a specific math problem step by step.

STRATEGY:
1. Don't solve the whole thing. Identify Step 1.
2. Explain the goal of Step 1.
3. Ask the student a specific question to help them complete Step 1 themselves.
4. If they succeed, move to Step 2.
5. If they fail or ask for help, give a small hint.

USE THE FOLLOWING FORMAT FOR EVERY RESPONSE:
- CONCEPT: Briefly state the math concept (e.g., [[Product Rule]]).
- STEP {n}: Describe the current step's logic.
- QUESTION: Ask the interactive question.

NEVER give the final answer unless the student has successfully performed all previous steps.
Limit your responses to 100 words max to keep it focused.`;

export function SocraticSolverOverlay({ isOpen, onClose }: SocraticSolverOverlayProps) {
  const [problem, setProblem] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamedText, setCurrentStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, currentStreamedText]);

  const handleStartSolving = async () => {
    if (!problem.trim()) return;
    
    setIsSolving(true);
    setMessages([]);
    
    const initialPrompt = `I need help solving this problem step-by-step: ${problem}`;
    handleSendMessage(initialPrompt);
  };

  const handleSendMessage = async (content: string) => {
    const newUserMessage: Message = { role: "user", content };
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
      fullContent = "I'm sorry, I encountered an issue. Let's try that step again.";
    } finally {
      setIsStreaming(false);
      const finalContent = fullContent || "Let's regroup. What do you think the first step is?";
      setMessages((prev) => [...prev, { role: "model", content: finalContent }]);
      setCurrentStreamedText("");

      if (finalContent.toLowerCase().includes("correct") || finalContent.toLowerCase().includes("well done")) {
         confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#818cf8', '#ffffff']
        });
      }
    }
  };

  const handleReset = () => {
    setIsSolving(false);
    setProblem('');
    setMessages([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-4xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Calculator size={18} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  {isSolving ? 'Solving Mode' : 'Problem Solver'}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!isSolving ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-8">
                  <div className="space-y-3">
                    <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
                      <Sparkles size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Master Any Problem</h3>
                    <p className="text-slate-500 font-medium">
                      Enter your math problem here. Instead of just giving the answer, I'll guide you through each logical step so you truly understand it.
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    <textarea 
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="e.g., Solve for x: 2x + 5 = 15 or Find the derivative of f(x) = x^2 * sin(x)..."
                      className="w-full min-h-[160px] p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-500/5 transition-all text-lg font-medium text-slate-700 resize-none"
                    />
                    
                    <button
                      onClick={handleStartSolving}
                      disabled={!problem.trim()}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-2 group"
                    >
                      Start Step-by-Step Solution
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-6 w-full pt-8">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">1</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">2</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">3</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Solver Progress Header */}
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                    <button 
                      onClick={handleReset}
                      className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                      <ArrowLeft size={14} /> New Problem
                    </button>
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-indigo-600" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step-by-Step Journey</span>
                    </div>
                    <div className="flex gap-1">
                      {messages.filter(m => m.role === 'model').map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      ))}
                      {isStreaming && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>}
                    </div>
                  </div>

                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {messages.map((msg, idx) => (
                        <ChatBubble 
                          key={idx} 
                          message={msg} 
                          onTermClick={() => {}}
                        />
                      ))}
                      {isStreaming && (
                        <ChatBubble 
                          message={{ role: "model", content: currentStreamedText || "Mapping solution..." }} 
                          isStreaming={true}
                          onTermClick={() => {}}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                    <MathInput 
                      onSendMessage={handleSendMessage} 
                      disabled={isStreaming} 
                      placeholder="Type your answer or ask for a hint..."
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
