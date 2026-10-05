"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { HeartPulse, Sparkles } from "lucide-react";

export default function InsideJokes() {
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  // Explicitly typing as Variants fixes the TypeScript easing error
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeOut" } },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };

  return (
    <section className="relative z-10 py-32 px-6 max-w-6xl mx-auto min-h-screen flex items-center justify-center">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="flex flex-col items-center text-center w-full">
        <span className="text-[10px] tracking-[0.4em] uppercase text-[#9333EA] block mb-4">Chapter II</span>
        <h2 className="text-4xl md:text-6xl font-light mt-4 mb-20">The Chaos & The Comfort</h2>

        <div className="grid md:grid-cols-2 gap-12 w-full perspective-[1500px]">
          
          {/* CARD 1: The Literal Heart */}
          <motion.div 
            variants={fadeUp}
            className="relative w-full h-[400px] cursor-pointer"
            onClick={() => setFlippedCard(flippedCard === 1 ? null : 1)}
          >
            <motion.div 
              className="w-full h-full relative"
              animate={{ rotateY: flippedCard === 1 ? 180 : 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 60, damping: 15 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Side */}
              <div 
                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 shadow-xl"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <HeartPulse className="w-12 h-12 text-[#F472B6]/50 mb-2" />
                <h3 className="text-3xl font-light">The Anatomical Heart</h3>
                <div className="mt-4 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] tracking-widest uppercase text-white/50">Click to reveal</div>
              </div>

              {/* Back Side */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-[#F472B6]/20 to-[#F472B6]/5 border border-[#F472B6]/40 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(244,114,182,0.15)] space-y-4"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-base md:text-lg text-white/90 font-light leading-relaxed">
                  I asked you for your heart, and instead of a normal emoji, you sent me the literal anatomical 🫀. I had to frantically explain that wanting a real human heart is a crime.
                </p>
                <p className="text-lg md:text-xl text-[#F472B6] font-serif italic leading-relaxed">
                  "I prefer the red default heart rather than a literal human heart... I don't want real."
                </p>
                <p className="text-sm tracking-wide text-white/50 uppercase mt-2">
                  You are a literal criminal for stealing my soul.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* CARD 2: The Religion of Moon */}
          <motion.div 
            variants={fadeUp}
            className="relative w-full h-[400px] cursor-pointer"
            onClick={() => setFlippedCard(flippedCard === 2 ? null : 2)}
          >
            <motion.div 
              className="w-full h-full relative"
              animate={{ rotateY: flippedCard === 2 ? 180 : 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 60, damping: 15 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Side */}
              <div 
                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 shadow-xl"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <Sparkles className="w-12 h-12 text-[#9333EA]/50 mb-2" />
                <h3 className="text-3xl font-light">The Atheist's Prophet</h3>
                <div className="mt-4 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] tracking-widest uppercase text-white/50">Click to reveal</div>
              </div>

              {/* Back Side */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-[#9333EA]/20 to-[#9333EA]/5 border border-[#9333EA]/40 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(147,51,234,0.15)] space-y-6"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-base md:text-lg text-white/90 font-light leading-relaxed">
                  I told you I was an atheist. But then I realized that God is just whoever you have absolute, unwavering faith in. 
                </p>
                <div className="h-px w-16 bg-[#9333EA]/50 mx-auto"></div>
                <p className="text-base md:text-lg text-white/80 font-light leading-relaxed">
                  "I have faith in you, which means you are God for me. I am following the religion which will be named Moon."
                </p>
                <p className="text-sm tracking-[0.2em] text-[#9333EA] uppercase font-medium">
                  I will gladly be your prophet.
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}