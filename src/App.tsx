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
    <div className="relative h-screen w-screen flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-white/20">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none atmosphere overflow-hidden -z-10" />

      {/* Main Content */}
      <main className="relative w-full max-w-4xl flex flex-col items-center">
        <header className="absolute top-[-12vh] md:top-[-15vh] flex items-center justify-center w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl md:text-5xl font-serif italic tracking-[0.3em] text-white/40 mb-2">FREE ME</h1>
            <div className="h-px w-12 bg-white/20" />
          </motion.div>
        </header>

        <div className="w-full flex flex-col items-center gap-12">
          <AnimatePresence mode="wait">
            {isQuoteVisible && (
              <motion.div
                key={currentQuote.id}
                initial={{ opacity: 0, filter: 'blur(20px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(20px)', y: -20 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-center flex flex-col items-center justify-center min-h-[40vh]"
              >
                <blockquote className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.15] mb-12 text-glow max-w-3xl">
                  "{currentQuote.text}"
                </blockquote>
                <cite className="font-sans text-xs md:text-sm uppercase tracking-[0.4em] text-white/40 not-italic border-t border-white/10 pt-6">
                  — {currentQuote.author}
                </cite>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="flex items-center gap-6">
            <button 
              onClick={refreshQuote}
              className="p-5 glass-panel hover:bg-white/20 transition-all duration-300 group hover:scale-110"
              title="Seek Inspiration"
            >
              <RefreshCw className="w-5 h-5 text-white/60 group-active:rotate-180 transition-transform duration-700" />
            </button>
            
            <button 
              onClick={copyToClipboard}
              className="p-5 glass-panel hover:bg-white/20 transition-all duration-300 group hover:scale-110 relative"
              title="Copy Spark"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Check className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Copy className="w-5 h-5 text-white/60" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-5 glass-panel hover:bg-white/20 transition-all duration-300 group hover:scale-110"
              title="Mindfulness Settings"
            >
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </footer>
        </div>
      </main>

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
              className="glass-panel p-8 md:p-12 w-full max-w-lg border-white/5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-2xl font-serif italic tracking-wider mb-1">Preferences</h2>
                  <p className="text-xs text-white/30 uppercase tracking-widest">Tailor your journey</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-3 hover:bg-white/5 rounded-full transition-colors border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-sans font-medium tracking-widest uppercase text-white/80 mb-2">Daily Reminders</h3>
                      <p className="text-xs text-white/30 leading-relaxed max-w-[200px]">
                        Receive a gentle spark of wisdom every day.
                      </p>
                    </div>
                    <button 
                      onClick={toggleNotifications}
                      className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-500 font-medium tracking-wide ${
                        notificationsEnabled 
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                        : "border-white/10 text-white/40 hover:border-white/30"
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
                  <h3 className="text-sm font-sans font-medium tracking-widest uppercase text-white/80 mb-6">Inspiration Time</h3>
                  <div className="relative group">
                    <input 
                      type="time" 
                      value={reminderTime}
                      onChange={handleTimeChange}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-4xl font-serif text-center focus:outline-none focus:bg-white/[0.07] focus:border-white/20 transition-all cursor-pointer"
                    />
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/0 group-hover:border-white/5 transition-colors" />
                  </div>
                </section>

                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-5 rounded-2xl bg-white text-black font-semibold tracking-widest uppercase text-xs hover:bg-white/90 transition-all active:scale-[0.98] shadow-xl"
                >
                  Save and Return
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Elements */}
      <div className="fixed inset-x-0 bottom-12 flex justify-center pointer-events-none">
        <p className="text-[9px] uppercase tracking-[0.8em] text-white/10 font-sans">
          MIND OVER MATTER • MOMENT BY MOMENT
        </p>
      </div>

      <div className="fixed right-12 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none">
        <p className="writing-mode-vertical-rl rotate-180 text-[10px] uppercase tracking-[1.5em] text-white/[0.07] font-sans">
          FREE YOUR MIND
        </p>
      </div>
      <div className="fixed left-12 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none">
        <p className="writing-mode-vertical-rl text-[10px] uppercase tracking-[1.5em] text-white/[0.07] font-sans">
          LIMITLESS POTENTIAL
        </p>
      </div>
    </div>
  );
}
