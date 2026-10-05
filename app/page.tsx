"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, AlertCircle } from "lucide-react";

import HeroGroup from "../components/HeroGroup";
import InsideJokes from "../components/InsideJokes";
import Distance from "../components/Distance";
import Duality from "../components/Duality";
import EmotionalReset from "../components/EmotionalReset";
import Constellation from "../components/Constellation";
import BackgroundAudio from "../components/BackgroundAudio";
import Ending from "../components/Ending";

// ==========================================
// 🔒 ENTRANCE CREDENTIALS
// ==========================================
const SECRETS = {
  MOON: { id: "moon", pass: "onegame" },
  KRIPTON: { id: "onegame", pass: "Onegame@1503S" }
};

export default function MasterVault() {
  const [siteUnlocked, setSiteUnlocked] = useState(false);
  const [inputId, setInputId] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [identity, setIdentity] = useState<"Kripton" | "Moon" | null>(null);

  // Force scroll to absolute top of the page when she unlocks the site
  useEffect(() => {
    if (siteUnlocked) {
      window.scrollTo(0, 0);
    }
  }, [siteUnlocked]);

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

  // --- THE STRICT LOGIN LOCKSCREEN ---
  if (!siteUnlocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center p-4 font-sans">
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
            
            <AnimatePresence>
              {loginError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-mono flex items-center justify-center gap-2 pt-2">
                  <AlertCircle className="w-4 h-4" /> Access Denied.
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#F472B6] text-white font-bold tracking-widest uppercase text-sm shadow-lg hover:scale-[1.02] transition-transform">
              Decrypt & Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- THE ASSEMBLED MASTERPIECE (Only visible after login) ---
  return (
    <main className="relative bg-[#050505] text-white selection:bg-[#F472B6]/30 selection:text-[#F472B6] overflow-x-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#9333EA]/5 via-[#050505] to-[#050505]"></div>
      
      <BackgroundAudio />
      
      <div className="relative z-10">
        <HeroGroup />
        <InsideJokes />
        <Distance />
        <Duality />
        <EmotionalReset />
        <Constellation />
        {/* Pass the identity down to Ending so it knows who is logging into the Vault */}
        <Ending identity={identity!} />
      </div>
    </main>
  );
}