"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export default function BackgroundAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize the audio object (looking inside the public folder)
    audioRef.current = new Audio("/soundtrack.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3; // Soft cinematic volume (0.0 to 1.0)
  }, []);

  // Global listener: Start playing on the very first click, scroll, or keypress
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        // Attempt to play the audio
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setHasInteracted(true);
          })
          .catch((err) => {
            console.log("Browser blocked auto-play until further interaction.", err);
          });
      }
    };

    // Listen for any standard interaction
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("scroll", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
    };
  }, [hasInteracted]);

  // Manual toggle for the floating button
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent this click from triggering the global listener again
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1 }}
        onClick={togglePlay}
        className="fixed bottom-6 right-6 z-[100] p-4 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:border-[#F472B6]/50 transition-all duration-500 group outline-none"
      >
        {isPlaying ? (
          <Volume2 className="w-5 h-5 text-[#F472B6] group-hover:scale-110 transition-transform" />
        ) : (
          <VolumeX className="w-5 h-5 text-white/40 group-hover:scale-110 transition-transform" />
        )}
      </motion.button>
    </AnimatePresence>
  );
}