"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";
import { 
  CloudRain, Heart, Infinity as InfinityIcon, LockKeyhole, Terminal, Fingerprint, 
  Music, Satellite, Orbit, Moon, HeartPulse, Flame, Crown, Globe, Camera, Eye, PhoneCall, Shield
} from "lucide-react";

// --- HYDRATION SAFE DETERMINISTIC GENERATOR ---
const getDeterministicArray = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    x: (i * 37) % 100,
    y: (i * 73) % 100,
    duration: 2 + ((i * 11) % 4),
    delay: (i * 13) % 3,
    size: 1 + ((i * 7) % 3)
  }));
};

// --- BESPOKE ANIMATED SVGS ("THE CUTE SHIT") ---

const SVGAAmongUs = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]">
    {/* Purple Bean (Onegame) */}
    <motion.g animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="10" y="50" width="12" height="25" rx="6" fill="#6D28D9" /> 
      <rect x="20" y="40" width="35" height="45" rx="15" fill="#7C3AED" /> 
      <rect x="30" y="45" width="20" height="12" rx="5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" /> 
    </motion.g>
    {/* Pink Bean (Moon) */}
    <motion.g animate={{ y: [3, -3, 3], rotate: [2, -2, 2] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="78" y="50" width="12" height="25" rx="6" fill="#DB2777" />
      <rect x="45" y="40" width="35" height="45" rx="15" fill="#F472B6" />
      <rect x="50" y="45" width="20" height="12" rx="5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" />
      {/* Yellow Flower */}
      <motion.g animate={{ rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }} transform="translate(62, 35)">
        <path d="M 0 0 C -5 -8, 5 -8, 0 0 C 8 -5, 8 5, 0 0 C 5 8, -5 8, 0 0 C -8 5, -8 -5, 0 0 Z" fill="#FDE047" />
      </motion.g>
    </motion.g>
    {/* Floating Heart between them */}
    <motion.path d="M 50 25 C 50 15 40 15 40 25 C 40 35 50 45 50 45 C 50 45 60 35 60 25 C 60 15 50 15 50 25 Z" fill="#F472B6" 
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} transform="scale(0.5) translate(50, 0)" 
    />
  </svg>
);

const SVGCosmicStar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
    <motion.path d="M 50 10 L 55 45 L 90 50 L 55 55 L 50 90 L 45 55 L 10 50 L 45 45 Z" fill="#7DD3FC"
      animate={{ rotate: 360, scale: [0.9, 1.1, 0.9] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    />
    <motion.circle cx="50" cy="50" r="10" fill="#FFF" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
    {[1, 2, 3, 4].map(i => (
      <motion.circle key={i} cx="50" cy="50" r="2" fill="#E0F2FE" 
        animate={{ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, opacity: [1, 0] }} 
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} 
      />
    ))}
  </svg>
);

