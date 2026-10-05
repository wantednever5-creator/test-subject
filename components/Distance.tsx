"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Radar, Radio } from "lucide-react";

export default function Distance() {
  const distanceRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: distanceRef,
    offset: ["start center", "end center"]
  });
  
  const dataPacketY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={distanceRef} className="relative z-10 py-32 px-6 w-full max-w-5xl mx-auto">
      <div className="text-center mb-32">
        <span className="text-[10px] tracking-[0.4em] uppercase text-[#F472B6] block mb-4">Chapter III</span>
        <h2 className="text-4xl md:text-6xl font-light">The Distance</h2>
      </div>

      <div className="relative w-full flex flex-col items-center min-h-[150vh]">
        
        {/* Jaipur */}
        <div className="relative flex flex-col items-center gap-3 z-20 bg-[#050505] p-6 rounded-full border border-white/10 shadow-[0_0_40px_rgba(244,114,182,0.1)]">
          <div className="w-6 h-6 rounded-full bg-[#F472B6] shadow-[0_0_20px_#F472B6] flex items-center justify-center">
            <div className="w-full h-full rounded-full animate-ping bg-[#F472B6] opacity-75"></div>
          </div>
          <span className="text-sm tracking-[0.4em] uppercase text-white/80 mt-2">Jaipur</span>
          <span className="text-[10px] text-[#F472B6] font-mono">Distance: 270 KM</span>
        </div>

        {/* Scroll Track & Radar */}
        <div className="relative w-[3px] h-full bg-white/5 mx-auto my-4 flex-1">
          <motion.div 
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#F472B6] to-[#9333EA] shadow-[0_0_15px_rgba(244,114,182,0.6)] origin-top rounded-full"
            style={{ scaleY: scrollYProgress }}
          />
          
          <motion.div className="absolute -left-[9px] w-6 h-6 flex items-center justify-center" style={{ top: dataPacketY }}>
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_#fff]"></div>
            <div className="absolute inset-0 border-2 border-white/80 rounded-full animate-ping"></div>
          </motion.div>

          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[90vw] md:w-[60vw] aspect-square max-w-[600px] rounded-full border border-white/[0.03] -z-10 flex items-center justify-center overflow-hidden">
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-1/2 h-full absolute right-0 origin-left">
                <div className="w-full h-full bg-gradient-to-r from-transparent to-[#F472B6]/5 border-r border-[#F472B6]/20"></div>
             </motion.div>
             <div className="w-full h-full rounded-full border border-[#F472B6]/10 animate-[ping_5s_linear_infinite]"></div>
          </div>
        </div>

        {/* Floating Text */}
        <div className="absolute top-[25%] -translate-y-1/2 left-[5%] md:left-[20%] max-w-[250px] md:max-w-xs text-left">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ margin: "-200px" }} transition={{ duration: 1 }}>
            <Radio className="w-6 h-6 text-[#F472B6]/50 mb-4" />
            <p className="text-2xl md:text-3xl font-light text-white/90">2 Years Waiting.</p>
            <p className="text-sm md:text-base text-white/50 mt-3 font-light leading-relaxed">Long-distance tests everything we have. But the connection has never dropped.</p>
          </motion.div>
        </div>

        <div className="absolute top-[65%] -translate-y-1/2 right-[5%] md:right-[20%] max-w-[250px] md:max-w-xs text-right">
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ margin: "-200px" }} transition={{ duration: 1 }}>
            <Radar className="w-6 h-6 text-[#9333EA]/50 mb-4 ml-auto" />
            <p className="text-2xl md:text-3xl font-light text-white/90">8 to 9 Photos.</p>
            <p className="text-sm md:text-base text-white/50 mt-3 font-light leading-relaxed">That's all we've seen of each other. Yet you are all I see.</p>
          </motion.div>
        </div>

        {/* Delhi */}
        <div className="relative flex flex-col items-center gap-3 z-20 bg-[#050505] p-6 rounded-full border border-white/10 mt-4 shadow-[0_0_40px_rgba(147,51,234,0.1)]">
          <div className="w-6 h-6 rounded-full bg-[#9333EA] shadow-[0_0_20px_#9333EA] flex items-center justify-center">
            <div className="w-full h-full rounded-full animate-ping bg-[#9333EA] opacity-75"></div>
          </div>
          <span className="text-sm tracking-[0.4em] uppercase text-white/80 mt-2">Delhi</span>
          <span className="text-[10px] text-[#9333EA] font-mono">Target: Next Year</span>
        </div>

      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ margin: "-100px" }} transition={{ duration: 1.5 }} className="mt-32 max-w-3xl mx-auto text-2xl md:text-4xl text-center font-serif italic text-white/90 leading-relaxed">
        "The thought of next year, when you come to college in Delhi... cuddling with you, being in your arms... it makes my brain go completely blank."
      </motion.div>
    </section>
  );
}