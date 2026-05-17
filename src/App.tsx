/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, getDailyQuote, getRandomQuote, getCategories, creatorInfo, quotes, Habit, addictionCategories, AddictionType } from './lib/quotes';
import { Bell, BellOff, RefreshCw, Settings, X, Check, Copy, Share2, Mic, MicOff, Info, ExternalLink, Heart, Search, Shield, Zap, Sparkles, Plus, Trash2, LayoutGrid, Clock, Flame, Wine, Coins, Smartphone, MonitorPause, ChevronRight, Calendar, Activity } from 'lucide-react';

export default function App() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(getDailyQuote());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'about' | 'tracker'>('preferences');
  const [viewMode, setViewMode] = useState<'canvas' | 'zen' | 'tracker'>('canvas');
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const [habits, setHabits] = useState<Habit[]>(() => {
    return JSON.parse(localStorage.getItem('liberation_habits') || '[]');
  });

  const [newHabitCategory, setNewHabitCategory] = useState<AddictionType>('custom');
  const [newHabitGoal, setNewHabitGoal] = useState("");
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  const [favorites, setFavorites] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('reminderTime') || '09:00';
  });
  const [notifFrequency, setNotifFrequency] = useState(() => {
    return localStorage.getItem('notifFrequency') || 'daily';
  });
  const [customNotifBody, setCustomNotifBody] = useState(() => {
    return localStorage.getItem('customNotifBody') || 'Your daily spark of liberation awaits.';
  });

  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const addHabit = async (name: string, type: 'sobriety' | 'habit') => {
    setIsGeneratingNarrative(true);
    let narrative = "";
    try {
      const response = await fetch('/api/gemini/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitName: name, category: newHabitCategory, goal: newHabitGoal })
      });
      const data = await response.json();
      narrative = data.narrative || "";
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsGeneratingNarrative(false);
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      startDate: new Date().toISOString(),
      type,
      category: newHabitCategory,
      goal: newHabitGoal,
      narrative: narrative
    };
    const nextHabits = [...habits, newHabit];
    setHabits(nextHabits);
    localStorage.setItem('liberation_habits', JSON.stringify(nextHabits));
    setIsSettingsOpen(false);
    setViewMode('tracker');
    setNewHabitGoal("");
  };

  const deleteHabit = (id: string) => {
    const nextHabits = habits.filter(h => h.id !== id);
    setHabits(nextHabits);
    localStorage.setItem('liberation_habits', JSON.stringify(nextHabits));
  };

  const calculateDays = (startDate: string) => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const resetHabit = (id: string) => {
    if (confirm("Resetting will start your streak over. Are you sure?")) {
      const nextHabits = habits.map(h => 
        h.id === id ? { ...h, startDate: new Date().toISOString() } : h
      );
      setHabits(nextHabits);
      localStorage.setItem('liberation_habits', JSON.stringify(nextHabits));
    }
  };

  const isFavorite = favorites.includes(currentQuote.id);

  const renderIcon = (category: AddictionType) => {
    switch (category) {
      case 'drugs': return <Shield className="w-6 h-6" />;
      case 'alcohol': return <Wine className="w-6 h-6" />;
      case 'gambling': return <Coins className="w-6 h-6" />;
      case 'social-media': return <Smartphone className="w-6 h-6" />;
      case 'pornography': return <MonitorPause className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: AddictionType) => {
    const found = addictionCategories.find(c => c.id === category);
    switch (found?.color) {
      case 'emerald': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'blue': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'orange': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'purple': return 'text-purple-500 bg-purple-50 border-purple-100';
      case 'rose': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-brand-text bg-gray-50 border-gray-100';
    }
  };

  const refreshQuote = useCallback((category?: string) => {
    setIsQuoteVisible(false);
    setTimeout(() => {
      setCurrentQuote(getRandomQuote(category || selectedCategory));
      setIsQuoteVisible(true);
    }, 500);
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    refreshQuote(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = quotes.filter(q => 
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (results.length > 0) {
      const randomResult = results[Math.floor(Math.random() * results.length)];
      setIsQuoteVisible(false);
      setTimeout(() => {
        setCurrentQuote(randomResult);
        setIsQuoteVisible(true);
        setShowSearch(false);
      }, 500);
    } else {
      alert("No quotes found matching your focus.");
    }
  };

  const copyToClipboard = async () => {
    const text = `"${currentQuote.text}" — ${currentQuote.author} #FreeMeApp`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'FreeMe Quote',
      text: `"${currentQuote.text}" — ${currentQuote.author}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyToClipboard();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!("Notification" in window)) {
        alert("This browser does not support notifications");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
      } else {
        alert('Please enable notification permissions in your browser.');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const timeMatch = transcript.match(/(\d{1,2})[: ]*(\d{2})/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        
        if (transcript.toLowerCase().includes('p.m.') || transcript.toLowerCase().includes('pm')) {
          if (hours < 12) hours += 12;
        } else if ((transcript.toLowerCase().includes('a.m.') || transcript.toLowerCase().includes('am')) && hours === 12) {
          hours = 0;
        }

        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        setReminderTime(formattedTime);
        localStorage.setItem('reminderTime', formattedTime);
      } else {
        alert("Could not recognize time. Try saying something like 'Nine thirty'");
      }
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    localStorage.setItem('reminderTime', newTime);
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden selection:bg-brand-text/5">
      {/* Dynamic Blob Background */}
      <div className="blob-background">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="blob-1" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], rotate: [0, -90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="blob-2" 
        />
      </div>

      {/* Top Navigation Rail */}
      <header className="relative z-10 flex justify-between items-start p-8 md:p-12">
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-2"
          >
             <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 border border-brand-text/5">
                <img src={creatorInfo.logo} alt="FreeMe Logo" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-4xl font-serif italic tracking-tighter text-brand-text">FreeMe</h1>
          </motion.div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 ml-[64px]">Daily Liberation</span>
        </div>

        <div className="flex items-center gap-6">
          {viewMode !== 'zen' && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-1">Liberation Status</span>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-medium opacity-80 uppercase tracking-widest text-[9px]">
                  {habits.length > 0 ? `${habits.length} Chains Broken` : "Vault Synchronized"}
                </span>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setViewMode(prev => prev === 'zen' ? 'canvas' : 'zen')}
            className={`w-12 h-12 btn-outline flex items-center justify-center border transition-all duration-500 ${viewMode === 'zen' ? 'bg-brand-text text-white border-brand-text shadow-xl' : 'border-brand-text/10'}`}
            title="Zen Focus Mode"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {viewMode !== 'zen' && (
            <>
              <button 
                onClick={() => setViewMode(prev => prev === 'tracker' ? 'canvas' : 'tracker')}
                className={`w-12 h-12 btn-outline flex items-center justify-center border transition-all duration-500 ${viewMode === 'tracker' ? 'bg-brand-text text-white border-brand-text shadow-xl' : 'border-brand-text/10'}`}
                title="Tracker Dashboard"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSearch(true)}
                className="w-12 h-12 btn-outline flex items-center justify-center border border-brand-text/10"
                title="Search for Wisdom"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setActiveTab('preferences');
                  setIsSettingsOpen(true);
                }}
                className="w-12 h-12 btn-outline flex items-center justify-center border border-brand-text/10"
                title="Sanctuary Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Category Chips Container */}
      <AnimatePresence>
        {viewMode === 'canvas' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-8 md:px-12 mb-4"
          >
            <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar">
              {getCategories().map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 border ${
                    selectedCategory === cat 
                    ? "bg-brand-text text-white border-brand-text shadow-lg" 
                    : "bg-white/50 text-brand-text/40 border-brand-text/5 hover:border-brand-text/20 hover:text-brand-text"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth">
        {viewMode === 'tracker' ? (
          <motion.main 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 px-8 md:px-24 py-12"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-5xl font-serif italic mb-2">Freedom Tracker</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Monitoring Your Chains Broken</p>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('tracker');
                    setIsSettingsOpen(true);
                  }}
                  className="px-8 py-4 bg-brand-text text-white rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-bold">New Chain</span>
                </button>
              </div>

              {habits.length === 0 ? (
                <div className="py-24 border-2 border-dashed border-brand-text/10 rounded-[3rem] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-brand-text/5 flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-2xl font-serif italic mb-2">No chains defined yet.</h3>
                  <p className="text-xs text-brand-text/40 font-serif italic max-w-xs leading-relaxed">
                    Start tracking your liberation from habits like drugs, alcohol, or anything holding you back.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {habits.map(habit => {
                    const days = calculateDays(habit.startDate);
                    const progress = Math.min((days / 90) * 100, 100); // 90 days to "rewire"
                    return (
                      <motion.div 
                        key={habit.id}
                        layoutId={habit.id}
                        className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-brand-text/5 shadow-lg group hover:shadow-2xl transition-all flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-4 rounded-2xl ${getCategoryColor(habit.category)}`}>
                            {renderIcon(habit.category)}
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => resetHabit(habit.id)} className="p-3 rounded-full hover:bg-orange-50 text-orange-400 opacity-0 group-hover:opacity-100 transition-all" title="Reset Counter">
                                <RefreshCw className="w-4 h-4" />
                             </button>
                             <button onClick={() => deleteHabit(habit.id)} className="p-3 rounded-full hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Delete Tracker">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30 mb-1">{habit.category} • {habit.type}</h4>
                          <h3 className="text-3xl font-serif italic leading-none truncate">{habit.name}</h3>
                        </div>

                        {habit.narrative && (
                          <div className="mb-6 p-4 bg-brand-text/[0.02] border-l-2 border-brand-text/10">
                            <p className="text-xs font-serif italic text-brand-text/50 leading-relaxed">
                              {habit.narrative}
                            </p>
                          </div>
                        )}

                        <div className="flex-1 flex flex-col justify-end">
                          <div className="flex items-end gap-3 mb-8">
                            <span className="text-7xl font-serif leading-none text-brand-text">{days}</span>
                            <div className="pb-1">
                               <p className="text-xs uppercase tracking-widest font-bold opacity-60">Days</p>
                               <p className="text-[10px] uppercase tracking-widest font-bold opacity-30">Libertus</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold opacity-30">
                               <span>90 Day Milestone</span>
                               <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-brand-text/5 rounded-full overflow-hidden">
                               <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-brand-text"
                               />
                            </div>
                          </div>

                          <div className="mt-8 pt-8 border-t border-brand-text/5 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 opacity-20" />
                                <span className="text-[9px] uppercase tracking-widest font-bold opacity-20">{new Date(habit.startDate).toLocaleDateString()}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-500 opacity-40" />
                                <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600/40">Active Streak</span>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.main>
        ) : (
          <main className={`relative z-10 flex flex-col justify-center px-8 md:px-24 transition-all duration-1000 ${viewMode === 'zen' ? 'h-full pt-0' : 'h-[60vh] pt-12'}`}>
            <AnimatePresence mode="wait">
              {isQuoteVisible && (
                <motion.div
                  key={currentQuote.id}
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-4xl relative"
                >
                  <div className={`absolute -left-12 -top-12 md:-left-20 md:-top-20 flex flex-col items-center gap-4 transition-opacity duration-1000 ${viewMode === 'zen' ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-[160px] md:text-[240px] font-serif leading-none opacity-5 text-brand-accent pointer-events-none select-none">“</span>
                    <motion.button 
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFavorite(currentQuote.id)}
                        className="relative z-20 group"
                    >
                        <Heart className={`w-8 h-8 transition-colors duration-500 ${isFavorite ? "fill-red-500 text-red-500" : "text-brand-text/10 group-hover:text-brand-text/30"}`} />
                    </motion.button>
                  </div>
                  
                  <h2 className={`font-serif leading-[1.15] mb-12 relative text-brand-text transition-all duration-1000 text-center md:text-left ${viewMode === 'zen' ? 'text-5xl md:text-8xl' : 'text-4xl md:text-7xl'}`}>
                    {currentQuote.text.split(' ').map((word, i) => (
                      <span key={i} className={i % 8 === 3 ? "italic font-light opacity-80" : ""}>{word} </span>
                    ))}
                  </h2>

                  <div className={`flex items-center justify-between gap-6 max-w-2xl transition-opacity duration-1000 ${viewMode === 'zen' ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-px bg-brand-text/20"></div>
                      <p className="text-xl md:text-2xl font-serif italic opacity-60">
                        {currentQuote.author}
                      </p>
                    </div>
                    {!viewMode === 'zen' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30 px-3 py-1 border border-brand-text/5 rounded-full">
                          {currentQuote.category}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {viewMode === 'zen' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full border-2 border-brand-text/10 flex items-center justify-center relative">
                   <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-brand-text rounded-full"
                   />
                   <Clock className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-20">Breathe in. Fade out.</p>
              </motion.div>
            )}
          </main>
        )}
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-brand-bg/95 backdrop-blur-xl"
          >
            <button onClick={() => setShowSearch(false)} className="absolute top-12 right-12 btn-outline w-12 h-12 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="w-full max-w-3xl flex flex-col items-center gap-8">
              <h2 className="text-4xl font-serif italic mb-4">What wisdom do you seek?</h2>
              <div className="w-full relative">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Focus on a keyword (e.g. Action, Love, Future)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-brand-text/10 p-4 text-4xl font-serif text-center focus:outline-none focus:border-brand-text outline-none transition-all"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
                  <Search className="w-8 h-8" />
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {["Inspiration", "Action", "Mindset", "Success", "Love"].map(tag => (
                  <button 
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-4 py-2 rounded-full border border-brand-text/5 text-[10px] uppercase tracking-widest hover:bg-brand-text hover:text-white transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <footer className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => refreshQuote()}
            className="flex items-center gap-3 px-8 py-5 btn-outline bg-white/50 backdrop-blur-sm group"
          >
            <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-700" />
            <span className="text-xs uppercase tracking-widest font-bold">New Prospect</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="p-5 btn-outline bg-white/50 backdrop-blur-sm group hover:bg-brand-text hover:text-white"
            title="Share Wisdom"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button 
            onClick={copyToClipboard}
            className="p-5 btn-outline bg-white/50 backdrop-blur-sm group hover:bg-brand-text hover:text-white"
            title="Copy Text"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col items-end">
          <div 
            onClick={() => {
              setActiveTab('about');
              setIsSettingsOpen(true);
            }}
            className="cursor-pointer group flex items-center gap-3 mb-2"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 group-hover:opacity-60 transition-opacity">Creator: {creatorInfo.name}</p>
            <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-text/10 grayscale group-hover:grayscale-0 transition-all">
              <img src={creatorInfo.photo} alt={creatorInfo.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <p className="text-[10px] opacity-20 italic font-serif">A sanctuary for the liberated mind • Est 2024</p>
        </div>
      </footer>

      {/* Vertical Decorative Rail Right */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-16 pointer-events-none hidden lg:flex">
        <div className="h-32 w-px bg-brand-text/10"></div>
        <span className="rotate-90 text-[10px] uppercase tracking-[0.5em] font-bold opacity-20 whitespace-nowrap">FREE YOUR SPIRIT</span>
        <div className="h-32 w-px bg-brand-text/10"></div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2d2926]/40 backdrop-blur-md"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-brand-bg p-8 md:p-12 w-full max-w-2xl border border-brand-text/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex gap-6">
                  <button 
                    onClick={() => setActiveTab('preferences')}
                    className={`pb-2 text-sm uppercase tracking-[0.2em] font-bold transition-all border-b-2 ${activeTab === 'preferences' ? 'border-brand-text opacity-100' : 'border-transparent opacity-30 hover:opacity-50'}`}
                  >
                    Preferences
                  </button>
                  <button 
                    onClick={() => setActiveTab('tracker')}
                    className={`pb-2 text-sm uppercase tracking-[0.2em] font-bold transition-all border-b-2 ${activeTab === 'tracker' ? 'border-brand-text opacity-100' : 'border-transparent opacity-30 hover:opacity-50'}`}
                  >
                    Tracker
                  </button>
                  <button 
                    onClick={() => setActiveTab('about')}
                    className={`pb-2 text-sm uppercase tracking-[0.2em] font-bold transition-all border-b-2 ${activeTab === 'about' ? 'border-brand-text opacity-100' : 'border-transparent opacity-30 hover:opacity-50'}`}
                  >
                    Creator info
                  </button>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-10 h-10 btn-outline flex items-center justify-center border border-brand-text/5 bg-white/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 min-h-[400px] flex flex-col justify-center">
                {activeTab === 'preferences' ? (
                  <div className="space-y-12">
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60 mb-2">Sanctuary Alerts</h3>
                          <p className="text-xs text-brand-text/40 leading-relaxed max-w-[200px] font-serif italic">
                            Receive gentle sparks of wisdom and reminders of your path.
                          </p>
                        </div>
                        <button 
                          onClick={toggleNotifications}
                          className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-500 font-medium tracking-wide ${
                            notificationsEnabled 
                            ? "bg-brand-text text-white border-brand-text shadow-xl" 
                            : "border-brand-text/10 text-brand-text/40 hover:border-brand-text/30"
                          }`}
                        >
                          {notificationsEnabled ? (
                            <><Bell className="w-4 h-4" /> ACTIVE</>
                          ) : (
                            <><BellOff className="w-4 h-4" /> SILENCED</>
                          )}
                        </button>
                      </div>
                    </section>

                    <section className={`transition-all duration-700 space-y-8 ${notificationsEnabled ? "opacity-100 translate-y-0" : "opacity-20 pointer-events-none translate-y-4"}`}>
                      <div>
                        <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60 mb-4">Frequency</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {['hourly', 'twice-daily', 'daily'].map(freq => (
                            <button 
                              key={freq}
                              onClick={() => {
                                setNotifFrequency(freq);
                                localStorage.setItem('notifFrequency', freq);
                              }}
                              className={`px-4 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${notifFrequency === freq ? 'bg-brand-text text-white border-brand-text shadow-md' : 'bg-white border-brand-text/5 opacity-50'}`}
                            >
                              {freq.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60">Primary Reminder</h3>
                        <button 
                          onClick={handleVoiceInput}
                          className={`p-3 rounded-full border border-brand-text/5 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-brand-text hover:text-white'}`}
                        >
                          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <input 
                        type="time" 
                        value={reminderTime}
                        onChange={handleTimeChange}
                        className="w-full bg-white border border-brand-text/5 rounded-2xl p-6 text-4xl font-serif text-center focus:outline-none focus:border-brand-text/20 transition-all cursor-pointer shadow-sm"
                      />

                      <div>
                        <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60 mb-4">Message Pattern</h3>
                        <textarea 
                          value={customNotifBody}
                          onChange={(e) => {
                            setCustomNotifBody(e.target.value);
                            localStorage.setItem('customNotifBody', e.target.value);
                          }}
                          className="w-full bg-white border border-brand-text/5 rounded-2xl p-6 text-sm font-serif italic text-brand-text/60 focus:outline-none focus:border-brand-text/20 min-h-[100px] resize-none"
                        />
                      </div>
                    </section>
                  </div>
                ) : activeTab === 'tracker' ? (
                  <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 hide-scrollbar">
                     <div>
                        <h3 className="text-2xl font-serif italic mb-2 text-brand-text">Break the Chain</h3>
                        <p className="text-xs text-brand-text/40 font-serif italic">Define your path to complete liberation.</p>
                     </div>
                     <div className="space-y-6">
                        <div className="space-y-4">
                           <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30">1. Identify the focus</h4>
                           <input 
                            id="habit-name"
                            type="text" 
                            placeholder="e.g. Alcohol, Cocaine, Gaming, Social Media..."
                            className="w-full p-6 bg-white border border-brand-text/5 rounded-2xl font-serif text-xl focus:outline-none focus:border-brand-text/20"
                           />
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30">2. Select Category</h4>
                           <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                              {addictionCategories.map(cat => (
                                <button 
                                  key={cat.id}
                                  onClick={() => setNewHabitCategory(cat.id)}
                                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${newHabitCategory === cat.id ? 'bg-brand-text text-white border-brand-text shadow-xl scale-105' : 'bg-white border-brand-text/5 opacity-50 hover:opacity-100'}`}
                                >
                                  {renderIcon(cat.id)}
                                  <span className="text-[8px] uppercase tracking-widest font-bold">{cat.name}</span>
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30">3. Your Why (Optional Goal)</h4>
                           <textarea 
                            value={newHabitGoal}
                            onChange={(e) => setNewHabitGoal(e.target.value)}
                            placeholder="Why are you doing this? (e.g. For my children, for my mental clarity..)"
                            className="w-full p-6 bg-white border border-brand-text/5 rounded-2xl font-serif text-sm italic min-h-[80px] resize-none focus:outline-none focus:border-brand-text/20"
                           />
                        </div>

                        <div className="pt-4">
                           <button 
                            disabled={isGeneratingNarrative}
                            onClick={() => {
                              const input = document.getElementById('habit-name') as HTMLInputElement;
                              if (input.value) {
                                addHabit(input.value, 'sobriety');
                                input.value = '';
                              }
                            }}
                            className={`w-full p-6 bg-brand-text text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-xs shadow-2xl transition-all flex items-center justify-center gap-3 ${isGeneratingNarrative ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                           >
                            {isGeneratingNarrative ? (
                              <><RefreshCw className="w-4 h-4 animate-spin" /> Generating AI Narrative...</>
                            ) : (
                              <><Shield className="w-4 h-4" /> Start Liberation Journey</>
                            )}
                           </button>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8">
                      <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500 relative z-10">
                         <img src={creatorInfo.photo} alt={creatorInfo.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-2xl shadow-xl p-3 z-20">
                        <img src={creatorInfo.logo} alt="FreeMe Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-serif italic text-brand-text mb-2">{creatorInfo.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-text/40 mb-6">{creatorInfo.role} • {creatorInfo.location}</p>
                    <div className="max-w-md bg-white/50 p-6 rounded-2xl border border-brand-text/5 mb-8">
                       <p className="text-sm font-serif italic text-brand-text/70 leading-relaxed">
                         "FreeMe provides a digital sanctuary for a liberated mind. One quote at a time, designed to ground you in your own power."
                       </p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-6 mt-12 btn-primary tracking-[0.3em] uppercase text-[10px] font-bold shadow-2xl"
              >
                Confirm and Return
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Simulation Section */}
      <div className="fixed left-12 bottom-12 hidden 2xl:flex flex-col gap-4 pointer-events-none opacity-40">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30">Widget Preview</p>
        <div className="w-56 h-56 editorial-card p-6 flex flex-col justify-between bg-white/80">
          <p className="text-xs font-serif italic leading-relaxed text-brand-text/60">"Your journey is the destination."</p>
          <div className="flex justify-between items-end">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">FREEME • TODAY</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
