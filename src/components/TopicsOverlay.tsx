import { motion, AnimatePresence } from "motion/react";
import { X, LayoutGrid, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { MATH_TOPICS, type MathTopic } from "@/constants";
import { cn } from "@/lib/utils";
import { PaymentButton } from "./PaymentButton";

interface TopicsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

export function TopicsOverlay({ isOpen, onClose, onSelectTopic }: TopicsOverlayProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const categories = useMemo(() => ["All", ...Array.from(new Set(MATH_TOPICS.map(t => t.category)))], []);
  
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "All") return MATH_TOPICS;
    return MATH_TOPICS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 md:inset-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-20 md:bottom-20 md:w-[800px] bg-white md:rounded-3xl shadow-2xl z-[101] flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <LayoutGrid size={18} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">Learning Topics</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">Explore Mathematical Fields</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="p-4 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                      selectedCategory === cat 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredTopics.map((tag) => (
                  <button 
                    key={tag.text}
                    onClick={() => {
                      onSelectTopic(`Help me get started with a ${tag.text} problem.`);
                      onClose();
                    }}
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
                  </button>
                ))}
              </div>

              {/* Premium Promo */}
              <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Unlock Full Potential</p>
                  <PaymentButton />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
