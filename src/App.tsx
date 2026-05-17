/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, getDailyQuote, getRandomQuote, getCategories, creatorInfo } from './lib/quotes';
import { Bell, BellOff, RefreshCw, Settings, X, Check, Copy, Share2, Mic, MicOff, Info, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(getDailyQuote());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'about'>('preferences');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('reminderTime') || '09:00';
  });
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load quote of the day or a random one
  useEffect(() => {
    const daily = getDailyQuote();
    setCurrentQuote(daily);
  }, []);

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
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-1">Offline Resilience</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-medium opacity-80 uppercase tracking-widest text-[9px]">Local Vault Ready</span>
            </div>
          </div>
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
        </div>
      </header>

      {/* Category Chips Container */}
      <div className="relative z-10 px-8 md:px-12 mb-4">
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
      </div>

      {/* Main Content: The Quote Focus */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-24">
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
              <span className="text-[160px] md:text-[240px] font-serif leading-none absolute -left-12 md:-left-20 -top-24 md:-top-32 opacity-5 text-brand-accent pointer-events-none select-none">“</span>
              
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.15] mb-12 relative text-brand-text">
                {currentQuote.text.split(' ').map((word, i) => (
                  <span key={i} className={i % 8 === 3 ? "italic font-light opacity-80" : ""}>{word} </span>
                ))}
              </h2>

              <div className="flex items-center justify-between gap-6 max-w-2xl">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-px bg-brand-text/20"></div>
                  <p className="text-xl md:text-2xl font-serif italic opacity-60">
                    {currentQuote.author}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-30 px-3 py-1 border border-brand-text/5 rounded-full">
                    {currentQuote.category}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
                          <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60 mb-2">Daily Reminders</h3>
                          <p className="text-xs text-brand-text/40 leading-relaxed max-w-[200px] font-serif italic">
                            Receive a gentle spark of wisdom.
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
                            <><Bell className="w-4 h-4" /> ON</>
                          ) : (
                            <><BellOff className="w-4 h-4" /> OFF</>
                          )}
                        </button>
                      </div>
                    </section>

                    <section className={`transition-all duration-700 ${notificationsEnabled ? "opacity-100 translate-y-0" : "opacity-20 pointer-events-none translate-y-4"}`}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60">Inspiration Time</h3>
                        <button 
                          onClick={handleVoiceInput}
                          className={`p-3 rounded-full border border-brand-text/5 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-brand-text hover:text-white'}`}
                          title="Voice Command"
                        >
                          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative group">
                        <input 
                          type="time" 
                          value={reminderTime}
                          onChange={handleTimeChange}
                          className="w-full bg-white border border-brand-text/5 rounded-2xl p-8 text-6xl font-serif text-center focus:outline-none focus:border-brand-text/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        />
                      </div>
                    </section>
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
