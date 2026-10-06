"use client";

import { motion } from "framer-motion";
import { Heart, ArrowDown, Sparkles } from "lucide-react";

// --- CUSTOM SVG ANIMATED AVATARS ---
const KriptonAvatar = ({ delay = 0 }: { delay?: number }) => (
  <motion.div initial={{ x: -150, opacity: 0 }} animate={{ x: 0, opacity: 1, y: [0, -5, 0] }} transition={{ x: { duration: 2, delay, ease: "easeOut" }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }} className="relative w-24 h-32 md:w-32 md:h-40 z-10">
    <div className="absolute inset-0 bg-[#7C3AED] blur-[40px] opacity-30 rounded-full animate-pulse"></div>
    <svg viewBox="0 0 100 120" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(147,51,234,0.5)]">
      <rect x="20" y="20" width="60" height="80" rx="30" fill="#7C3AED" />
      <rect x="5" y="40" width="20" height="40" rx="10" fill="#6D28D9" />
      <motion.rect animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} x="25" y="90" width="20" height="20" rx="10" fill="#7C3AED" />
      <motion.rect animate={{ y: [-5, 0, -5] }} transition={{ duration: 0.5, repeat: Infinity }} x="55" y="90" width="20" height="20" rx="10" fill="#7C3AED" />
      <rect x="40" y="35" width="45" height="25" rx="12" fill="#1F2937" stroke="#111827" strokeWidth="2" />
      <path d="M 45 45 Q 60 55 75 45" stroke="#374151" strokeWidth="3" fill="transparent" strokeLinecap="round" />
    </svg>
  </motion.div>
);

const MoonAvatar = ({ delay = 0 }: { delay?: number }) => (
  <motion.div initial={{ x: 150, opacity: 0 }} animate={{ x: 0, opacity: 1, y: [0, -5, 0] }} transition={{ x: { duration: 2, delay, ease: "easeOut" }, y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 } }} className="relative w-24 h-32 md:w-32 md:h-40 z-10">
    <div className="absolute inset-0 bg-[#F472B6] blur-[40px] opacity-30 rounded-full animate-pulse"></div>
    <svg viewBox="0 0 100 120" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
      <rect x="20" y="20" width="60" height="80" rx="30" fill="#F472B6" />
      <rect x="75" y="40" width="20" height="40" rx="10" fill="#DB2777" />
      <motion.rect animate={{ y: [-5, 0, -5] }} transition={{ duration: 0.5, repeat: Infinity }} x="25" y="90" width="20" height="20" rx="10" fill="#F472B6" />
      <motion.rect animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }} x="55" y="90" width="20" height="20" rx="10" fill="#F472B6" />
      <rect x="15" y="35" width="45" height="25" rx="12" fill="#93C5FD" stroke="#60A5FA" strokeWidth="2" />
      <path d="M 25 42 Q 35 38 45 42" stroke="#FFFFFF" strokeWidth="3" fill="transparent" strokeLinecap="round" opacity="0.6"/>
      <circle cx="65" cy="55" r="5" fill="#BE185D" opacity="0.5" />
      <motion.g animate={{ rotate: [-5, 5, -5], transformOrigin: "50px 25px" }} transition={{ duration: 3, repeat: Infinity }}>
        <path d="M 50 20 C 45 10, 55 10, 50 20 C 60 15, 60 25, 50 20 C 55 30, 45 30, 50 20 C 40 25, 40 15, 50 20 Z" fill="#FDE047" />
        <line x1="50" y1="20" x2="50" y2="25" stroke="#4ADE80" strokeWidth="2" />
      </motion.g>
    </svg>
  </motion.div>
);

export default function HeroGroup() {
  const fadeUp: any = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeOut" } },
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };

  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 z-10 pt-20 pb-32">
        <motion.div className="flex flex-col items-center gap-12 w-full max-w-5xl">
          <div className="flex items-center justify-center relative w-full h-40">
            <div className="absolute left-1/2 -translate-x-[120%]"><KriptonAvatar delay={0.5} /></div>
            <motion.div 
              initial={{ scale: 0, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              transition={{ delay: 2.5, type: "spring", stiffness: 200, damping: 10 }}
              className="absolute left-1/2 -translate-x-1/2 -top-6 md:-top-10 z-20"
            >
              <Heart className="w-8 h-8 md:w-12 md:h-12 text-[#F472B6] fill-[#F472B6] drop-shadow-[0_0_20px_rgba(244,114,182,0.8)] animate-pulse" />
            </motion.div>
            <div className="absolute left-1/2 translate-x-[20%]"><MoonAvatar delay={0.5} /></div>
          </div>

          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="text-center mt-12">
            <motion.p variants={fadeUp} className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/40 mb-6">Kripton & Moon</motion.p>
            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-[#F472B6] to-[#9333EA] pb-2 leading-none drop-shadow-2xl">
              MA MOON!!!!
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-8 text-lg md:text-xl font-light text-white/50 italic font-serif">
              "It's more difficult to handle for me than your 'awww'"
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} className="absolute bottom-10 animate-bounce">
            <ArrowDown className="w-6 h-6 md:w-8 md:h-8 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      <section className="relative z-10 py-32 px-6 max-w-5xl mx-auto min-h-screen flex items-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="flex flex-col gap-16 w-full">
          <div className="text-center">
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#F472B6] block mb-4">Chapter I</span>
            <h2 className="text-4xl md:text-6xl font-light">The Greatest Lie</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} className="space-y-8 text-lg md:text-xl text-white/70 font-light leading-relaxed">
              <p>It started on Among Us. I was Kripton, you were Moon. Private lobbies, hours of talking, no games played. I took a long time to say it, but when I finally said 'I love you', everything changed.</p>
              <p>Then the guilt hit you. You confessed you weren't in 11th grade, but 10th. You thought I'd be furious.</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="bg-white/[0.02] border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group hover:border-[#F472B6]/30 transition-colors duration-700 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F472B6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Sparkles className="w-8 h-8 text-[#F472B6] mb-6 relative z-10" />
              <p className="text-white/90 italic font-serif text-xl md:text-2xl leading-relaxed relative z-10">
                "I acted like I was offended at first, but honestly? I couldn't be mad. You are too cute. It was just a human mistake, and the lie just blended in. You fixed it by telling me the truth."
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  );
}