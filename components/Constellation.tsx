"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Unlock, ShieldCheck, AlertTriangle, Compass, Terminal, Heart, Lock } from "lucide-react";

export default function Constellation() {
  const [unlocked, setUnlocked] = useState(false);
  const [typedKey, setTypedKey] = useState("");
  const [activeStars, setActiveStars] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeLore, setActiveLore] = useState<string>("SECURITY PROTOCOL: Connect memory nodes in chronological order.");
  const [isError, setIsError] = useState(false);
  const secretWord = "moon";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard listener for typing "moon"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const char = e.key.toLowerCase();
      setTypedKey((prev) => {
        const next = (prev + char).slice(-4);
        if (next === secretWord) {
          setUnlocked(true);
        }
        return next;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleStarClick = (id: number, lore: string) => {
    const expectedId = activeStars.length + 1;

    if (id === expectedId) {
      // Correct sequence
      setIsError(false);
      setActiveLore(lore);
      const newStars = [...activeStars, id];
      setActiveStars(newStars);

      if (newStars.length === 6) {
        setTimeout(() => setUnlocked(true), 1200); // Slight delay to admire the completed map
      }
    } else {
      // Wrong sequence! Trigger hard reset
      setIsError(true);
      setActiveLore("ACCESS DENIED: Sequence broken. Memory core resetting to zero...");
      setActiveStars([]);
      setTimeout(() => {
        setIsError(false);
        setActiveLore("SYSTEM WIPED: Start over from Node 01 (Among Us).");
      }, 2000);
    }
  };

  // Safe Close/Reset Function (No Reload Required)
  const handleSealVault = () => {
    setUnlocked(false);
    setTimeout(() => {
      setActiveStars([]);
      setActiveLore("SECURITY PROTOCOL: Connect memory nodes in chronological order.");
    }, 500); // Wait for modal to fade out before wiping the board
  };

  const starsData = [
    { id: 1, x: 15, y: 25, label: "01. Among Us", lore: "LOG 01 DECODED: Private lobbies, hours of talking, no games played." },
    { id: 2, x: 45, y: 15, label: "02. The first picture exchange", lore: "LOG 02 DECODED: The night of the picture exchange and balcony gaze." },
    { id: 3, x: 80, y: 35, label: "03. on my way", lore: "LOG 03 DECODED: Jaipur to Delhi long-distance telemetry." },
    { id: 4, x: 25, y: 75, label: "04. cant handle your cuteness anymore", lore: "LOG 04 DECODED: The logical machine short-circuited by an 'awww'." },
    { id: 5, x: 70, y: 70, label: "05. just come to delhi asap", lore: "LOG 05 DECODED: The upcoming reality of college in Delhi." },
    { id: 6, x: 50, y: 45, label: "06. you are MA MOON foreover", lore: "LOG 06 DECODED: Core Node synchronized. Universal center locked." },
  ];

  return (
    <section className="relative z-10 py-48 px-4 max-w-6xl mx-auto text-center min-h-screen flex flex-col items-center justify-center overflow-hidden">
      
      {/* Deep Space Background Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#9333EA]/20 via-[#050505] to-[#050505]"></div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="relative z-10 mb-14">
        <span className="text-[10px] tracking-[0.5em] uppercase text-[#F472B6] block mb-4 font-mono">Chapter VIII // Chronological Security Lock</span>
        <h2 className="text-5xl md:text-7xl font-light tracking-tight mb-6">The Constellation Map</h2>
        <p className="text-white/50 font-light text-lg md:text-xl max-w-xl mx-auto">
          Connect nodes in the correct chronological order (01 to 06). <span className="text-red-400 font-mono">Wrong clicks reset the system.</span>
        </p>
      </motion.div>

      {/* INTERACTIVE NIGHT SKY OBSERVATORY */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className={`relative w-full max-w-4xl bg-black/90 border rounded-[3.5rem] backdrop-blur-3xl shadow-[0_0_100px_rgba(147,51,234,0.2)] flex flex-col items-center justify-between p-6 md:p-10 transition-colors duration-500 overflow-hidden ${isError ? "border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.4)]" : "border-white/10"}`}
      >
        
        {/* Unified Coordinate Box for Pixel-Perfect Lines */}
        <div className="relative w-full h-[400px] md:h-[500px] mt-4 mb-8 rounded-3xl overflow-visible">
          
          {/* Dynamic Glowing SVG Constellation Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <defs>
              <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {activeStars.length > 1 && starsData.map((star, idx) => {
              if (idx === 0) return null;
              const prevStar = starsData[idx - 1];
              if (activeStars.includes(star.id) && activeStars.includes(prevStar.id)) {
                return (
                  <g key={`line-group-${star.id}`}>
                    {/* The Main Glowing Line */}
                    <motion.line
                      x1={`${prevStar.x}%`} y1={`${prevStar.y}%`}
                      x2={`${star.x}%`} y2={`${star.y}%`}
                      stroke="url(#starGradient)" strokeWidth="3"
                      filter="url(#neonGlow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {/* The Energy Pulse Traveling Down the Line */}
                    <motion.circle r="3" fill="#FFF" filter="url(#neonGlow)">
                      <animateMotion 
                        path={`M ${prevStar.x * (typeof window !== 'undefined' ? window.innerWidth / 100 : 10)} ${prevStar.y * 5} L ${star.x * 10} ${star.y * 5}`} 
                        dur="1s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"
                      />
                    </motion.circle>
                  </g>
                );
              }
              return null;
            })}
          </svg>

          {/* Stars */}
          {starsData.map((star) => {
            const isActive = activeStars.includes(star.id);
            return (
              <div 
                key={star.id}
                onClick={() => handleStarClick(star.id, star.lore)}
                className="absolute cursor-pointer group/star flex flex-col items-center z-20"
                style={{ top: `${star.y}%`, left: `${star.x}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? "bg-gradient-to-tr from-[#9333EA] to-[#F472B6] shadow-[0_0_40px_#F472B6] scale-110" : "bg-white/5 hover:bg-white/15 border border-white/10"}`}>
                  {isActive && <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping"></div>}
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-colors duration-500 ${isActive ? "bg-white shadow-[0_0_20px_#fff]" : "bg-white/40"}`} />
                  <Star className={`absolute w-6 h-6 md:w-7 md:h-7 transition-all duration-500 ${isActive ? "text-white fill-white rotate-180" : "text-white/20"}`} />
                </div>
                <span className={`absolute top-16 md:top-20 whitespace-nowrap text-[11px] md:text-sm tracking-widest uppercase font-mono transition-all duration-400 drop-shadow-md ${isActive ? "text-[#F472B6] opacity-100 font-bold" : "text-white/40 opacity-0 group-hover/star:opacity-100 group-hover/star:-translate-y-1"}`}>
                  {star.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Holographic Telemetry Screen */}
        <div className={`relative z-30 w-full max-w-2xl mx-auto px-6 py-4 rounded-2xl border backdrop-blur-xl flex items-center gap-4 shadow-2xl transition-colors duration-300 ${isError ? "bg-red-950/60 border-red-500/50" : "bg-black/80 border-white/10"}`}>
          {isError ? <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce flex-shrink-0" /> : <Terminal className="w-5 h-5 text-[#F472B6] animate-pulse flex-shrink-0" />}
          <span className={`text-xs md:text-sm font-mono tracking-wide text-left ${isError ? "text-red-200 font-bold" : "text-white/90"}`}>
            {activeLore}
          </span>
        </div>

        {/* Bottom Status bar */}
        <div className="relative z-30 mt-6 px-8 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
          <Compass className={`w-4 h-4 ${isError ? "text-red-400" : "text-[#F472B6] animate-spin"}`} />
          <span className="text-xs font-mono text-white/70 tracking-widest uppercase font-medium">
            Sequence Progress: {activeStars.length} / 6 {activeStars.length === 6 ? "✨ DECRYPTED" : ""}
          </span>
        </div>
      </motion.div>

      {/* Manual Unlock Trigger Button */}
      <motion.button 
        onClick={() => setUnlocked(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-14 px-12 py-5 rounded-full bg-gradient-to-r from-[#9333EA]/20 to-[#F472B6]/20 border border-[#F472B6]/40 text-white font-medium tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(244,114,182,0.2)] backdrop-blur-xl relative overflow-hidden group outline-none"
      >
        <span className="relative z-10 flex items-center gap-3 text-white/60 group-hover:text-white transition-colors">
          <Lock className="w-4 h-4" /> Developer Bypass Override
        </span>
      </motion.button>

      {/* --- THE HOLOGRAPHIC TERMINAL DECRYPTION DECK --- */}
      <AnimatePresence>
        {unlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 40, rotateX: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              className="relative w-full max-w-4xl bg-gradient-to-b from-[#1c0b36] via-[#0b031b] to-[#020105] border-2 border-[#F472B6]/50 p-8 md:p-20 rounded-[3rem] md:rounded-[4rem] shadow-[0_0_150px_rgba(244,114,182,0.4)] text-left overflow-hidden perspective-[1000px] flex flex-col"
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-10"></div>

              <div className="relative z-20 flex-1">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 text-[#F472B6] font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] mb-8">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /> CHRONOLOGICAL SEQUENCE VERIFIED // CORE DECRYPTED
                </motion.div>

                {/* LIVE CIPHER STREAM DECK */}
                <div className="p-5 md:p-8 rounded-3xl bg-black/60 border border-white/10 font-mono text-[10px] md:text-sm text-[#F472B6] mb-8 space-y-2 shadow-inner">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.3 }}>&gt; INITIALIZING SECURE DECRYPTION STREAM...</motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.8 }}>&gt; BYPASSING NODE [01] AMONG US... [OK]</motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 1.3 }}>&gt; SYNCING NODE [02] BALCONY FUMBLE... [OK]</motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="text-white">&gt; ALL 6 TIMELINE VECTORS LOCKED. DISPLAYING CLASSIFIED TRANSMISSION.</motion.p>
                </div>

                <motion.h3 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }} className="text-4xl md:text-6xl font-light mb-8 text-white tracking-tight">
                  To My Moon,
                </motion.h3>

                <div className="space-y-6 text-lg md:text-3xl text-white/90 font-light leading-relaxed font-serif italic">
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}>
                    "You didn't just guess your way through this puzzle. You followed our path from the very beginning—from private lobbies to the exact memories that built us."
                  </motion.p>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.0 }} className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#d8b4fe] font-normal drop-shadow-sm">
                    "Next year, when you finally arrive in Delhi, every single long-distance night, every 4:37 AM text, and every star we aligned will finally collapse into the easiest reality: holding you in my arms."
                  </motion.p>
                </div>
              </div>

              {/* The "Seal Vault & Return" Bottom Action Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.5 }} 
                className="relative z-30 mt-16 pt-8 border-t border-white/10 flex flex-col gap-8 items-center"
              >
                <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-xs font-mono text-white/40 uppercase tracking-widest">
                  <span>Coordinates Locked: Delhi // Jaipur</span>
                  <div className="flex items-center gap-3 text-[#F472B6] bg-[#F472B6]/10 px-6 py-2.5 rounded-full border border-[#F472B6]/30">
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                    <span className="font-semibold text-white">Kripton & Moon</span>
                  </div>
                </div>

                {/* THE MAGICAL RETURN BUTTON (Fixes the Reload Bug) */}
                <button 
                  onClick={handleSealVault}
                  className="w-full md:w-auto px-12 py-5 rounded-2xl bg-white text-black font-bold tracking-widest uppercase text-sm md:text-base hover:bg-[#F472B6] hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(244,114,182,0.6)] flex items-center justify-center gap-3 group outline-none"
                >
                  <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" /> Seal Vault & Return
                </button>
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}