/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, getDailyQuote, getRandomQuote, getCategories, creatorInfo, quotes, Habit, addictionCategories, AddictionType } from './lib/quotes';
import { Bell, BellOff, RefreshCw, Settings, X, Check, Copy, Share2, Mic, MicOff, Info, ExternalLink, Heart, Search, Shield, Zap, Sparkles, Plus, Trash2, LayoutGrid, Clock, Flame, Wine, Coins, Smartphone, MonitorPause, ChevronRight, Calendar, Activity, Music, Volume2, Book, Cross, HelpCircle, Send, Bookmark, Star, ChevronLeft, ListChecks, Mountain, TrendingUp, BookOpen, PenLine, CloudRain } from 'lucide-react';
import { bibleBooks, foundationsPlan, ReadingPlanDay } from './lib/bibleData';

export default function App() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(getDailyQuote());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'about' | 'tracker'>('preferences');
  const [viewMode, setViewMode] = useState<'feed' | 'zen' | 'dashboard' | 'vision' | 'breath' | 'faith'>('feed');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isBreathActive, setIsBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
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

  const [isSOSLoading, setIsSOSLoading] = useState(false);
  const [sosMessage, setSosMessage] = useState<string | null>(null);

  const [ambientSound, setAmbientSound] = useState<'none' | 'lofi' | 'rain' | 'nature' | 'space'>('none');
  const [autoRefreshQuotes, setAutoRefreshQuotes] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Auto-refresh logic for Zen Focus
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefreshQuotes && viewMode === 'zen') {
      interval = setInterval(() => {
        refreshQuote();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefreshQuotes, viewMode]);

  // Ambient sound logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      const soundUrls = {
        lofi: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Placeholder for lofi
        rain: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3", // Rain loops usually need long files
        nature: "https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3",
        space: "https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3",
        none: ""
      };

      if (ambientSound !== 'none') {
        // Since I don't have perfect looping mp3 urls, I'll use these as examples.
        // In a real app, we'd use better static assets.
        // I will use some known reliable ambient urls if possible.
        const actualUrls = {
          lofi: "https://stream.zeno.fm/f97800p6rz8uv", // Lofi Radio stream example
          rain: "https://www.soundjay.com/nature/rain-01.mp3",
          nature: "https://www.soundjay.com/nature/forest-01.mp3",
          space: "https://www.soundjay.com/misc/sounds/deep-space-01.mp3",
          none: ""
        };
        
        audioRef.current.src = actualUrls[ambientSound];
        audioRef.current.play().catch(e => console.error("Audio play blocked", e));
      }
    }
  }, [ambientSound]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathActive) {
      const cycle = () => {
        setBreathPhase('Inhale');
        timer = setTimeout(() => {
          setBreathPhase('Hold');
          timer = setTimeout(() => {
            setBreathPhase('Exhale');
            timer = setTimeout(() => {
              cycle();
            }, 4000);
          }, 4000);
        }, 4000);
      };
      cycle();
    }
    return () => clearTimeout(timer);
  }, [isBreathActive]);

  const toggleFavorite = (quoteId: string) => {
    const nextFavorites = favorites.includes(quoteId)
      ? favorites.filter(id => id !== quoteId)
      : [...favorites, quoteId];
    setFavorites(nextFavorites);
    localStorage.setItem('favorites', JSON.stringify(nextFavorites));
  };

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
    setViewMode('dashboard');
    setNewHabitGoal("");
  };

  const handleSOS = async () => {
    setIsSOSLoading(true);
    setSosMessage(null);
    try {
      const response = await fetch('/api/gemini/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          habitName: "active urge / crisis", 
          category: 'custom', 
          goal: "Immediate grounding and crisis intervention. Provide 3 quick, powerful steps to breath and stay strong." 
        })
      });
      const data = await response.json();
      setSosMessage(data.narrative);
    } catch (err) {
      setSosMessage("Breathe deeply. You have survived every hard day until now. This urge is temporary, but your freedom is permanent. Stay strong.");
    } finally {
      setIsSOSLoading(false);
    }
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

  const [reflections, setReflections] = useState<{id: string, text: string, date: string}[]>(() => {
    return JSON.parse(localStorage.getItem('liberation_reflections') || '[]');
  });
  const [newReflection, setNewReflection] = useState("");

  const [counselInput, setCounselInput] = useState("");
  const [counselResponse, setCounselResponse] = useState("");
  const [isCounselLoading, setIsCounselLoading] = useState(false);

  const [selectedBibleBook, setSelectedBibleBook] = useState(bibleBooks[0].name);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState(1);
  const [bibleContent, setBibleContent] = useState<{ book: string, chapter: number, verses: { verse: number, text: string }[] } | null>(null);
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [bibleHighlights, setBibleHighlights] = useState<{ id: string, book: string, chapter: number, verse: number, text: string }[]>(() => {
    return JSON.parse(localStorage.getItem('liberation_bible_highlights') || '[]');
  });
  const [readingPlanProgress, setReadingPlanProgress] = useState<number[]>(() => {
    return JSON.parse(localStorage.getItem('liberation_reading_plan') || '[]');
  });
  const [showBibleNav, setShowBibleNav] = useState(false);

  const fetchBibleChapter = async (book: string, chapter: number) => {
    setIsBibleLoading(true);
    try {
      const response = await fetch(`/api/bible/${encodeURIComponent(book)}/${chapter}`);
      const data = await response.json();
      setBibleContent({
        book: data.book_name,
        chapter: data.chapter,
        verses: data.verses
      });
      setSelectedBibleBook(data.book_name);
      setSelectedBibleChapter(data.chapter);
    } catch (err) {
      console.error("Bible Error:", err);
    } finally {
      setIsBibleLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'faith' && !bibleContent) {
      fetchBibleChapter(selectedBibleBook, selectedBibleChapter);
    }
  }, [viewMode]);

  const toggleHighlight = (verse: { verse: number, text: string }) => {
    const id = `${selectedBibleBook}-${selectedBibleChapter}-${verse.verse}`;
    const exists = bibleHighlights.find(h => h.id === id);
    let next;
    if (exists) {
      next = bibleHighlights.filter(h => h.id !== id);
    } else {
      next = [...bibleHighlights, { id, book: selectedBibleBook, chapter: selectedBibleChapter, verse: verse.verse, text: verse.text }];
    }
    setBibleHighlights(next);
    localStorage.setItem('liberation_bible_highlights', JSON.stringify(next));
  };

  const toggleReadingPlanDay = (day: number) => {
    const next = readingPlanProgress.includes(day) 
      ? readingPlanProgress.filter(d => d !== day)
      : [...readingPlanProgress, day];
    setReadingPlanProgress(next);
    localStorage.setItem('liberation_reading_plan', JSON.stringify(next));
  };

  const getBiblicalCounsel = async () => {
    if (!counselInput.trim()) return;
    setIsCounselLoading(true);
    setCounselResponse("");
    try {
      const response = await fetch('/api/gemini/biblical-counsel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: counselInput }),
      });
      const data = await response.json();
      setCounselResponse(data.counsel);
    } catch (err) {
      setCounselResponse("The Spirit is willing but the connection is weak. Please try again soon. Remember: 'God is our refuge and strength, a very present help in trouble.' (Psalm 46:1)");
    } finally {
      setIsCounselLoading(false);
    }
  };

  const addReflection = () => {
    if (!newReflection.trim()) return;
    const item = {
      id: Date.now().toString(),
      text: newReflection,
      date: new Date().toISOString()
    };
    const next = [item, ...reflections];
    setReflections(next);
    localStorage.setItem('liberation_reflections', JSON.stringify(next));
    setNewReflection("");
  };

  const deleteReflection = (id: string) => {
    const next = reflections.filter(r => r.id !== id);
    setReflections(next);
    localStorage.setItem('liberation_reflections', JSON.stringify(next));
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
    <div className="relative h-[100dvh] w-screen flex flex-col overflow-hidden selection:bg-brand-text/5">
      <audio ref={audioRef} className="hidden" />
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
      <header className="relative z-20 flex justify-between items-center px-6 py-6 md:px-12 md:py-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => setViewMode('feed')}
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2 border border-brand-text/5 hover:shadow-md transition-shadow">
             <img src={creatorInfo.logo} alt="FreeMe" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="editorial-title text-2xl">FreeMe</h1>
            <p className="caps-label">Sanctuary</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          {viewMode === 'feed' && (
            <div className="relative">
              <button 
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="btn-icon"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showCategoryMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCategoryMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-64 glass-morphism rounded-[2rem] shadow-2xl p-3 z-50 custom-scrollbar"
                    >
                        <p className="caps-label px-3 py-2 mb-2">Focus Chapters</p>
                        <div className="grid grid-cols-1 gap-1">
                          {getCategories().map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                handleCategoryChange(cat);
                                setShowCategoryMenu(false);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                                selectedCategory === cat 
                                ? "bg-brand-text text-white shadow-lg" 
                                : "hover:bg-brand-text/5 text-brand-text/60"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          <button 
            onClick={() => setShowSearch(true)}
            className="btn-icon"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setViewMode(prev => prev === 'zen' ? 'feed' : 'zen')}
            className={`btn-icon ${viewMode === 'zen' ? 'bg-brand-text text-white border-brand-text shadow-lg' : ''}`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="btn-icon"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth pb-32">
        {viewMode === 'faith' ? (
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 px-6 md:px-24 py-8 max-w-7xl mx-auto custom-scrollbar"
          >
            {/* Faith Sanctuary Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-brand-text/5 mb-6 shadow-sm">
                <Cross className="w-10 h-10 text-brand-text/40" />
              </div>
              <h2 className="editorial-title text-5xl md:text-6xl mb-4">Faith Sanctuary</h2>
              <p className="caps-label">Living by the eternal Word</p>
            </div>

            {/* Main Faith Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Column: Bible Reader & Navigation */}
              <div className="lg:col-span-8 space-y-10">
                
                {/* Bible Navigation & Reader Header */}
                <div className="glass-morphism rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-brand-text/5 flex flex-wrap items-center justify-between gap-6 bg-white/20">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setShowBibleNav(!showBibleNav)}
                        className="flex items-center gap-3 px-6 py-4 bg-brand-text text-white rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold shadow-xl hover:scale-105 transition-all"
                      >
                        <ListChecks className="w-4 h-4" />
                        {selectedBibleBook} {selectedBibleChapter}
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => fetchBibleChapter(selectedBibleBook, Math.max(1, selectedBibleChapter - 1))}
                          className="btn-icon w-10 h-10 rounded-xl"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => fetchBibleChapter(selectedBibleBook, selectedBibleChapter + 1)}
                          className="btn-icon w-10 h-10 rounded-xl"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                       <span className="caps-label opacity-40">World English Bible</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showBibleNav && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-brand-text/5 border-b border-brand-text/5"
                      >
                        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                           {bibleBooks.map(book => (
                             <button
                               key={book.name}
                               onClick={() => {
                                 setSelectedBibleBook(book.name);
                                 fetchBibleChapter(book.name, 1);
                                 setShowBibleNav(false);
                               }}
                               className={`px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold text-left transition-all ${selectedBibleBook === book.name ? 'bg-brand-text text-white shadow-lg' : 'hover:bg-brand-text/5 text-brand-text/60 bg-white/50'}`}
                             >
                               {book.name}
                             </button>
                           ))}
                        </div>
                        <div className="p-6 bg-white/30 flex flex-wrap gap-2 justify-center">
                           {Array.from({ length: bibleBooks.find(b => b.name === selectedBibleBook)?.chapters || 0 }).map((_, i) => (
                             <button 
                              key={i}
                              onClick={() => {
                                fetchBibleChapter(selectedBibleBook, i + 1);
                                setShowBibleNav(false);
                              }}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all ${selectedBibleChapter === i + 1 ? 'bg-brand-text text-white shadow-lg' : 'hover:bg-brand-text/10 text-brand-text/60 bg-white/80'}`}
                             >
                               {i + 1}
                             </button>
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-10 md:p-16 min-h-[600px] relative">
                    {isBibleLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-30">
                         <RefreshCw className="w-10 h-10 animate-spin" />
                         <p className="caps-label">Awaiting Revelation...</p>
                      </div>
                    ) : bibleContent ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                      >
                        <div className="mb-16 border-l-4 border-brand-text/10 pl-8">
                           <h3 className="editorial-title text-4xl md:text-6xl mb-3">{bibleContent.book} {bibleContent.chapter}</h3>
                           <p className="caps-label opacity-40">Sacred Text • Focus Your Spirit</p>
                        </div>
                        <div className="space-y-10">
                           {bibleContent.verses.map(v => {
                             const isHighlighted = bibleHighlights.some(h => h.id === `${selectedBibleBook}-${selectedBibleChapter}-${v.verse}`);
                             return (
                               <div key={v.verse} className="group relative flex gap-8">
                                 <div className="flex flex-col items-center gap-3 pt-2 min-w-[40px]">
                                    <span className="text-xs font-bold text-brand-text/20 group-hover:text-brand-text/40 transition-colors uppercase tracking-widest">{v.verse}</span>
                                    <button 
                                      onClick={() => toggleHighlight(v)}
                                      className={`p-2 rounded-lg transition-all ${isHighlighted ? 'bg-amber-50 text-amber-500 shadow-sm' : 'text-brand-text/5 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50 opacity-0'}`}
                                    >
                                      <Star className={`w-4 h-4 ${isHighlighted ? 'fill-current' : ''}`} />
                                    </button>
                                 </div>
                                 <p className={`text-xl md:text-2xl font-serif leading-[1.7] transition-all cursor-pointer rounded-2xl px-4 -mx-4 ${isHighlighted ? 'bg-amber-50/50 text-brand-text/90 shadow-sm' : 'text-brand-text/70 group-hover:text-brand-text'}`} onClick={() => toggleHighlight(v)}>
                                   {v.text}
                                 </p>
                               </div>
                             );
                           })}
                        </div>
                      </motion.div>
                    ) : null}
                  </div>
                </div>

                {/* AI Biblical Counseling (Inside main grid now) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bento-card bg-brand-text text-white shadow-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="editorial-title text-3xl text-white">Biblical Counsel</h3>
                      </div>
                      <p className="text-sm font-serif italic opacity-60 leading-relaxed mb-10">
                        Ask for guidance, comfort, or wisdom. The Word is a lamp unto your feet and a light unto your path. 
                      </p>
                    </div>
                    <div className="relative">
                      <textarea 
                        value={counselInput}
                        onChange={(e) => setCounselInput(e.target.value)}
                        placeholder="Seek wisdom here..."
                        className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-base font-serif italic text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 transition-all min-h-[120px] resize-none"
                      />
                      <button 
                        onClick={getBiblicalCounsel}
                        disabled={isCounselLoading || !counselInput.trim()}
                        className="absolute bottom-6 right-6 w-12 h-12 bg-white text-brand-text rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 disabled:opacity-50 transition-all"
                      >
                        {isCounselLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bento-card flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-brand-text/5 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-brand-text/30" />
                      </div>
                      <h4 className="caps-label">Spirit-Led Guidance</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[350px] pr-4">
                      {counselResponse ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-lg font-serif italic text-brand-text/70 leading-[1.8] whitespace-pre-wrap"
                        >
                          {counselResponse}
                        </motion.div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-10">
                          <Book className="w-12 h-12 mb-4" />
                          <p className="caps-label">Waiting for your heart to speak...</p>
                        </div>
                      )}
                    </div>
                    {counselResponse && (
                      <button 
                        onClick={() => {
                          setCounselInput("");
                          setCounselResponse("");
                        }}
                        className="mt-6 text-[9px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-opacity self-start"
                      >
                        Start Fresh Discussion
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Reading Plan & Highlights */}
              <div className="lg:col-span-4 space-y-10">
                
                {/* Scripture of the Day Card */}
                <div className="p-12 bg-emerald-600 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="caps-label text-white/50 mb-6 block">Scripture of the Day</span>
                    <p className="text-2xl md:text-3xl font-serif italic mb-8 leading-relaxed">
                      "{quotes.filter(q => q.category === 'Scripture')[new Date().getDate() % quotes.filter(q => q.category === 'Scripture').length].text}"
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                       <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                         — {quotes.filter(q => q.category === 'Scripture')[new Date().getDate() % quotes.filter(q => q.category === 'Scripture').length].author}
                       </p>
                       <button onClick={handleShare} className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all">
                         <Share2 className="w-5 h-5 text-white" />
                       </button>
                    </div>
                  </div>
                  <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-12 pointer-events-none" />
                </div>

                {/* Reading Plan */}
                <div className="bento-card">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-brand-text/5">
                    <div>
                      <h3 className="editorial-title text-2xl mb-1">Foundations</h3>
                      <p className="caps-label">30-Day Fellowship</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-serif italic text-emerald-600">{Math.round((readingPlanProgress.length / foundationsPlan.length) * 100)}%</p>
                       <p className="text-[9px] font-bold opacity-30">Active</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                     {foundationsPlan.map(day => (
                       <div key={day.day} className="flex items-center gap-5 group">
                         <button 
                          onClick={() => toggleReadingPlanDay(day.day)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shadow-sm ${readingPlanProgress.includes(day.day) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-brand-text/10 group-hover:border-emerald-500/30'}`}
                         >
                           {readingPlanProgress.includes(day.day) && <Check className="w-4 h-4" />}
                         </button>
                         <div className="flex-1 cursor-pointer" onClick={() => {
                            const [book, chapter] = day.reading.split(' ');
                            fetchBibleChapter(book, parseInt(chapter));
                         }}>
                            <p className={`text-[10px] uppercase tracking-widest font-bold ${readingPlanProgress.includes(day.day) ? 'opacity-20 line-through' : 'opacity-60'}`}>Day {day.day}: {day.title}</p>
                            <p className={`text-sm font-serif italic transition-colors ${readingPlanProgress.includes(day.day) ? 'opacity-20 line-through' : 'opacity-40 group-hover:text-emerald-600'}`}>{day.reading}</p>
                         </div>
                       </div>
                     ))}
                  </div>
                </div>

                {/* Highlights Table */}
                <div className="bento-card p-10">
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-brand-text/5">
                    <div>
                      <h3 className="editorial-title text-2xl mb-1">Treasures</h3>
                      <p className="caps-label">Spirit-Guided Highlights</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-500 fill-current" />
                    </div>
                  </div>

                  <div className="space-y-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                     {bibleHighlights.length === 0 ? (
                       <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-10 text-center">
                          <Bookmark className="w-12 h-12" />
                          <p className="caps-label">Seek and ye shall find gems</p>
                       </div>
                     ) : (
                       bibleHighlights.map(h => (
                         <div key={h.id} className="group relative">
                            <div className="flex justify-between items-center mb-2">
                               <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30">{h.book} {h.chapter}:{h.verse}</p>
                               <button 
                                onClick={() => toggleHighlight({ verse: h.verse, text: h.text })} 
                                className="p-2 -mr-2 rounded-lg opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                            <p 
                              onClick={() => fetchBibleChapter(h.book, h.chapter)}
                              className="text-base font-serif italic text-brand-text/60 leading-relaxed hover:text-brand-text transition-all cursor-pointer bg-brand-text/[0.02] p-4 rounded-xl border border-transparent hover:border-brand-text/5"
                            >
                              "{h.text}"
                            </p>
                         </div>
                       ))
                     )}
                  </div>
                </div>

              </div>
            </div>
            
            {/* Spiritual Guidance Footer */}
            <div className="mt-24 p-16 md:p-24 bento-card text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-text/5 rounded-full blur-[100px]" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-text/5 rounded-full blur-[100px]" />
               
               <div className="max-w-3xl mx-auto relative z-10">
                 <h3 className="editorial-title text-5xl mb-8">Abide in His Word</h3>
                 <p className="text-xl font-serif italic text-brand-text/50 mb-12 leading-relaxed px-4">
                   The Gospel is the power of God for salvation to everyone who believes. 
                   Truth is not just a concept, but a Person who sets you truly free.
                 </p>
                 <div className="flex flex-wrap justify-center gap-5">
                    <button onClick={() => setViewMode('dashboard')} className="btn-primary">
                      Track My Liberation
                    </button>
                    <button onClick={() => setViewMode('feed')} className="px-10 py-4 bg-white border border-brand-text/10 text-brand-text text-[10px] uppercase tracking-widest font-bold rounded-2xl hover:bg-neutral-50 transition-all shadow-sm">
                      Wisdom Feed
                    </button>
                 </div>
               </div>
            </div>
          </motion.main>
        ) : viewMode === 'breath' ? (
          <motion.main 
            key="breath"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-16"
          >
            <div className="max-w-xl">
              <p className="caps-label mb-6 text-emerald-600 opacity-100">The Silence of the Soul</p>
              <h2 className="editorial-title text-6xl md:text-8xl mb-8">Breath Center</h2>
              <p className="text-xl font-serif italic text-brand-text/50 leading-relaxed">
                Be still, and know that I am God. Find rhythm in your spirit and peace in your heart.
              </p>
            </div>

            <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  scale: isBreathActive ? [1, 1.6, 1] : 1,
                  opacity: isBreathActive ? [0.4, 1, 0.4] : 0.4
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[80px]"
              />
              <motion.div 
                animate={{ 
                  scale: isBreathActive ? [1, 1.4, 1] : 1,
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full h-full rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center relative z-10"
              >
                <div className="p-12 glass-morphism rounded-full w-2/3 h-2/3 flex flex-col items-center justify-center shadow-2xl">
                   <p className="caps-label mb-2 text-emerald-600 opacity-100">{isBreathActive ? breathPhase : "Be Still"}</p>
                   <span className="text-5xl font-serif italic text-brand-text">Pneuma</span>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-10">
              <button 
                onClick={() => setIsBreathActive(!isBreathActive)}
                className={`btn-primary px-16 py-6 ${isBreathActive ? 'bg-emerald-600 text-white' : 'bg-brand-text text-white'}`}
              >
                {isBreathActive ? 'Rest in Stillness' : 'Enter Rhythm'}
              </button>
              
              <div className="flex gap-16">
                 <div className="text-center group cursor-pointer">
                    <p className="caps-label mb-2 opacity-20 group-hover:opacity-100 transition-opacity">Pulse</p>
                    <p className="text-3xl font-serif italic">72 bpm</p>
                 </div>
                 <div className="text-center group cursor-pointer">
                    <p className="caps-label mb-2 opacity-20 group-hover:opacity-100 transition-opacity">SpO2</p>
                    <p className="text-3xl font-serif italic">98%</p>
                 </div>
              </div>
            </div>
            <p className="text-xs font-serif italic opacity-40">4s Inhale • 4s Hold • 4s Exhale</p>
          </motion.main>
        ) : viewMode === 'vision' ? (
          <motion.main 
            key="vision"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 md:px-24 py-12 max-w-7xl mx-auto custom-scrollbar h-full overflow-y-auto pb-48"
          >
            <div className="text-center mb-24">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-brand-text/5 mb-8">
                 <Heart className="w-12 h-12 text-brand-text/30" />
              </div>
              <h2 className="editorial-title text-6xl md:text-7xl mb-6">Kingdom Vision</h2>
              <p className="caps-label">Where there is no vision, the people perish</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {favorites.length === 0 ? (
                <div className="lg:col-span-3 py-32 bento-card border-2 border-dashed border-brand-text/10 bg-transparent text-center">
                  <Heart className="w-16 h-16 opacity-10 mx-auto mb-8" />
                  <p className="editorial-title text-3xl opacity-30">No wisdom keys saved yet.</p>
                  <button onClick={() => setViewMode('feed')} className="btn-primary mt-12">Search Wisdom</button>
                </div>
              ) : (
                quotes.filter(q => favorites.includes(q.id)).map(quote => (
                  <motion.div 
                    key={quote.id}
                    layoutId={quote.id}
                    className="bento-card relative group"
                  >
                     <p className="text-2xl font-serif italic text-brand-text leading-relaxed mb-10">
                      “{quote.text}”
                     </p>
                     <div className="flex items-center justify-between border-t border-brand-text/5 pt-6">
                        <span className="caps-label opacity-40">{quote.author}</span>
                        <button 
                          onClick={() => toggleFavorite(quote.id)}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        >
                           <Heart className="w-4 h-4 fill-current" />
                        </button>
                     </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="mt-32 p-24 bento-card text-center bg-gray-950 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 max-w-2xl mx-auto">
                 <h3 className="editorial-title text-5xl text-white mb-8">Walk by Faith</h3>
                 <p className="text-xl font-serif italic text-white/40 mb-12 leading-relaxed">
                   Set your mind on things above, not on things on the earth. 
                   Your vision should align with the eternal call on your life.
                 </p>
                 <button onClick={() => setViewMode('dashboard')} className="px-10 py-4 bg-white text-brand-text text-[10px] uppercase tracking-widest font-bold rounded-2xl hover:bg-neutral-50 transition-all shadow-sm">
                   View My Trajectory
                 </button>
               </div>
               <Mountain className="absolute -bottom-20 -right-20 w-96 h-96 opacity-10 pointer-events-none" />
            </div>
          </motion.main>
        ) : viewMode === 'dashboard' ? (
          <motion.main 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 md:px-24 py-12 max-w-7xl mx-auto custom-scrollbar h-full overflow-y-auto pb-48 relative z-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <div>
                <p className="caps-label mb-4 text-emerald-600 opacity-100">Progress Tracking</p>
                <h2 className="editorial-title text-6xl md:text-7xl">Liberation</h2>
              </div>
              <div className="text-right">
                 <p className="text-4xl font-serif italic text-brand-text/30">Day {Math.ceil((Date.now() - 1715904000000) / 86400000)}</p>
                 <p className="caps-label">In the light of Christ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
               <div className="lg:col-span-12">
                   <button 
                    onClick={handleSOS}
                    className="w-full p-10 rounded-[3.5rem] bg-red-50 border-2 border-red-100 flex items-center justify-between group hover:bg-red-500 hover:border-red-500 transition-all duration-500 shadow-xl"
                   >
                    <div className="text-left flex items-center gap-8">
                       <div className="w-16 h-16 rounded-[1.5rem] bg-red-500 text-white flex items-center justify-center shadow-lg group-hover:bg-white group-hover:text-red-500 transition-colors">
                          <Shield className="w-8 h-8" />
                       </div>
                       <div>
                          <h3 className="editorial-title text-4xl text-red-600 group-hover:text-white transition-colors">SOS Sanctuary</h3>
                          <p className="caps-label text-red-400 group-hover:text-red-100 transition-colors">Emergency AI Intervention</p>
                       </div>
                    </div>
                    <div>
                       {isSOSLoading ? <RefreshCw className="w-8 h-8 text-red-500 group-hover:text-white animate-spin" /> : <ChevronRight className="w-8 h-8 text-red-500 group-hover:text-white" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {sosMessage && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-8 p-12 bg-white border border-red-100 rounded-[3rem] shadow-2xl relative overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
                         <p className="text-2xl font-serif italic text-brand-text/80 leading-relaxed max-w-4xl">
                            "{sosMessage}"
                         </p>
                         <button 
                          onClick={() => setSosMessage(null)}
                          className="mt-10 btn-primary"
                         >
                          Resume Path
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Daily Focus / Habits */}
              <div className="lg:col-span-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {habits.map((habit) => (
                    <div 
                      key={habit.id}
                      className="bento-card relative group overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${getCategoryColor(habit.category)}`}>
                            {renderIcon(habit.category)}
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => resetHabit(habit.id)} className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                <RefreshCw className="w-4 h-4" />
                             </button>
                             <button onClick={() => deleteHabit(habit.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                        <h4 className="caps-label mb-2 opacity-20">{habit.category} • {habit.type}</h4>
                        <h3 className="editorial-title text-3xl mb-3">{habit.name}</h3>
                        <p className="text-sm font-serif italic text-brand-text/40 mb-10 leading-relaxed h-12 overflow-hidden line-clamp-2">{habit.narrative || "Living intentionally today."}</p>
                        
                        <div className="flex items-end gap-3 mb-10">
                            <span className="text-7xl font-serif leading-none text-brand-text">{calculateDays(habit.startDate)}</span>
                            <div className="pb-1">
                               <p className="caps-label opacity-40">Days</p>
                            </div>
                        </div>

                        <div className="h-1.5 w-full bg-brand-text/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((calculateDays(habit.startDate) / 90) * 100, 100)}%` }}
                              className="h-full bg-brand-text"
                            />
                        </div>
                      </div>
                      <Sparkles className="absolute -bottom-10 -right-10 w-32 h-32 text-brand-text/[0.03] rotate-12 pointer-events-none" />
                    </div>
                  ))}
                  
                  <div className="bento-card border-2 border-dashed border-brand-text/10 bg-transparent flex flex-col items-center justify-center text-center group cursor-pointer hover:border-brand-text/30" onClick={() => { setActiveTab('tracker'); setIsSettingsOpen(true); }}>
                    <Plus className="w-12 h-12 text-brand-text/10 mb-4 group-hover:text-brand-text/30 transition-colors" />
                    <p className="caps-label">Define a new victory</p>
                  </div>
                </div>

                {/* Growth Reflections */}
                <div className="bento-card">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="editorial-title text-3xl mb-1">Soul Reflections</h3>
                      <p className="caps-label">A journal of grace</p>
                    </div>
                    <PenLine className="w-8 h-8 text-brand-text/20" />
                  </div>
                  
                  <div className="space-y-8">
                    <div className="relative">
                      <textarea 
                        value={newReflection}
                        onChange={(e) => setNewReflection(e.target.value)}
                        placeholder="What has the Lord shown you in your heart today?"
                        className="w-full bg-brand-text/5 border border-brand-text/5 rounded-[2.5rem] p-10 text-xl font-serif italic text-brand-text placeholder:text-brand-text/20 focus:outline-none focus:bg-brand-text/[0.08] transition-all min-h-[160px] resize-none"
                      />
                      <button 
                        onClick={addReflection}
                        disabled={!newReflection.trim()}
                        className="btn-primary absolute bottom-10 right-10 disabled:opacity-30 flex items-center gap-2"
                      >
                         Save Soul Reflection
                      </button>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {reflections.length === 0 ? (
                        <div className="py-20 text-center opacity-10">
                          <CloudRain className="w-16 h-16 mx-auto mb-6" />
                          <p className="caps-label">Waiting for the rain of your words</p>
                        </div>
                      ) : (
                        reflections.map((ref) => (
                          <div key={ref.id} className="p-10 bg-white/50 border border-brand-text/5 rounded-[2.5rem] relative group">
                            <div className="flex items-center justify-between mb-6">
                              <span className="caps-label opacity-40">{new Date(ref.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                              <button onClick={() => deleteReflection(ref.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-2xl font-serif italic text-brand-text/70 leading-relaxed">{ref.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Insights Sidebar */}
              <div className="lg:col-span-4 space-y-10">
                <div className="bento-card bg-brand-text text-white overflow-hidden relative">
                   <div className="relative z-10">
                     <p className="caps-label text-white/50 mb-10">Commitment Level</p>
                     <div className="flex items-end gap-3 mb-6">
                       <span className="text-9xl font-serif italic leading-none">92</span>
                       <span className="text-2xl font-serif italic opacity-50 mb-4">%</span>
                     </div>
                     <p className="text-lg font-serif italic text-white/70 leading-relaxed">
                       You are ascending. Your discipline is a testament to your faith.
                     </p>
                   </div>
                   <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-5 rotate-12" />
                </div>

                <div className="bento-card">
                  <h3 className="editorial-title text-2xl mb-10 pb-6 border-b border-brand-text/5">Dominion Stats</h3>
                  <div className="space-y-10">
                    <div className="flex justify-between items-end group">
                       <div>
                         <p className="caps-label mb-2 opacity-20 group-hover:opacity-100 transition-opacity">Sanctuary Hours</p>
                         <p className="text-3xl font-serif italic">128h Reclaimed</p>
                       </div>
                       <TrendingUp className="text-emerald-500 w-6 h-6 mb-2" />
                    </div>
                    <div className="flex justify-between items-end group">
                       <div>
                         <p className="caps-label mb-2 opacity-20 group-hover:opacity-100 transition-opacity">Word Immersion</p>
                         <p className="text-3xl font-serif italic">42 Chapters</p>
                       </div>
                       <BookOpen className="text-brand-text/20 w-6 h-6 mb-2" />
                    </div>
                    <div className="flex justify-between items-end group">
                       <div>
                         <p className="caps-label mb-2 opacity-20 group-hover:opacity-100 transition-opacity">Prayer Intensity</p>
                         <p className="text-3xl font-serif italic">Deep Rhythm</p>
                       </div>
                       <Activity className="text-brand-text/20 w-6 h-6 mb-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.main>
        ) : (
          <main className={`relative z-10 flex flex-col justify-center px-6 md:px-24 transition-all duration-1000 ${viewMode === 'zen' ? 'h-full pt-0' : 'min-h-[60vh] md:min-h-[70vh] pt-20 pb-32'}`}>
            <AnimatePresence mode="wait">
              {isQuoteVisible && (
                <motion.div
                  key={currentQuote.id}
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-4xl relative w-full mx-auto"
                >
                  <div className={`absolute -left-12 -top-12 md:-left-20 md:-top-20 flex flex-col items-center gap-4 transition-opacity duration-1000 ${viewMode === 'zen' ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-[100px] md:text-[240px] font-serif leading-none opacity-5 text-brand-accent pointer-events-none select-none">“</span>
                    <motion.button 
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFavorite(currentQuote.id)}
                        className="relative z-20 group"
                    >
                        <Heart className={`w-8 h-8 transition-colors duration-500 ${isFavorite ? "fill-red-500 text-red-500" : "text-brand-text/10 group-hover:text-brand-text/30"}`} />
                    </motion.button>
                  </div>
                  
                  <h2 className={`font-serif leading-[1.15] mb-8 relative text-brand-text transition-all duration-1000 text-center md:text-left ${viewMode === 'zen' ? 'text-3xl md:text-8xl' : 'text-2xl sm:text-3xl md:text-6xl lg:text-7xl'}`}>
                    {currentQuote.text}
                  </h2>

                  <div className={`flex items-center justify-center md:justify-start gap-6 max-w-2xl transition-opacity duration-1000 ${viewMode === 'zen' ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-px bg-brand-text/20 hidden md:block"></div>
                      <p className="text-lg md:text-2xl font-serif italic opacity-60">
                        {currentQuote.author}
                      </p>
                    </div>
                  </div>

                  {viewMode !== 'zen' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-16 flex flex-wrap items-center justify-center md:justify-start gap-4"
                    >
                       <button onClick={() => refreshQuote()} className="px-8 py-4 rounded-2xl bg-brand-text text-white text-[10px] uppercase tracking-widest font-bold shadow-lg flex items-center gap-3 active:scale-95 transition-transform">
                          <RefreshCw className="w-4 h-4" /> Next Wisdom
                       </button>
                       <div className="flex items-center gap-2">
                         <button onClick={handleShare} className="w-12 h-12 rounded-2xl border border-brand-text/10 flex items-center justify-center text-brand-text/40 hover:text-brand-text hover:border-brand-text/40 transition-all bg-white/50">
                            <Share2 className="w-4 h-4" />
                         </button>
                         <button onClick={copyToClipboard} className="w-12 h-12 rounded-2xl border border-brand-text/10 flex items-center justify-center text-brand-text/40 hover:text-brand-text hover:border-brand-text/40 transition-all bg-white/50">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                         </button>
                       </div>
                    </motion.div>
                  )}
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

      {/* Global Metadata Footer (Hidden on mobile) */}
      <footer className="fixed bottom-32 left-10 hidden xl:flex flex-col gap-2 p-2 pointer-events-none opacity-40 z-50">
        <div 
          onClick={() => {
            setActiveTab('about');
            setIsSettingsOpen(true);
          }}
          className="cursor-pointer group flex items-center gap-3 pointer-events-auto"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-text/10 grayscale group-hover:grayscale-0 transition-all">
            <img src={creatorInfo.photo} alt={creatorInfo.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] font-bold opacity-30 group-hover:opacity-60 transition-opacity">Creator</p>
            <p className="text-[9px] font-bold text-brand-text">{creatorInfo.name}</p>
          </div>
        </div>
      </footer>

        {/* Bottom Navigation */}
        {viewMode !== 'zen' && (
          <nav className="fixed bottom-0 left-0 right-0 z-[60] p-6 lg:p-10 flex justify-center pointer-events-none">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="glass-morphism rounded-[2.5rem] p-2 flex items-center gap-1 pointer-events-auto shadow-2xl border-white/40"
            >
               {[
                 { id: 'feed', icon: Sparkles, label: 'Feed' },
                 { id: 'dashboard', icon: LayoutGrid, label: 'Stats' },
                 { id: 'faith', icon: Cross, label: 'Faith' },
                 { id: 'vision', icon: Heart, label: 'Board' },
                 { id: 'breath', icon: Clock, label: 'Breath' }
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setViewMode(tab.id as any)}
                   className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] transition-all duration-500 group ${
                     viewMode === tab.id 
                     ? 'bg-brand-text text-white shadow-xl scale-105' 
                     : 'text-brand-text/40 hover:text-brand-text hover:bg-brand-text/5'
                   }`}
                 >
                   <tab.icon className={`w-5 h-5 transition-transform duration-500 ${viewMode === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                   <span className={`text-[10px] uppercase tracking-[0.2em] font-bold overflow-hidden transition-all duration-500 ${viewMode === tab.id ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden lg:block lg:opacity-30 lg:w-auto'}`}>
                     {tab.label}
                   </span>
                 </button>
               ))}
            </motion.div>
          </nav>
        )}

      {/* Vertical Decorative Rail Right */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-16 pointer-events-none hidden lg:flex">
        <div className="h-32 w-px bg-brand-text/10"></div>
        <span className="rotate-90 text-[10px] uppercase tracking-[0.5em] font-bold opacity-20 whitespace-nowrap">FREE YOUR SPIRIT</span>
        <div className="h-32 w-px bg-brand-text/10"></div>
      </div>

      {/* Settings Modal (High Performance & Elegant) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-brand-text/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(45,41,38,0.25)] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
               {/* Modal Sidebar */}
               <div className="w-full md:w-80 bg-brand-text/5 p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-text/5">
                 <div>
                   <div className="flex items-center gap-4 mb-16">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                        <Settings className="w-5 h-5 text-brand-text/30" />
                      </div>
                      <h3 className="editorial-title text-3xl">Portal</h3>
                   </div>
                   <nav className="space-y-6">
                      {[
                        { id: 'preferences', label: 'Preferences' },
                        { id: 'tracker', label: 'Victories' },
                        { id: 'about', label: 'Legacy' }
                      ].map((tab) => (
                        <button 
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`block w-full text-left caps-label transition-all ${activeTab === tab.id ? 'text-emerald-600 opacity-100 translate-x-3' : 'hover:opacity-100 hover:translate-x-1'}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                   </nav>
                 </div>
                 <div className="hidden md:block">
                    <p className="caps-label mb-2">Version 3.0</p>
                    <p className="text-[10px] font-serif italic text-brand-text/30">FreeMe: The Great Liberation</p>
                 </div>
               </div>

               {/* Modal Content */}
               <div className="flex-1 p-12 md:p-20 overflow-y-auto custom-scrollbar bg-white">
                  {activeTab === 'preferences' && (
                    <div className="space-y-12">
                       <h4 className="editorial-title text-4xl mb-12">Fine Tuning</h4>
                       <div className="space-y-10">
                          <div className="flex items-center justify-between group">
                             <div>
                                <p className="caps-label text-brand-text/40 mb-1">Rituals</p>
                                <p className="text-xl font-serif italic">Auto-Wisdom Rotation</p>
                             </div>
                             <button 
                              onClick={() => setAutoRefreshQuotes(!autoRefreshQuotes)}
                              className={`w-14 h-8 rounded-full p-1 transition-all ${autoRefreshQuotes ? 'bg-emerald-600 shadow-lg' : 'bg-brand-text/10'}`}
                             >
                                <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-sm ${autoRefreshQuotes ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                          </div>
                          
                          <div className="flex items-center justify-between group">
                             <div>
                                <p className="caps-label text-brand-text/40 mb-1">Presence</p>
                                <p className="text-xl font-serif italic">Sanctuary Notifications</p>
                             </div>
                             <button 
                              onClick={toggleNotifications}
                              className={`w-14 h-8 rounded-full p-1 transition-all ${notificationsEnabled ? 'bg-emerald-600 shadow-lg' : 'bg-brand-text/10'}`}
                             >
                                <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-sm ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                          </div>

                          <div className="pt-8">
                             <p className="caps-label mb-6">Auditory Focus</p>
                             <div className="space-y-4">
                                {[
                                  { id: 'none', label: 'Silence' },
                                  { id: 'rain', label: 'Sacred Rain' },
                                  { id: 'nature', label: 'Divine Forest' },
                                  { id: 'space', label: 'Aether Chimes' }
                                ].map(sound => (
                                  <button 
                                    key={sound.id}
                                    onClick={() => setAmbientSound(sound.id as any)}
                                    className={`w-full text-left p-6 rounded-2xl border transition-all ${ambientSound === sound.id ? 'border-brand-text bg-brand-text/5' : 'border-brand-text/5 hover:bg-brand-text/5'}`}
                                  >
                                    <p className="text-lg font-serif italic">{sound.label}</p>
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'tracker' && (
                    <div className="space-y-12">
                       <h4 className="editorial-title text-4xl">Define Victory</h4>
                       <div className="space-y-8">
                          <div className="space-y-4">
                             <p className="caps-label text-brand-text/40">Point of Focus</p>
                             <input 
                              id="habit-input-field"
                              type="text" 
                              placeholder="e.g. Alcohol, Lust, Pride..."
                              className="w-full p-6 bg-brand-text/5 border border-brand-text/5 rounded-[2rem] font-serif text-xl focus:outline-none focus:border-brand-text/10"
                             />
                          </div>
                          <div className="space-y-4">
                             <p className="caps-label text-brand-text/40">Sacred Goal</p>
                             <textarea 
                              value={newHabitGoal}
                              onChange={(e) => setNewHabitGoal(e.target.value)}
                              placeholder="Why must you be free?"
                              className="w-full p-8 bg-brand-text/5 border border-brand-text/5 rounded-[2rem] font-serif text-base italic min-h-[120px] resize-none focus:outline-none focus:border-brand-text/10"
                             />
                          </div>
                          <button 
                            disabled={isGeneratingNarrative}
                            onClick={() => {
                              const input = document.getElementById('habit-input-field') as HTMLInputElement;
                              if (input.value) {
                                addHabit(input.value, 'sobriety');
                                input.value = '';
                                setIsSettingsOpen(false);
                              }
                            }}
                            className="btn-primary w-full py-6 flex items-center justify-center gap-4"
                          >
                             {isGeneratingNarrative ? <RefreshCw className="animate-spin w-5 h-5" /> : <Shield className="w-5 h-5" />}
                             Establish Sovereignty
                          </button>
                       </div>
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="space-y-12">
                       <h4 className="editorial-title text-4xl mb-12">Legacy</h4>
                       <div className="p-12 glass-morphism rounded-[3rem] text-center">
                          <img src={creatorInfo.logo} alt="Logo" className="w-24 h-24 mx-auto mb-10 rounded-3xl shadow-xl" />
                          <h5 className="editorial-title text-3xl mb-4">{creatorInfo.name}</h5>
                          <p className="text-lg font-serif italic text-brand-text/50 mb-10 leading-relaxed">
                            {creatorInfo.mission}
                          </p>
                       </div>
                       <div className="p-8 border border-emerald-100 rounded-[2rem] bg-emerald-50 text-emerald-700">
                          <p className="caps-label mb-3 text-emerald-600 opacity-100">Divine Mandate</p>
                          <p className="text-base font-serif italic leading-loose">
                            FreeMe is a digital sanctuary engineered to facilitate the transition from worldly dependency to spiritual dominion. Every line of code is a prayer for your liberation.
                          </p>
                       </div>
                    </div>
                  )}
               </div>

               <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-10 right-10 w-12 h-12 bg-white/20 hover:bg-white text-brand-text rounded-2xl flex items-center justify-center transition-all z-10 shadow-lg border border-brand-text/5"
               >
                 <X className="w-6 h-6" />
               </button>
            </motion.div>
          </div>
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
