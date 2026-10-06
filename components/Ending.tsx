"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Gift } from "lucide-react";
import WhatsAppVault from "./WhatsAppVault"; 

// --- THE CINEMATIC CAKE SCENE ---
const SVGCakeScene = ({ onOpenVault }: { onOpenVault: () => void }) => {
  const [seqStep, setSeqStep] = useState(0); 

  useEffect(() => {
    if (seqStep === 2) setTimeout(() => setSeqStep(3), 1500); 
    if (seqStep === 3) setTimeout(() => setSeqStep(4), 1500); 
    if (seqStep === 4) setTimeout(() => setSeqStep(5), 1500); 
    if (seqStep === 5) setTimeout(() => setSeqStep(6), 4000); 
    if (seqStep === 6) setTimeout(() => setSeqStep(7), 3000); 
  }, [seqStep]);

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[600px] flex items-end justify-center pb-20 mt-12 bg-black/20 border border-white/5 rounded-[3.5rem] shadow-[0_0_60px_rgba(147,51,234,0.1)] overflow-hidden">
      
      {/* INITIAL TRIGGER BUTTON */}
      <AnimatePresence>
        {seqStep === 0 && (
          <motion.button
            initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 50 }}
            onClick={() => setSeqStep(1)}
            className="absolute z-[9999] px-8 py-4 bg-gradient-to-tr from-[#9333EA] to-[#F472B6] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(244,114,182,0.6)] outline-none group hover:shadow-[0_0_50px_rgba(244,114,182,0.9)] transition-shadow text-white font-bold tracking-widest uppercase text-sm"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            Light The Candle
          </motion.button>
        )}
      </AnimatePresence>

      {/* MOON (Standing by the cake) */}
      <AnimatePresence>
        {seqStep >= 1 && (
          <motion.div className="absolute bottom-10 right-[10%] md:right-[20%] z-20"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}
          >
            <svg viewBox="0 0 100 120" className="w-[120px] md:w-[160px] drop-shadow-[0_0_20px_rgba(244,114,182,0.5)]">
              <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <rect x="75" y="40" width="15" height="40" rx="7.5" fill="#DB2777" />
                <rect x="25" y="20" width="55" height="70" rx="27.5" fill="#F472B6" />
                <rect x="10" y="40" width="45" height="25" rx="12.5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" />
                <path d="M 20 48 Q 30 43 40 48" stroke="#FFFFFF" strokeWidth="3" fill="transparent" strokeLinecap="round" opacity="0.6"/>
                <motion.g animate={{ rotate: [-5, 10, -5] }} transition={{ duration: 2.5, repeat: Infinity }} transform="translate(60, 10)">
                  <path d="M 0 0 C -8 -12, 8 -12, 0 0 C 12 -8, 12 8, 0 0 C 8 12, -8 12, 0 0 C -12 8, -12 -8, 0 0 Z" fill="#FDE047" />
                  <circle cx="0" cy="0" r="3" fill="#CA8A04" />
                </motion.g>
              </motion.g>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE CAKE */}
      <AnimatePresence>
        {seqStep >= 1 && (
          <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}
          >
            {/* The Interactive Candle/Flame */}
            <div className="relative w-12 h-20 flex flex-col items-center -mb-2 z-40">
              <AnimatePresence>
                {seqStep === 1 && (
                  <motion.div 
                    exit={{ opacity: 0, scale: 0, y: -20 }}
                    className="w-6 h-10 bg-gradient-to-t from-orange-500 via-yellow-300 to-white rounded-[50%_50%_50%_50%/60%_60%_40%_40%] cursor-pointer shadow-[0_0_30px_#FDE047]"
                    animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }} transition={{ duration: 0.5, repeat: Infinity }}
                    onClick={() => setSeqStep(2)} // BLOW OUT CANDLE
                  />
                )}
              </AnimatePresence>
              {/* Smoke Effect when blown */}
              {seqStep >= 2 && (
                <motion.div 
                  initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -100, scale: 3, x: [-10, 10, -20] }} transition={{ duration: 3, ease: "easeOut" }}
                  className="w-4 h-4 bg-white/40 blur-md rounded-full absolute top-0"
                />
              )}
              <div className="w-2 h-10 bg-gradient-to-b from-white to-gray-300 rounded-sm mt-1"></div>
            </div>

            {/* 3-Tier Cake Body */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-12 bg-gradient-to-b from-[#FDE047] to-[#CA8A04] rounded-t-xl rounded-b-md border-b border-black/20 shadow-[0_-5px_20px_rgba(253,224,71,0.4)]"></div>
              <div className="w-32 h-14 bg-gradient-to-b from-[#F472B6] to-[#BE185D] rounded-t-md rounded-b-md border-b border-black/20 shadow-[0_-5px_20px_rgba(244,114,182,0.4)]"></div>
              <div className="w-44 h-16 bg-gradient-to-b from-[#9333EA] to-[#581C87] rounded-t-md rounded-b-2xl shadow-[0_10px_30px_rgba(147,51,234,0.6)] flex items-center justify-center">
                <span className="text-white/80 font-bold tracking-widest text-sm">17</span>
              </div>
            </div>
            
            {seqStep === 1 && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -bottom-16 w-64 text-center">
                <p className="text-[#FDE047] font-mono text-sm tracking-widest uppercase drop-shadow-[0_0_10px_#FDE047]">Make a wish & tap the flame</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onegame (Enters from left, claps) */}
      <AnimatePresence>
        {seqStep >= 3 && (
          <motion.div className="absolute bottom-10 left-[5%] md:left-[15%] z-20"
            initial={{ x: "-100vw", opacity: 0 }}
            animate={{ 
              x: 0, opacity: 1,
              y: seqStep >= 4 ? [0, -30, 0, -20, 0] : 0 
            }} 
            transition={{ 
              x: { type: "spring", stiffness: 60, damping: 15 },
              y: { duration: 1, repeat: seqStep === 4 ? Infinity : 0 }
            }}
          >
            <svg viewBox="0 0 100 120" className="w-[120px] md:w-[160px] drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]">
              <rect x="10" y="40" width="15" height="40" rx="7.5" fill="#6D28D9" />
              <rect x="20" y="20" width="55" height="70" rx="27.5" fill="#7C3AED" />
              <rect x="45" y="40" width="45" height="25" rx="12.5" fill="#1F2937" stroke="#111827" strokeWidth="2" />
              <path d="M 55 50 Q 65 60 75 50" stroke="#4B5563" strokeWidth="3" fill="transparent" strokeLinecap="round" />
            </svg>

            {/* Clapping Sparkles */}
            {seqStep === 4 && (
              <>
                <motion.div animate={{ scale: [0, 1.5, 0], y: -50, x: -20 }} transition={{ duration: 0.5, repeat: Infinity }} className="absolute top-10 right-0 w-4 h-4 bg-yellow-300 rounded-full blur-[2px]" />
                <motion.div animate={{ scale: [0, 1.5, 0], y: -30, x: 30 }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} className="absolute top-10 right-0 w-3 h-3 bg-pink-400 rounded-full blur-[2px]" />
              </>
            )}

            {/* The Chat Bubbles */}
            <AnimatePresence>
              {seqStep >= 5 && seqStep <= 7 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0, originX: 0, originY: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                  className="absolute bottom-[110%] left-[80%] w-64 md:w-80 bg-white rounded-2xl rounded-bl-none p-5 shadow-[0_10px_40px_rgba(255,255,255,0.2)] z-50"
                >
                  <p className="text-black font-semibold text-lg md:text-xl">
                    {seqStep === 5 ? "Happy 17th Birthday! 🎉" : "A gift for you.. won't you see what it is?"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE FINAL GIFT TRIGGER -> OPENS VAULT */}
      <AnimatePresence>
        {seqStep >= 7 && (
          <motion.div 
            initial={{ opacity: 0, y: -100, scale: 0 }} animate={{ opacity: 1, y: -250, scale: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 cursor-pointer group"
            onClick={onOpenVault}
          >
            <div className="w-24 h-24 bg-gradient-to-tr from-[#9333EA] to-[#F472B6] rounded-xl flex items-center justify-center shadow-[0_0_50px_rgba(244,114,182,0.8)] border border-white/40 group-hover:scale-110 transition-transform duration-300">
              <Gift className="w-12 h-12 text-white animate-pulse" />
              <div className="absolute -inset-4 bg-white/20 rounded-xl blur-xl group-hover:bg-white/40 transition-colors"></div>
            </div>
            <p className="text-white font-mono text-center mt-6 tracking-widest uppercase animate-bounce drop-shadow-[0_0_10px_#fff]">Click to Open</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Ending({ identity }: { identity: string }) {
  const [showVault, setShowVault] = useState(false);

  const fadeUp: any = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeOut" } },
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };

  return (
    <section className="relative z-10 py-32 px-4 flex flex-col items-center text-center max-w-4xl mx-auto min-h-screen justify-center">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="w-full">
        
        <motion.div variants={fadeUp} className="relative mb-24 group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9333EA] to-[#F472B6] blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-1000 rounded-full"></div>
          <p className="text-sm tracking-[0.5em] uppercase text-white/50 mb-6">Welcome to Adulthood</p>
          <h3 className="relative text-6xl md:text-8xl font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-[#F472B6] to-[#9333EA] leading-tight py-4 px-2">
            Happy <br/> 17th BIRTHDAY
          </h3>
          <p className="mt-8 text-sm tracking-[0.5em] uppercase text-white/40">October 4th, 2026</p>
        </motion.div>

        <motion.p variants={fadeUp} className="text-xl md:text-2xl font-light text-white/60 leading-relaxed max-w-2xl mx-auto mb-20 italic">
          "I already have the best girlfriend I could possibly ever have in any imaginable or real universe. Have a bright smile over your beautiful face and just go on with your day."
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 text-base md:text-lg font-light text-white/80 bg-white/[0.02] border border-white/5 backdrop-blur-2xl p-10 rounded-[2rem] w-full max-w-md mx-auto shadow-2xl relative overflow-hidden group hover:border-[#F472B6]/30 transition-all duration-700">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#F472B6] to-transparent"></div>
          <Smile className="w-10 h-10 text-[#F472B6] mb-4 group-hover:scale-110 transition-transform duration-500" />
          <p className="tracking-widest">take care and stay happy always</p>
          <p className="text-[#F472B6] font-medium tracking-widest">with all my love ❤</p>
          <p className="tracking-widest text-white/50 mt-2">peace out ✌🏻</p>
        </motion.div>

        {/* THE INTERACTIVE CAKE CUT SCENE */}
        <motion.div variants={fadeUp} className="w-full mt-10">
          <SVGCakeScene onOpenVault={() => setShowVault(true)} />
        </motion.div>

      </motion.div>

      {/* --- FULL-SCREEN WHATSAPP VAULT MODAL --- */}
      <AnimatePresence>
        {showVault && (
          <WhatsAppVault identity={identity} onClose={() => setShowVault(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}