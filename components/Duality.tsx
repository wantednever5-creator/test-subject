"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Cpu, Heart, Binary, Sparkles, Fingerprint, Quote, BatteryLow, Flame } from "lucide-react";

// --- HYDRATION SAFE DETERMINISTIC PARTICLES ---
const getParticles = (count: number) => Array.from({ length: count }).map((_, i) => ({
  x: (i * 47) % 100,
  y: (i * 83) % 100,
  duration: 3 + ((i * 13) % 5),
  delay: (i * 7) % 3,
  scale: 0.5 + ((i * 3) % 1.5)
}));

// --- CUTE SHIT: THE LONELY LOGICAL BEAN ---
const SVGLonelyKripton = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full max-w-[300px] md:max-w-[400px] drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] overflow-visible">
    {/* Cold Rain / Data Streams */}
    {[1, 2, 3, 4, 5].map(i => (
      <motion.line key={i} x1={i * 40} y1="-20" x2={i * 40 - 20} y2="220" stroke="#0891B2" strokeWidth="1" strokeDasharray="10, 15"
        animate={{ strokeDashoffset: [0, -100] }} transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.2 }} opacity={0.3} />
    ))}
    
    {/* Floating Clock (11:00 AM Routine) */}
    <motion.g animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <circle cx="160" cy="40" r="15" fill="#0F172A" stroke="#0891B2" strokeWidth="2" />
      <line x1="160" y1="40" x2="160" y2="30" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="40" x2="155" y2="35" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <text x="148" y="70" fill="#38BDF8" fontSize="10" fontFamily="monospace" opacity="0.6">11:00 AM</text>
    </motion.g>

    {/* Low Battery Indicator */}
    <motion.g animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity }} transform="translate(10, 30)">
      <rect x="0" y="0" width="20" height="10" rx="2" fill="none" stroke="#EF4444" strokeWidth="1.5" />
      <rect x="2" y="2" width="4" height="6" rx="1" fill="#EF4444" />
      <rect x="20" y="3" width="2" height="4" fill="#EF4444" />
    </motion.g>

    {/* Purple Bean (Kripton) - Sitting alone, slouched */}
    <motion.g animate={{ y: [0, 3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="85" y="110" width="12" height="30" rx="6" fill="#4C1D95" /> {/* Backpack */}
      <path d="M 80 150 Q 100 160 120 150 L 120 100 C 120 80 80 80 80 100 Z" fill="#6D28D9" /> {/* Slouched Body */}
      <rect x="75" y="100" width="25" height="15" rx="7.5" fill="#1E293B" stroke="#0F172A" strokeWidth="2" /> {/* Dark Visor */}
      {/* Zzz (Sleeping on life) */}
      <motion.text x="110" y="80" fill="#64748B" fontSize="14" fontWeight="bold" animate={{ y: [0, -20], opacity: [1, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>Z</motion.text>
      <motion.text x="125" y="70" fill="#64748B" fontSize="10" fontWeight="bold" animate={{ y: [0, -20], opacity: [1, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}>z</motion.text>
    </motion.g>
  </svg>
);

// --- CUTE SHIT: THE EMPIRE BUILDERS ---
const SVGHumanEmpire = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full max-w-[300px] md:max-w-[400px] drop-shadow-[0_0_40px_rgba(244,114,182,0.6)] overflow-visible">
    {/* Glowing Magic Tree/Aura */}
    <motion.circle cx="100" cy="100" r="80" fill="url(#magicalGlow)" opacity="0.3" animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
    <defs>
      <radialGradient id="magicalGlow">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>

    {/* Purple & Pink Beans Holding Hands */}
    <motion.g animate={{ y: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      {/* Kripton (Purple) */}
      <rect x="50" y="110" width="10" height="25" rx="5" fill="#6D28D9" /> 
      <rect x="60" y="100" width="30" height="40" rx="15" fill="#7C3AED" />
      <rect x="70" y="105" width="15" height="10" rx="5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" />
      
      {/* Floating Crown over Kripton (Empire Building) */}
      <motion.path d="M 65 85 L 70 70 L 75 80 L 80 70 L 85 85 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5"
        animate={{ y: [-3, 3, -3], rotate: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity }} />
      
      {/* Moon (Pink) */}
      <rect x="130" y="110" width="10" height="25" rx="5" fill="#DB2777" />
      <rect x="100" y="100" width="30" height="40" rx="15" fill="#F472B6" />
      <rect x="105" y="105" width="15" height="10" rx="5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" />
      {/* Yellow Flower on Moon */}
      <motion.g animate={{ rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} transform="translate(115, 95)">
        <path d="M 0 0 C -4 -6, 4 -6, 0 0 C 6 -4, 6 4, 0 0 C 4 6, -4 6, 0 0 C -6 4, -6 -4, 0 0 Z" fill="#FDE047" />
      </motion.g>

      {/* Holding Hands (Glowing Heart between them) */}
      <motion.path d="M 95 120 C 95 115 90 115 90 120 C 90 125 95 130 95 130 C 95 130 100 125 100 120 C 100 115 95 115 95 120 Z" fill="#EF4444" 
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity }} />
    </motion.g>

    {/* Floating Fireflies/Stars */}
    {[1, 2, 3, 4, 5].map(i => (
      <motion.circle key={i} cx={40 + i * 25} cy={60 + (i % 2) * 30} r="2" fill="#FEF08A" 
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], y: [-10, -30] }} transition={{ duration: 2 + i * 0.5, repeat: Infinity }} />
    ))}
  </svg>
);

export default function Duality() {
  const [mounted, setMounted] = useState(false);
  const [isLogical, setIsLogical] = useState(true);

  useEffect(() => setMounted(true), []);
  const particles = getParticles(40);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: "easeOut" } }
  };

  return (
    <section className="relative z-10 py-32 px-4 max-w-[100vw] mx-auto min-h-screen flex flex-col items-center justify-center overflow-hidden transition-all duration-[1500ms] ease-in-out" style={{ backgroundColor: isLogical ? "#030712" : "#1a0b2e" }}>
      
      {/* --- CINEMATIC AMBIENT ENGINE --- */}
      <AnimatePresence mode="wait">
        {isLogical ? (
          <motion.div key="bg-logic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0 pointer-events-none">
            {/* Deep Cyber Void */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#030712] to-black"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[1000px] bg-cyan-900/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
            
            {/* Slow Floating Binary (Hydration Safe) */}
            {mounted && particles.map((p, i) => (
              <motion.div key={`bin-${i}`} className="absolute text-cyan-800/30 font-mono text-sm font-bold" style={{ left: `${p.x}%`, top: "-10%" }}
                animate={{ y: ['0vh', '120vh'], opacity: [0, 0.5, 0] }}
                transition={{ duration: p.duration * 3, repeat: Infinity, delay: p.delay, ease: "linear" }}>
                {i % 2 === 0 ? "0" : "1"}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="bg-human" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0 pointer-events-none">
            {/* Breathtaking Magical Nebula (Makoto Shinkai Sky Vibe) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-[#4c0519]/40 via-[#1a0b2e] to-[#050014]"></div>
            <div className="absolute top-0 right-0 w-[80vw] h-[80vw] max-w-[800px] bg-gradient-to-bl from-[#F472B6]/20 to-transparent blur-[120px] rounded-full mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-[100vw] h-[60vw] max-w-[1000px] bg-gradient-to-tr from-[#9333EA]/30 to-transparent blur-[150px] rounded-full mix-blend-screen"></div>
            
            {/* Rising Stardust & Butterflies */}
            {mounted && particles.map((p, i) => (
              <motion.div key={`spark-${i}`} className="absolute rounded-full" 
                style={{ 
                  left: `${p.x}%`, top: `110%`, 
                  width: `${p.scale * 6}px`, height: `${p.scale * 6}px`,
                  backgroundColor: i % 3 === 0 ? "#FDE047" : "#F472B6",
                  boxShadow: `0 0 ${p.scale * 15}px ${i % 3 === 0 ? "#FDE047" : "#F472B6"}`
                }}
                animate={{ 
                  y: ['0vh', '-120vh'], 
                  x: [0, Math.sin(i) * 50, 0], // Gentle swaying
                  opacity: [0, 0.8, 0] 
                }}
                transition={{ duration: p.duration * 4, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 w-full max-w-6xl flex flex-col items-center">
        
        {/* --- THE MASTER INTERACTIVE TOGGLE --- */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
          className="relative flex items-center bg-black/60 border border-white/10 rounded-full p-2 mb-20 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <button 
            onClick={() => setIsLogical(true)}
            className={`relative z-20 flex items-center gap-3 px-6 md:px-10 py-4 md:py-5 rounded-full font-mono text-xs md:text-sm tracking-widest uppercase transition-all duration-500 outline-none ${isLogical ? "text-cyan-200" : "text-white/30 hover:text-white/50"}`}
          >
            <Cpu className="w-4 h-4 md:w-5 md:h-5" /> The Machine
          </button>

          <button 
            onClick={() => setIsLogical(false)}
            className={`relative z-20 flex items-center gap-3 px-6 md:px-10 py-4 md:py-5 rounded-full font-sans font-bold tracking-widest uppercase text-xs md:text-sm transition-all duration-500 outline-none ${!isLogical ? "text-[#F472B6] drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]" : "text-white/30 hover:text-white/50"}`}
          >
            <Heart className="w-4 h-4 md:w-5 md:h-5" /> The Human
          </button>

          {/* Sliding Pill */}
          <motion.div 
            className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-full z-10 border ${isLogical ? "bg-cyan-950/40 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "bg-gradient-to-r from-[#F472B6]/20 to-[#9333EA]/20 border-[#F472B6]/40 shadow-[0_0_30px_rgba(244,114,182,0.4)]"}`}
            initial={false}
            animate={{ x: isLogical ? 6 : "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </motion.div>

        {/* --- THE CINEMATIC SPLIT CONTENT --- */}
        <div className="w-full relative min-h-[600px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            
            {/* LOGICAL STATE (Survival, Sad, Reality) */}
            {isLogical ? (
              <motion.div 
                key="logical-content"
                variants={containerVariants} initial="hidden" animate="show" exit="hidden"
                className="w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24"
              >
                {/* SVG Visual Anchor */}
                <motion.div variants={itemVariants} className="w-full lg:w-1/2 flex justify-center">
                  <SVGLonelyKripton />
                </motion.div>
                
                {/* Text Content */}
                <motion.div variants={itemVariants} className="w-full lg:w-1/2 flex flex-col text-left px-6">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-900/50 bg-cyan-950/20 text-cyan-500 font-mono text-xs uppercase tracking-widest w-fit mb-8">
                    <BatteryLow className="w-4 h-4 animate-pulse" /> System Numb
                  </div>
                  
                  <h3 className="text-4xl md:text-6xl font-mono text-slate-200 mb-10 uppercase tracking-tighter">
                    Surviving Reality
                  </h3>
                  
                  <div className="space-y-6 font-mono text-sm md:text-base text-slate-400 leading-relaxed border-l-2 border-cyan-900/50 pl-6">
                    <p>
                      &gt; Before we met, life was just a loop of surviving the numbness. Wake up at 11 AM, sleep late, and treat everything like a cold calculation. 
                    </p>
                    <p>
                      &gt; I didn't care about studying because passing was easy. I didn't care about people because caring felt like a vulnerability. I viewed human connection as illogical. I pushed people away to stay safe in my own void.
                    </p>
                    <p>
                      &gt; I assumed every person was the exact same. I was just living a clueless, lazy life. I had no purpose, no drive. I was just a machine processing days, completely empty inside.
                    </p>
                  </div>
                </motion.div>
              </motion.div>

            ) : (

              /* HUMAN STATE (The Empire, Magic, Romance) */
              <motion.div 
                key="human-content"
                variants={containerVariants} initial="hidden" animate="show" exit="hidden"
                className="w-full flex flex-col lg:flex-row-reverse items-center justify-center gap-12 lg:gap-24"
              >
                {/* SVG Visual Anchor */}
                <motion.div variants={itemVariants} className="w-full lg:w-1/2 flex justify-center">
                  <SVGHumanEmpire />
                </motion.div>
                
                {/* Text Content */}
                <motion.div variants={itemVariants} className="w-full lg:w-1/2 flex flex-col text-left px-6">
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#F472B6]/40 bg-[#F472B6]/10 text-[#F472B6] font-sans font-bold text-xs uppercase tracking-widest w-fit mb-8 shadow-[0_0_20px_rgba(244,114,182,0.2)] backdrop-blur-md">
                    <Flame className="w-4 h-4 animate-pulse" /> Soul Ignited
                  </div>
                  
                  <h3 className="text-5xl md:text-7xl font-serif font-light text-white mb-10 tracking-tight drop-shadow-lg">
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#d8b4fe] italic">Exception</span>
                  </h3>
                  
                  <div className="space-y-8 font-serif text-xl md:text-2xl text-white/90 leading-relaxed font-light">
                    <p>
                      "And then... I joined that Among Us lobby."
                    </p>
                    <p>
                      "You completely short-circuited my cold logic. For the first time since the 7th grade, I actually felt something profound. You didn't just give me a reason to care; you gave me a beautiful dream to achieve."
                    </p>
                    <p className="text-[#F472B6] italic drop-shadow-sm font-normal">
                      "The guy who couldn't even be bothered to study for his own exams now desperately wants to build an entire empire, just to make sure you get to live like a princess in it."
                    </p>
                  </div>
                </motion.div>
              </motion.div>

            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}