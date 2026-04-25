import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Award, 
  Smartphone,
  Save,
  LogOut,
  CreditCard,
  Volume2
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '@/lib/utils';
import { speak } from '../../lib/speech';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const { profile, user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !newDisplayName.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName.trim()
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSpeechSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [key]: value
      });
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] overflow-y-auto"
          >
            <div className="p-6 md:p-8 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif text-slate-900 italic">Student Profile</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="text-slate-500" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white text-4xl shadow-xl shadow-indigo-100">
                  {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                
                <div className="space-y-1 w-full">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 w-full font-bold focus:outline-none focus:border-indigo-400"
                        placeholder="Your Name"
                        autoFocus
                      />
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Save size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="group flex items-center justify-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
                      <h3 className="text-xl font-bold text-slate-800">
                        {profile?.displayName || 'Set Name'}
                      </h3>
                      <Award size={18} className="text-indigo-600" />
                    </div>
                  )}
                  <p className="text-slate-500 text-sm">{user?.email}</p>
                </div>

                <div className="flex gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    profile?.isPremium ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-600"
                  )}>
                    {profile?.isPremium ? 'PRO Member' : 'Free Trial'}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-6">
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Account Information</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                        <p className="text-sm font-medium text-slate-800">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Member Since</p>
                        <p className="text-sm font-medium text-slate-800">{formatDate(profile?.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Smartphone size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Device</p>
                        <p className="text-sm font-medium text-slate-800 font-mono truncate">{profile?.deviceId || 'Not detected'}</p>
                      </div>
                      <ShieldCheck size={18} className="text-green-500" />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Subscription</h4>
                  <div className="p-6 bg-indigo-600 rounded-3xl text-white space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Current Plan</p>
                        <p className="text-xl font-serif italic">{profile?.isPremium ? 'Lifetime Socratic Access' : '3-Day Free Trial'}</p>
                      </div>
                      <CreditCard size={24} className="text-indigo-300" />
                    </div>
                    {!profile?.isPremium && (
                      <p className="text-sm text-indigo-100 font-medium">
                        Your trial allows you to explore all features for 3 days. Upgrade for unlimited lifetime usage.
                      </p>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Voice & Speech</h4>
                  <div className="space-y-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                    {/* Gender Selection */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tutor Voice</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateSpeechSetting('voiceGender', 'female')}
                          className={cn(
                            "flex-1 py-3 rounded-2xl font-bold transition-all border-2",
                            profile?.voiceGender === 'female' 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                              : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                          )}
                        >
                          👩‍🏫 Female
                        </button>
                        <button 
                          onClick={() => updateSpeechSetting('voiceGender', 'male')}
                          className={cn(
                            "flex-1 py-3 rounded-2xl font-bold transition-all border-2",
                            profile?.voiceGender === 'male' 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                              : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                          )}
                        >
                          👨‍🏫 Male
                        </button>
                      </div>
                    </div>

                    {/* Rate Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Speech Rate</p>
                        <span className="text-xs font-bold text-indigo-600">{profile?.speechRate || 1}x</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={profile?.speechRate || 1}
                        onChange={(e) => updateSpeechSetting('speechRate', parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    {/* Pitch Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Voice Pitch</p>
                        <span className="text-xs font-bold text-indigo-600">{profile?.speechPitch || 1}</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={profile?.speechPitch || 1}
                        onChange={(e) => updateSpeechSetting('speechPitch', parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <button 
                      onClick={() => speak("Hello! This is how I'll sound during our lessons.", profile?.voiceGender || 'female', profile?.speechRate || 1, profile?.speechPitch || 1)}
                      className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Volume2 size={18} />
                      Test Voice
                    </button>
                  </div>
                </section>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