const SVGProphetMoon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(253,224,71,0.5)]">
    <motion.path d="M 60 15 A 35 35 0 1 0 85 75 A 45 45 0 1 1 60 15" fill="#FDE047" 
      animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
    />
    <motion.g animate={{ y: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <circle cx="35" cy="70" r="6" fill="#9333EA" />
      <path d="M 28 90 L 35 75 L 42 80 L 38 90 Z" fill="#9333EA" />
      <path d="M 35 75 L 52 65 L 45 80" stroke="#A855F7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </motion.g>
    <motion.circle cx="30" cy="20" r="2" fill="#FFF" animate={{ scale: [0, 1.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="80" cy="30" r="3" fill="#FFF" animate={{ scale: [0, 1.5, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} />
  </svg>
);

const SVGMusicVibe = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
    <rect x="20" y="30" width="60" height="40" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="3" />
    <rect x="30" y="40" width="40" height="20" rx="3" fill="#0F172A" />
    <circle cx="40" cy="50" r="5" fill="#FCA5A5" />
    <circle cx="60" cy="50" r="5" fill="#FCA5A5" />
    <line x1="45" y1="50" x2="55" y2="50" stroke="#64748B" strokeWidth="2" />
    <motion.g animate={{ y: [-5, -15], x: [0, 10], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }}>
      <path d="M 70 25 L 70 15 L 80 15 L 80 20 L 72 20 L 72 25 Z" fill="#F472B6" />
      <circle cx="68" cy="26" r="3" fill="#F472B6" />
    </motion.g>
    <motion.g animate={{ y: [-5, -20], x: [0, -10], opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}>
      <path d="M 30 20 L 30 10 L 40 10 L 40 15 L 32 15 L 32 20 Z" fill="#9333EA" />
      <circle cx="28" cy="21" r="3" fill="#9333EA" />
    </motion.g>
  </svg>
);

const SVGCuteShyMoon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(244,114,182,0.6)]">
    {/* Base Moon */}
    <path d="M 60 20 A 30 30 0 1 0 80 70 A 40 40 0 1 1 60 20" fill="#FEF08A" />
    {/* Kawaii Eyes */}
    <circle cx="45" cy="45" r="3" fill="#451A03" />
    <circle cx="65" cy="45" r="3" fill="#451A03" />
    {/* Shy blush lines */}
    <line x1="42" y1="50" x2="48" y2="50" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
    <line x1="62" y1="50" x2="68" y2="50" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
    {/* Fluffy Pink Cloud pulling up to hide */}
    <motion.path d="M 15 85 Q 25 65 45 70 Q 60 60 75 75 Q 95 90 75 95 L 25 95 Z" fill="#FBCFE8"
      animate={{ y: [-2, -10, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
    <motion.path d="M 25 80 Q 40 70 50 75 Q 65 65 80 80 Q 90 95 70 100 L 20 100 Z" fill="#F472B6" opacity="0.8"
      animate={{ y: [-1, -6, -1] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
  </svg>
);

const SVGSiberianBird = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
    <motion.g animate={{ y: [-5, 5, -5], rotate: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      {/* Origami Bird Body */}
      <path d="M 20 60 L 50 30 L 80 50 L 50 45 Z" fill="#C084FC" />
      {/* Origami Bird Wing */}
      <motion.path d="M 50 45 L 80 50 L 60 10 Z" fill="#E879F9" 
        animate={{ d: ["M 50 45 L 80 50 L 60 10 Z", "M 50 45 L 80 50 L 60 30 Z", "M 50 45 L 80 50 L 60 10 Z"] }} 
        transition={{ duration: 0.5, repeat: Infinity }} 
      />
    </motion.g>
    {/* Trailing Stardust */}
    {[1, 2, 3].map(i => (
      <motion.circle key={i} cx={20 - i * 10} cy={65 + i * 5} r="2" fill="#F472B6" 
        animate={{ opacity: [1, 0], scale: [1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} 
      />
    ))}
  </svg>
);

const SVGTacticsGame = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">
    {/* Retro Gameboy */}
    <rect x="25" y="10" width="50" height="80" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="3" />
    {/* Screen */}
    <rect x="32" y="20" width="36" height="30" rx="3" fill="#0F172A" />
    {/* D-Pad */}
    <path d="M 32 65 h 6 v -6 h 4 v 6 h 6 v 4 h -6 v 6 h -4 v -6 h -6 z" fill="#64748B" />
    {/* Buttons */}
    <circle cx="68" cy="62" r="4" fill="#EF4444" />
    <circle cx="58" cy="72" r="4" fill="#3B82F6" />
    {/* Screen Content - Glowing Heart Popping Out */}
    <motion.g animate={{ scale: [1, 1.4, 1], y: [0, -5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
      <path d="M 50 28 C 50 22 42 22 42 28 C 42 36 50 44 50 44 C 50 44 58 36 58 28 C 58 22 50 22 50 28 Z" fill="#F472B6" />
    </motion.g>
    <motion.text x="35" y="42" fill="#FDE047" fontSize="5" fontFamily="monospace" fontWeight="bold"
       animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>YOU WIN</motion.text>
  </svg>
);

const SVGSupernova = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" style={{ mixBlendMode: "screen" }}>
    <motion.circle cx="50" cy="50" r="15" fill="#9333EA" animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="50" cy="50" r="10" fill="#F472B6" animate={{ scale: [1, 2, 1], opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
    <circle cx="50" cy="50" r="5" fill="#FFF" />
    <motion.ellipse cx="50" cy="50" rx="35" ry="10" stroke="#F472B6" strokeWidth="2" fill="none" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
    <motion.ellipse cx="50" cy="50" rx="35" ry="10" stroke="#9333EA" strokeWidth="2" fill="none" animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
    <motion.line x1="10" y1="10" x2="40" y2="40" stroke="#FFF" strokeWidth="2" strokeLinecap="round" animate={{ strokeDasharray: ["0, 100", "50, 50", "0, 100"], strokeDashoffset: [0, -50] }} transition={{ duration: 1.5, repeat: Infinity }} />
    <motion.line x1="90" y1="90" x2="60" y2="60" stroke="#FFF" strokeWidth="2" strokeLinecap="round" animate={{ strokeDasharray: ["0, 100", "50, 50", "0, 100"], strokeDashoffset: [0, -50] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }} />
  </svg>
);


// --- THE SHOULDER CARTOON (Final Climax) ---
const ShoulderCartoon = ({ isCrying }: { isCrying: boolean }) => {
  const rainDrops = getDeterministicArray(15);

  return (
    <div className="relative w-full max-w-[300px] h-[200px] mx-auto mb-12 flex items-center justify-center">
      <motion.div 
        initial={false} animate={{ scale: isCrying ? 0 : 1.2, opacity: isCrying ? 0 : 0.8 }} transition={{ duration: 1.2, type: "spring", stiffness: 100 }}
        className="absolute inset-0 bg-gradient-to-r from-[#F472B6]/30 to-[#9333EA]/30 blur-[40px] rounded-full"
      />
      <motion.div 
        initial={false} animate={{ y: isCrying ? -30 : -90, opacity: isCrying ? 1 : 0 }} transition={{ duration: 0.8 }}
        className="absolute top-0 z-30 flex flex-col items-center"
      >
        <CloudRain className="w-14 h-14 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.6)] animate-pulse" />
        {isCrying && (
          <div className="relative w-16 h-10 mt-2 overflow-hidden">
            {rainDrops.map((drop, i) => (
              <motion.div 
                key={`teardrop-${i}`}
                className="absolute w-1 bg-blue-400/60 rounded-full"
                style={{ left: `${(i * 15) % 100}%`, height: `${drop.size * 4}px` }}
                animate={{ y: [-10, 40], opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: drop.duration * 0.3, delay: drop.delay * 0.2, ease: "linear" }} 
              />
            ))}
          </div>
        )}
      </motion.div>
      <motion.div 
        initial={false} animate={{ x: isCrying ? -120 : -25, opacity: isCrying ? 0 : 1, rotate: isCrying ? 0 : 12 }} transition={{ duration: 0.9, type: "spring", stiffness: 90, damping: 15 }}
        className="absolute z-10 w-24 h-32"
      >
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_20px_rgba(147,51,234,0.7)]">
          <rect x="20" y="20" width="60" height="80" rx="30" fill="#7C3AED" />
          <rect x="5" y="40" width="20" height="40" rx="10" fill="#6D28D9" />
          <rect x="40" y="35" width="45" height="25" rx="12" fill="#1F2937" stroke="#111827" strokeWidth="2" />
        </svg>
      </motion.div>
      <motion.div 
        initial={false} animate={{ x: isCrying ? 0 : 25, rotate: isCrying ? -8 : -3 }} transition={{ duration: 0.9, type: "spring", stiffness: 90, damping: 15 }}
        className="absolute z-20 w-24 h-32"
      >
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_20px_rgba(236,72,153,0.7)]">
          <rect x="20" y="20" width="60" height="80" rx="30" fill="#F472B6" />
          <rect x="75" y="40" width="20" height="40" rx="10" fill="#DB2777" />
          <rect x="15" y="35" width="45" height="25" rx="12" fill="#93C5FD" stroke="#60A5FA" strokeWidth="2" />
          <g transform="translate(50, 25)"><path d="M 0 0 C -5 -10, 5 -10, 0 0 C 10 -5, 10 5, 0 0 C 5 10, -5 10, 0 0 C -10 5, -10 -5, 0 0 Z" fill="#FDE047" /></g>
        </svg>
      </motion.div>
    </div>
  );
};

export default function EmotionalReset() {
  const [mounted, setMounted] = useState(false);
  const [isCrying, setIsCrying] = useState(true);
  const timelineRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start end", "end start"] });
  
  // Dynamic Ambient Roaming Light System
  // Translates scroll percentage into deep, distinct realm colors
  const ambientBlobColor = useTransform(
    scrollYProgress,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
    [
      "rgba(147, 51, 234, 0.25)", // Purple
      "rgba(6, 182, 212, 0.25)",  // Cyan
      "rgba(253, 224, 71, 0.2)",  // Gold
      "rgba(239, 68, 68, 0.2)",   // Red
      "rgba(244, 114, 182, 0.25)",// Pink
      "rgba(168, 85, 247, 0.25)", // Violet
      "rgba(251, 191, 36, 0.2)",  // Orange
      "rgba(255, 255, 255, 0.2)"  // Supernova White
    ]
  );
  
  const blobY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const threadHeight = useTransform(scrollYProgress, [0, 0.9], ["0%", "100%"]);
  
  const memoryCardVariants: Variants = {
    hidden: { opacity: 0, y: 100, filter: "blur(20px)", scale: 0.9, rotateX: 20 },
    show: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, rotateX: 0, transition: { duration: 1.4, type: "spring", bounce: 0.4 } }
  };

  const bgRain = getDeterministicArray(80);
  const bgStars = getDeterministicArray(60);

  // --- THE NEW, DEEPLY PERSONAL LORE ARCHIVE ---
  const loreData = [
    {
      id: 1, color: "text-[#9333EA]", border: "border-[#9333EA]", title: "LOG_01: AMONG US",
      svg: <SVGAAmongUs />,
      text: "We joined a private lobby to play a game, but spent hours just talking and ignoring it completely. You were just a stranger on a screen hiding your name, but somehow, you instantly became the only player that mattered to me."
    },
    {
      id: 2, color: "text-[#06B6D4]", border: "border-[#06B6D4]", title: "LOG_02: THE BIG BANG",
      svg: <SVGCosmicStar />,
      text: "We talked about the universe, and how we are just made of stardust. We are like a star—there is no reincarnation. We only live once, so why not make every single moment the absolute best one? Especially with someone like you."
    },
    {
      id: 3, color: "text-[#FDE047]", border: "border-[#FDE047]", title: "LOG_03: THE PROPHET",
      svg: <SVGProphetMoon />,
      text: "I told you I was an atheist. But then I realized that God is just whoever you have absolute, unwavering faith in. I have faith in you. I am following the religion named Moon, and I will gladly be your prophet."
    },
    {
      id: 4, color: "text-[#EF4444]", border: "border-[#EF4444]", title: "LOG_04: JUNOON",
      svg: <SVGMusicVibe />,
      text: "You asked about my favorite song. 'Junoon' by Mitraz. It became my favorite back when I used to wonder what the girl I'd fall for would look like. Turns out, I was right. That song reminds me of you."
    },
    {
      id: 5, color: "text-[#F472B6]", border: "border-[#F472B6]", title: "LOG_05: THE BLUSH",
      svg: <SVGCuteShyMoon />,
      text: "You told me to 'stop'. How cute your 'stop' is. I can literally feel you getting blushed through the screen. Because there can never be enough words and time to compliment everything you are."
    },
    {
      id: 6, color: "text-[#A855F7]", border: "border-[#A855F7]", title: "LOG_06: THE SIBERIAN BIRD",
      svg: <SVGSiberianBird />,
      text: "If a Siberian bird stops to wonder if the weather will be good, it dies. It just has to fly thousands of kilometers. That’s called knowing what is best for you. I don't care about the distance. I just want this to be real."
    },
    {
      id: 7, color: "text-[#FBBF24]", border: "border-[#FBBF24]", title: "LOG_07: TACTICS",
      svg: <SVGTacticsGame />,
      text: "I had to use all my tactics to make you say yes. It was super exhausting and enjoyable at the same time. All the happiness that I ever missed is now with me. And that's just because of you."
    },
    {
      id: 8, color: "text-white", border: "border-white", title: "LOG_08: THE REALITY",
      svg: <SVGSupernova />,
      text: "Out of all the chaotic galaxies and infinite multiverses, my code only compiled for you. Next year, when you finally arrive in Delhi, every single long-distance night will collapse into the easiest reality: holding you."
    }
  ];

  return (
    <>
      {/* CHAPTER VI: THE INFINITE FLUID ARCHIVE */}
      <section className="relative z-10 py-48 px-6 w-full min-h-screen bg-[#020205] overflow-hidden">
        
        {/* MASSIVE ROAMING AMBIENT LIGHT */}
        <motion.div 
          className="absolute left-0 right-0 w-[150vw] h-[150vw] max-w-[1200px] max-h-[1200px] rounded-full blur-[150px] pointer-events-none -translate-x-1/4"
          style={{ backgroundColor: ambientBlobColor, top: blobY, opacity: 0.6 }}
        />

        <div className="text-center w-full flex flex-col items-center mb-40 relative z-20">
          <div className="w-20 h-20 rounded-full bg-[#9333EA]/10 border border-[#9333EA]/40 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(147,51,234,0.3)] backdrop-blur-md">
            <LockKeyhole className="w-8 h-8 text-[#9333EA]" />
          </div>
          <span className="text-xs tracking-[0.5em] uppercase text-white/40 mb-4 block font-mono">Chapter VI: The Infinite Archive</span>
          <h2 className="text-5xl md:text-8xl font-light text-white mb-6 tracking-tighter">Decrypted Telemetry</h2>
          <p className="text-[#F472B6] tracking-[0.3em] uppercase text-sm font-mono flex items-center gap-3 bg-[#F472B6]/10 px-8 py-3 rounded-full border border-[#F472B6]/30 backdrop-blur-md">
            <Terminal className="w-5 h-5" /> <span>The WhatsApp Core</span>
          </p>
        </div>

        <div ref={timelineRef} className="relative max-w-6xl mx-auto pb-40">
          
          {/* Glowing Center Thread */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[4px] bg-white/5 md:-translate-x-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#9333EA] via-[#F472B6] to-white shadow-[0_0_30px_rgba(244,114,182,1)]"
              style={{ height: threadHeight }}
            />
          </div>

          <div className="flex flex-col gap-40 md:gap-64 perspective-[2000px]">
            
            {loreData.map((log, index) => {
              const isEven = index % 2 !== 0;
              return (
                <motion.div 
                  key={log.id}
                  initial="hidden" 
                  whileInView="show" 
                  viewport={{ once: true, margin: "-200px" }} 
                  variants={memoryCardVariants} 
                  className={`relative flex flex-col md:flex-row items-center w-full ${isEven ? 'md:justify-end' : 'md:justify-start'}`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Timeline Dot Connector */}
                  <div className={`hidden md:flex w-1/2 relative ${isEven ? 'order-1 justify-start pl-16' : 'order-1 justify-end pr-16'}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border-[3px] ${log.border} shadow-[0_0_30px_currentColor] z-10 ${log.color} flex items-center justify-center ${isEven ? 'left-[-12px]' : 'right-[-12px]'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-current animate-ping`} />
                    </div>
                  </div>

                  {/* The Holographic Data Pad */}
                  <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? 'order-2 md:pl-16' : 'order-2 md:pr-16'} relative group`}>
                    
                    {/* The CUTE SHIT Pop-out SVG */}
                    <div className={`absolute -top-20 md:-top-24 w-36 h-36 md:w-48 md:h-48 z-30 pointer-events-none transition-transform duration-700 group-hover:scale-125 group-hover:-translate-y-4 ${isEven ? 'right-4 md:-right-12' : 'right-4 md:-left-12'}`}>
                       {log.svg}
                    </div>

                    {/* Mobile Timeline Dot */}
                    <div className="md:hidden absolute left-6 top-1/2 -translate-y-1/2 -translate-x-[11px] w-6 h-6 rounded-full bg-black border-[3px] shadow-[0_0_20px_currentColor] z-10 flex items-center justify-center" style={{ borderColor: 'inherit', color: 'inherit' }}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-white animate-ping`} />
                    </div>

                    <div className={`p-10 md:p-16 bg-black/40 border-2 border-white/10 rounded-[3rem] backdrop-blur-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] group-hover:${log.border}/50 transition-all duration-700 relative overflow-hidden z-20`}>
                      {/* Ambient inner glow tied to the specific color */}
                      <div className={`absolute -inset-20 opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-700 bg-current ${log.color} pointer-events-none`} />
                      
                      <div className={`flex items-center gap-4 mb-8 font-mono text-xs md:text-sm uppercase tracking-[0.4em] ${log.color}`}>
                        {log.title}
                      </div>
                      
                      <p className="text-2xl md:text-3xl lg:text-[2rem] font-serif italic text-white/90 leading-relaxed font-light drop-shadow-lg">
                        "{log.text}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Final Archive Status Stamp */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={memoryCardVariants} className="relative flex justify-center w-full mt-32 pt-20">
               <div className="absolute top-0 left-6 md:left-1/2 w-20 h-20 -translate-x-[38px] md:-translate-x-1/2 rounded-full border-2 border-[#F472B6]/40 bg-black flex items-center justify-center z-10 shadow-[0_0_40px_rgba(244,114,182,0.6)]">
                 <InfinityIcon className="w-10 h-10 text-[#F472B6] animate-pulse" />
               </div>
               <div className="text-center bg-gradient-to-b from-[#1c0b36]/60 to-black border-2 border-white/10 rounded-[4rem] p-16 md:p-24 backdrop-blur-3xl relative overflow-hidden group hover:border-[#F472B6]/60 transition-colors duration-1000 w-full max-w-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F472B6]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                 <Fingerprint className="w-20 h-20 text-[#F472B6] mx-auto mb-10 animate-pulse drop-shadow-[0_0_25px_rgba(244,114,182,0.9)]" />
                 <p className="text-xl md:text-2xl font-mono text-[#9333EA] tracking-[0.5em] uppercase mb-6">
                   Telemetry Status
                 </p>
                 <p className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tracking-tighter drop-shadow-2xl">
                   IMMORTALIZED
                 </p>
               </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CHAPTER VII: THE SHOULDER */}
      <section className="relative z-10 py-48 px-4 flex flex-col items-center justify-center min-h-screen overflow-hidden bg-black">
        
        {/* ULTRA-SMOOTH HYDRATION-SAFE RAIN & GLOW BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000 flex items-center justify-center overflow-hidden">
          {isCrying ? (
            <div className="absolute inset-0 bg-[#020617] transition-colors duration-1000">
               <div className="absolute inset-0 opacity-60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#020617] to-[#000000]"></div>
               {mounted && bgRain.map((drop, i) => (
                 <motion.div 
                   key={`bg-rain-${i}`} 
                   className="absolute w-[2px] bg-gradient-to-b from-transparent via-blue-500/50 to-transparent rounded-full will-change-transform" 
                   style={{ left: `${drop.x}%`, top: "-30%", height: `${drop.size * 30}px` }} 
                   animate={{ y: ['0vh', '140vh'] }} 
                   transition={{ duration: drop.duration * 0.2, repeat: Infinity, ease: "linear", delay: drop.delay * 0.5 }} 
                 />
               ))}
               <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0b2e] via-[#0f051d] to-[#000000] transition-opacity duration-1000">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[1200px] max-h-[1200px] bg-gradient-to-tr from-[#9333EA]/20 to-[#F472B6]/30 blur-[150px] rounded-full animate-pulse"></div>
              {mounted && bgStars.map((star, i) => (
                 <motion.div 
                   key={`bg-star-${i}`} 
                   className="absolute w-2 h-2 rounded-full bg-[#F472B6] drop-shadow-[0_0_12px_#F472B6] will-change-transform" 
                   style={{ left: `${star.x}%`, top: `${star.y}%` }} 
                   initial={{ scale: 0, opacity: 0 }} 
                   animate={{ y: [0, -50], scale: [0, star.size, 0], opacity: [0, 1, 0] }} 
                   transition={{ duration: star.duration * 1.5, repeat: Infinity, ease: "easeInOut", delay: star.delay }} 
                 />
               ))}
            </div>
          )}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center w-full px-6">
          <span className="text-xs tracking-[0.5em] uppercase text-white/50 mb-8 block transition-colors duration-700 font-mono">
            {isCrying ? "Chapter VII: The Heavy Nights" : "Chapter VII: The Safe Place"}
          </span>
          <h2 className={`text-6xl md:text-8xl font-light mb-20 transition-colors duration-1000 tracking-tight ${isCrying ? "text-indigo-200/40" : "text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F472B6] to-white drop-shadow-[0_0_40px_rgba(244,114,182,0.5)]"}`}>
            {isCrying ? "When the Tears Fall" : "I've Got You"}
          </h2>

          <ShoulderCartoon isCrying={isCrying} />
          
          <div className="min-h-[300px] flex items-center justify-center mt-10">
            <AnimatePresence mode="wait">
              {isCrying ? (
                <motion.div key="crying" initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(10px)" }} transition={{ duration: 0.6 }} className="space-y-8 max-w-4xl mx-auto px-4">
                  <p className="text-3xl md:text-5xl text-indigo-100/50 font-light leading-relaxed">
                    "I used to look for a formula to fix your sadness. Because that's what I am—a machine built to solve problems."
                  </p>
                  <p className="text-2xl md:text-3xl text-indigo-300/40 font-serif italic mt-6">
                    "But you taught me what you actually need. And it's not a solution."
                  </p>
                </motion.div>
              ) : (
                <motion.div key="calm" initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} transition={{ duration: 0.6 }} className="space-y-10 max-w-5xl mx-auto p-12 md:p-20 bg-black/70 border border-[#F472B6]/40 backdrop-blur-3xl rounded-[4rem] shadow-[0_0_120px_rgba(244,114,182,0.25)]">
                  <p className="text-4xl md:text-6xl text-white/95 font-serif italic leading-relaxed">
                    "You just want a shoulder."
                  </p>
                  <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#F472B6] to-transparent mx-auto my-10"></div>
                  <p className="text-2xl md:text-4xl text-white/80 font-light leading-relaxed">
                    "I will open my arms and let you cry until you feel light again. I will hold you tightly until the storm passes. I might not know how to cry myself yet, but I know how to protect you. You never have to face the dark alone again."
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setIsCrying(!isCrying)} className={`mt-24 px-14 py-7 rounded-full border transition-all duration-700 flex items-center gap-5 mx-auto text-2xl font-medium tracking-wide z-20 relative overflow-hidden group outline-none ${isCrying ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.2)]" : "border-[#F472B6]/60 bg-gradient-to-r from-[#F472B6]/20 to-[#9333EA]/20 text-white shadow-[0_0_80px_rgba(244,114,182,0.5)] scale-110"}`}>
            {!isCrying && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
            {isCrying ? <CloudRain className="w-8 h-8 animate-pulse" /> : <Heart className="w-8 h-8 fill-current animate-bounce text-[#F472B6]" />}
            <span>{isCrying ? "Click when you need to reset" : "Stay in my arms"}</span>
          </button>
        </div>
      </section>
    </>
  );
}