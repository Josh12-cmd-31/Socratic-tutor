import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  History, 
  MessageSquare, 
  Trash2, 
  ChevronRight, 
  Calendar,
  Clock,
  Search,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { type Message } from '../lib/gemini';
import { cn } from '@/lib/utils';

interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: any;
  updatedAt: any;
}

interface HistoryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (convo: SavedConversation) => void;
}

export function HistoryOverlay({ isOpen, onClose, onSelectConversation }: HistoryOverlayProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    const path = 'conversations';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedConversation[];
      setConversations(docs);
    } catch (err: any) {
      if (err.message?.includes('permission')) {
        handleFirestoreError(err, 'list', path);
      }
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    const path = `conversations/${id}`;
    try {
      await deleteDoc(doc(db, 'conversations', id));
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      if (err.message?.includes('permission')) {
        handleFirestoreError(err, 'delete', path);
      }
      console.error("Delete failed:", err);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <History size={24} />
                  </div>
                  <h2 className="text-xl font-serif text-slate-900 italic">Chat History</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="text-slate-500" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search past sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading your history...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">No sessions found</h3>
                    <p className="text-sm text-slate-500">Your saved Socratic sessions will appear here.</p>
                  </div>
                </div>
              ) : (
                filteredConversations.map((convo) => (
                  <motion.button
                    layout
                    key={convo.id}
                    onClick={() => onSelectConversation(convo)}
                    className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => handleDelete(e, convo.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-2 pr-8">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        {formatDate(convo.createdAt)}
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <Clock size={12} />
                        {convo.messages.length} messages
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {convo.title || "Untitled Session"}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 italic font-serif">
                        {convo.messages[convo.messages.length - 1]?.content.substring(0, 80)}...
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">
                 Your Socratic Study Companion
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
