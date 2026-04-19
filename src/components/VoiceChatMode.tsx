import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, X, Volume2, MessageSquare, GraduationCap } from "lucide-react";
import { speak, stopSpeaking } from "../lib/speech";
import { chatStream, type Message } from "../lib/gemini";
import { cn } from "@/lib/utils";

interface VoiceChatModeProps {
  gender: "male" | "female";
  onClose: () => void;
  history: Message[];
  onNewUserMessage: (content: string) => void;
  onNewAIResponse: (content: string) => void;
}

export function VoiceChatMode({ gender, onClose, history, onNewUserMessage, onNewAIResponse }: VoiceChatModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const recognitionRef = useRef<any>(null);

  const characterName = gender === "male" ? "Paul" : "Sarah";
  const characterEmoji = gender === "male" ? "👨‍🏫" : "👩‍🏫";

  useEffect(() => {
    // Initial Greeting
    const intro = `I'm ready to listen, it's one-on-one time. What's on your mind?`;
    speak(intro, gender);

    // Setup Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);

        if (result.isFinal) {
          handleVoiceInput(text);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      stopSpeaking();
      setTranscript("");
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    // Sync user message to main history
    onNewUserMessage(text);
    
    setIsThinking(true);
    setCurrentResponse("");
    
    let localResponse = "";
    const contextMessages = [...history, { role: "user", content: text } as Message];
    
    try {
      await chatStream(contextMessages, (chunk) => {
        localResponse += chunk;
        setCurrentResponse(localResponse);
      });
    } catch (err) {
      console.error(err);
      localResponse = "I'm sorry, I'm having trouble connecting right now. Let's try that again.";
      setCurrentResponse(localResponse);
    } finally {
      setIsThinking(false);
      // If the AI somehow returned empty, set a fallback so it speaks something
      if (!localResponse) {
        const fallback = "I'm here to help, but I didn't quite catch that. Could you try rephrasing your math question?";
        setCurrentResponse(fallback);
      }
    }
  };

  useEffect(() => {
    if (!isThinking && currentResponse) {
      const cleanText = currentResponse.replace(/\[\[(.*?)\]\]/g, (_, p1) => p1).replace(/[#*`_]/g, '');
      speak(cleanText, gender);
      onNewAIResponse(currentResponse);
      setTranscript("");
    }
  }, [isThinking, currentResponse]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
    >
      {/* Immersive Background (Atmospheric Grid/Glow) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_50%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff22 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <div className="absolute top-0 w-full p-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">SocraticTutor<span className="text-indigo-400">AI</span></span>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Focus: The Character */}
      <div className="flex flex-col items-center gap-8 z-10 max-w-2xl w-full px-6 text-center">
        <motion.div 
          animate={{ 
            scale: isListening ? [1, 1.05, 1] : 1,
            rotate: isListening ? [0, -1, 1, 0] : 0
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={cn(
            "w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center text-6xl md:text-8xl shadow-2xl relative",
            gender === "male" ? "bg-blue-600/20 border-4 border-blue-500/30" : "bg-rose-600/20 border-4 border-rose-500/30"
          )}
        >
          {characterEmoji}
          {isThinking && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 md:w-56 md:h-56 border-2 border-dashed border-indigo-400/50 rounded-full"
              />
            </div>
          )}
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Speak with {characterName}</h2>
          <p className="text-indigo-300 font-medium tracking-wide uppercase text-xs">One-on-One Focused Session</p>
        </div>

        {/* Dynamic Text Area */}
        <div className="h-40 flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div 
                key="listening"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xl font-medium text-slate-300 italic"
              >
                {transcript || "Listening..."}
              </motion.div>
            ) : isThinking ? (
              <motion.div 
                key="thinking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-indigo-400"
              >
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                </div>
                <span className="font-mono text-sm uppercase tracking-widest">Processing...</span>
              </motion.div>
            ) : currentResponse ? (
              <motion.div 
                key="response"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-white max-w-lg"
              >
                {currentResponse.length > 150 ? currentResponse.substring(0, 150) + "..." : currentResponse}
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-500 font-medium"
              >
                Tap the mic and start talking
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 z-10">
          <button 
            onClick={toggleListening}
            disabled={isThinking}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              isListening 
                ? "bg-red-500 shadow-lg shadow-red-500/50 scale-110" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30"
            )}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          
          <button 
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all font-semibold text-sm"
          >
            <MessageSquare size={18} />
            Return to Chat
          </button>
        </div>

        {/* Bottom Status */}
        <div className="absolute bottom-12 flex items-center gap-2 text-slate-500 text-xs font-mono uppercase tracking-[0.2em]">
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isListening ? "bg-red-500" : "bg-green-500")} />
          {isListening ? "Audio Signal Active" : "Line Ready"}
        </div>
      </div>
    </motion.div>
  );
}
