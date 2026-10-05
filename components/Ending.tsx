"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, KeyRound } from "lucide-react";
import WhatsAppVault from "./WhatsAppVault";

// ==========================================
// 🔒 ENTRANCE CREDENTIALS
// ==========================================
const SECRETS = {
  MOON: { id: "moon", pass: "17thbirthday" },
  KRIPTON: { id: "kripton", pass: "bossman" }
};

const SVGCakeScene = ({ onOpenVault }: { onOpenVault: () => void }) => {
  const [candleBlown, setCandleBlown] = useState(false);

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[420px] bg-black/50 border border-white/10 rounded-[3.5rem] backdrop-blur-2xl flex flex-col items-center justify-end pb-12 overflow-visible shadow-[0_0_60px_rgba(147,51,234,0.25)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9333EA]/20 via-transparent to-transparent pointer-events-none rounded-[3.5rem]"></div>

      <div className="relative w-full flex items-end justify-center px-8 gap-8 md:gap-20 z-20 mt-12">
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {candleBlown && (
              <motion.div 
                initial={{ opacity: 0, scale: 0, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute -top-32 left-0 w-60 md:w-72 bg-white text-black p-4 rounded-2xl rounded-bl-none shadow-2xl text-left z-40"
              >
                <p className="font-semibold text-xs md:text-sm leading-relaxed">
                  "Happy 17th Birthday, Moon! Here is your final gift..."
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <svg viewBox="0 0 100 120" className="w-[110px] md:w-[140px] drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]">
            <rect x="10" y="40" width="15" height="40" rx="7.5" fill="#6D28D9" />
            <rect x="20" y="20" width="55" height="70" rx="27.5" fill="#7C3AED" />
            <rect x="45" y="40" width="45" height="25" rx="12.5" fill="#1F2937" stroke="#111827" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative flex flex-col items-center z-30">
          <div className="relative w-8 h-16 flex flex-col items-center -mb-2 z-40">
            {!candleBlown ? (
              <motion.div 
                className="w-5 h-9 bg-gradient-to-t from-orange-500 via-yellow-300 to-white rounded-[50%] cursor-pointer shadow-[0_0_25px_#FDE047]"
                animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }} transition={{ duration: 0.4, repeat: Infinity }}
                onClick={() => setCandleBlown(true)}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -40, scale: 2 }} transition={{ duration: 2 }}
                className="w-3 h-3 bg-white/50 blur-sm rounded-full absolute top-0"
              />
            )}
            <div className="w-1.5 h-8 bg-white rounded-sm mt-1"></div>
          </div>

          <div className="flex flex-col items-center cursor-pointer" onClick={() => !candleBlown && setCandleBlown(true)}>
            <div className="w-20 h-9 bg-gradient-to-b from-[#FDE047] to-[#CA8A04] rounded-t-lg"></div>
            <div className="w-28 h-12 bg-gradient-to-b from-[#F472B6] to-[#BE185D] rounded-t-md"></div>
            <div className="w-36 h-14 bg-gradient-to-b from-[#9333EA] to-[#581C87] rounded-t-md rounded-b-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-widest">17</span>
            </div>
          </div>

          {!candleBlown && (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -bottom-10 text-[11px] md:text-xs font-mono text-[#FDE047] uppercase tracking-widest whitespace-nowrap">
              Click flame to blow candle
            </motion.p>
          )}
        </div>

        <div className="relative flex flex-col items-center">
          <svg viewBox="0 0 100 120" className="w-[110px] md:w-[140px] drop-shadow-[0_0_20px_rgba(244,114,182,0.5)]">
            <rect x="75" y="40" width="15" height="40" rx="7.5" fill="#DB2777" />
            <rect x="25" y="20" width="55" height="70" rx="27.5" fill="#F472B6" />
            <rect x="10" y="40" width="45" height="25" rx="12.5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" />
            <g transform="translate(60, 10)">
              <path d="M 0 0 C -8 -12, 8 -12, 0 0 C 12 -8, 12 8, 0 0 C 8 12, -8 12, 0 0 C -12 8, -12 -8, 0 0 Z" fill="#FDE047" />
            </g>
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {candleBlown && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 z-40">
            <button 
              onClick={onOpenVault}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-[#9333EA] to-[#F472B6] text-white font-bold tracking-widest uppercase text-xs md:text-sm shadow-[0_0_30px_rgba(244,114,182,0.7)] hover:scale-105 transition-transform"
            >
              🔓 Open Our Secret Chat Vault
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Ending() {
  const [siteUnlocked, setSiteUnlocked] = useState(false);
  const [inputId, setInputId] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [identity, setIdentity] = useState<"Kripton" | "Moon" | null>(null);
  const [showVault, setShowVault] = useState(false);

  const handleSiteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    if (inputId.toLowerCase() === SECRETS.MOON.id && inputPass === SECRETS.MOON.pass) {
      setIdentity("Moon");
      setSiteUnlocked(true);
    } else if (inputId.toLowerCase() === SECRETS.KRIPTON.id && inputPass === SECRETS.KRIPTON.pass) {
      setIdentity("Kripton");
      setSiteUnlocked(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const fadeUp: any = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeOut" } },
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };

  // --- STRICT ENTRANCE LOGIN LOCKSCREEN (No persistent storage, strictly secure) ---
  if (!siteUnlocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0B141A] rounded-3xl p-8 border border-white/10 shadow-[0_0_60px_rgba(147,51,234,0.3)] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9333EA]/10 via-transparent to-transparent pointer-events-none"></div>
          
          <KeyRound className="w-12 h-12 text-[#9333EA] mx-auto mb-4 animate-pulse relative z-10" />
          <h2 className="text-white text-2xl font-light tracking-widest uppercase mb-2 relative z-10">Secure Gateway</h2>
          <p className="text-white/40 text-xs font-mono mb-8 relative z-10">Enter Credentials to Unlock Domain</p>
          
          <form onSubmit={handleSiteLogin} className="space-y-4 relative z-10">
            <input 
              type="text" 
              value={inputId} 
              onChange={(e) => setInputId(e.target.value)} 
              placeholder="Identification (ID)"
              className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F472B6] font-mono" 
            />
            <input 
              type="password" 
              value={inputPass} 
              onChange={(e) => setInputPass(e.target.value)} 
              placeholder="Passcode"
              className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F472B6] font-mono tracking-widest" 
            />
            {loginError && <p className="text-red-400 text-xs font-mono text-left">Access Denied. Check credentials.</p>}
            <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#F472B6] text-white font-bold tracking-widest uppercase text-sm shadow-lg">
              Decrypt & Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

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

        {/* THE SYNCED SIGN-OFF */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 text-base md:text-lg font-light text-white/80 bg-white/[0.02] border border-white/5 backdrop-blur-2xl p-10 rounded-[2rem] w-full max-w-md mx-auto shadow-2xl relative overflow-hidden group hover:border-[#F472B6]/30 transition-all duration-700">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#F472B6] to-transparent"></div>
          <Smile className="w-10 h-10 text-[#F472B6] mb-4 group-hover:scale-110 transition-transform duration-500" />
          <p className="tracking-widest">take care and stay happy always</p>
          <p className="text-[#F472B6] font-medium tracking-widest">with all my love ❤</p>
          <p className="tracking-widest text-white/50 mt-2">peace out ✌🏻</p>
        </motion.div>

        {/* THE INTERACTIVE CAKE CUT SCENE */}
        <motion.div variants={fadeUp} className="w-full mt-24">
          <SVGCakeScene onOpenVault={() => setShowVault(true)} />
        </motion.div>

      </motion.div>

      {/* --- FULL-SCREEN WHATSAPP VAULT MODAL --- */}
      <AnimatePresence>
        {showVault && identity && (
          <WhatsAppVault identity={identity} onClose={() => setShowVault(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}