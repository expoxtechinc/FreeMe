/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, getDailyQuote, getRandomQuote } from './lib/quotes';
import { Bell, BellOff, RefreshCw, Settings, X, Check, Copy, Share2 } from 'lucide-react';

export default function App() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(getDailyQuote());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('reminderTime') || '09:00';
  });
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load quote of the day or a random one
  useEffect(() => {
    const daily = getDailyQuote();
    setCurrentQuote(daily);
  }, []);

  const refreshQuote = useCallback(() => {
    setIsQuoteVisible(false);
    setTimeout(() => {
      setCurrentQuote(getRandomQuote());
      setIsQuoteVisible(true);
    }, 500);
  }, []);

  const copyToClipboard = async () => {
    const text = `"${currentQuote.text}" — ${currentQuote.author}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
      } else {
        alert('Please enable notification permissions in your browser to receives reminders.');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
    }
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    localStorage.setItem('reminderTime', newTime);
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      {/* Dynamic Blob Background */}
      <div className="blob-background">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="blob-1" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="blob-2" 
        />
      </div>

      {/* Top Navigation Rail */}
      <header className="relative z-10 flex justify-between items-start p-8 md:p-12">
        <div className="flex flex-col">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-serif italic tracking-tighter mb-1"
          >
            FreeMe
          </motion.h1>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Daily Liberation</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-1">Offline Resilience</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-medium opacity-80">Local Vault Ready</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 btn-outline flex items-center justify-center hover:bg-brand-text hover:text-white border border-brand-text/10"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content: The Quote Focus */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-24">
        <AnimatePresence mode="wait">
          {isQuoteVisible && (
            <motion.div
              key={currentQuote.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl relative"
            >
              {/* Massive Decorative Quote Mark */}
              <span className="text-[160px] md:text-[240px] font-serif leading-none absolute -left-12 md:-left-20 -top-24 md:-top-32 opacity-5 text-brand-accent pointer-events-none select-none">“</span>
              
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.1] mb-12 relative text-brand-text">
                {currentQuote.text.split(' ').map((word, i) => (
                  <span key={i} className={i % 7 === 4 ? "italic" : ""}>{word} </span>
                ))}
              </h2>

              <div className="flex items-center gap-6">
                <div className="w-12 h-px bg-brand-text/20"></div>
                <p className="text-xl md:text-2xl font-serif italic opacity-60">
                  {currentQuote.author}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Controls */}
      <footer className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={refreshQuote}
            className="flex items-center gap-3 px-8 py-5 btn-outline bg-white/50 backdrop-blur-sm group"
          >
            <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-700" />
            <span className="text-xs uppercase tracking-widest font-bold">New Prospect</span>
          </button>
          
          <button 
            onClick={copyToClipboard}
            className="p-5 btn-outline bg-white/50 backdrop-blur-sm"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col items-end">
          <p className="md:hidden text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mb-2">Offline Sync: Active</p>
          <p className="text-[10px] opacity-30 italic font-serif">A sanctuary for the liberated mind • Est 2024</p>
        </div>
      </footer>

      {/* Vertical Decorative Rail */}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0502]/80 backdrop-blur-md"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white p-8 md:p-12 w-full max-w-lg border border-brand-text/5 rounded-[2.5rem] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-serif italic tracking-tight mb-1 text-brand-text">Preferences</h2>
                  <p className="text-[10px] text-brand-text/30 uppercase tracking-[0.2em] font-bold">Tailor your journey</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-10 h-10 btn-outline flex items-center justify-center border border-brand-text/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60 mb-2">Daily Reminders</h3>
                      <p className="text-xs text-brand-text/40 leading-relaxed max-w-[180px] font-serif italic">
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
                  <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-text opacity-60 mb-6">Inspiration Time</h3>
                  <div className="relative group">
                    <input 
                      type="time" 
                      value={reminderTime}
                      onChange={handleTimeChange}
                      className="w-full bg-brand-bg border border-brand-text/5 rounded-2xl p-6 text-4xl font-serif text-center focus:outline-none focus:bg-white focus:border-brand-text/20 transition-all cursor-pointer shadow-inner"
                    />
                  </div>
                </section>

                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-6 btn-primary tracking-[0.2em] uppercase text-[10px] font-bold"
                >
                  Confirm and Return
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical Decorative Rail Left */}
      <div className="fixed left-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-16 pointer-events-none">
        <div className="h-32 w-px bg-brand-text/10"></div>
        <span className="rotate-90 text-[10px] uppercase tracking-[0.5em] font-bold opacity-20 whitespace-nowrap">LOCAL VAULT SYNCED</span>
        <div className="h-32 w-px bg-brand-text/10"></div>
      </div>
    </div>
  );
}
