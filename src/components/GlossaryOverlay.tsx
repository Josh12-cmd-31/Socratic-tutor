import { motion, AnimatePresence } from "motion/react";
import { X, Search, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import { MATHEMATICAL_GLOSSARY, type GlossaryEntry } from "@/lib/glossary";
import { cn } from "@/lib/utils";

interface GlossaryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialTerm?: string | null;
}

export function GlossaryOverlay({ isOpen, onClose, initialTerm }: GlossaryOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryEntry | null>(null);

  const filteredGlossary = useMemo(() => {
    return MATHEMATICAL_GLOSSARY.filter(item => 
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle initial term if provided (e.g. from clicking a link)
  useMemo(() => {
    if (initialTerm) {
      const found = MATHEMATICAL_GLOSSARY.find(g => g.term.toLowerCase() === initialTerm.toLowerCase());
      if (found) setSelectedTerm(found);
    }
  }, [initialTerm]);

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
            className="fixed inset-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-24 md:bottom-24 md:w-[600px] bg-white rounded-3xl shadow-2xl z-[101] flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Mathematical Glossary</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Terms & Concepts</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Search for a term..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* List */}
              <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-2 space-y-1">
                {filteredGlossary.map((item) => (
                  <button
                    key={item.term}
                    onClick={() => setSelectedTerm(item)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl transition-all group",
                      selectedTerm?.term === item.term 
                        ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                        : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="font-bold text-sm tracking-tight">{item.term}</div>
                    <div className="text-[10px] font-bold opacity-50 uppercase">{item.category}</div>
                  </button>
                ))}
              </div>

              {/* Detail */}
              <div className="w-1/2 overflow-y-auto p-6 bg-slate-50/30">
                {selectedTerm ? (
                  <motion.div
                    key={selectedTerm.term}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                        {selectedTerm.category}
                      </span>
                      <h3 className="text-3xl font-serif italic text-slate-900 mt-4">{selectedTerm.term}</h3>
                    </div>
                    
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {selectedTerm.definition}
                      </p>
                    </div>

                    <div className="pt-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Related concepts</p>
                       <div className="flex flex-wrap gap-2">
                        {MATHEMATICAL_GLOSSARY.filter(g => g.category === selectedTerm.category && g.term !== selectedTerm.term).slice(0, 3).map(related => (
                          <button 
                            key={related.term}
                            onClick={() => setSelectedTerm(related)}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            {related.term}
                          </button>
                        ))}
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                    <BookOpen size={48} className="opacity-20" />
                    <p className="font-bold text-xs uppercase tracking-widest">Select a term to view definition</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
