"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, Upload, Loader2, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type MusicTrack = { name: string; url: string; };

export default function BackgroundAudio() {
  const [showMenu, setShowMenu] = useState(false);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // MUTED BY DEFAULT
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchMusic = useCallback(async () => {
    const { data, error } = await supabase.storage.from("vault_music").list();
    if (!error && data) {
      const fetchedTracks = data
        .filter(f => f.name.endsWith(".mp3") || f.name.endsWith(".wav") || f.name.endsWith(".m4a"))
        .map(f => ({
          name: f.name.replace(/\.[^/.]+$/, ""),
          url: supabase.storage.from("vault_music").getPublicUrl(f.name).data.publicUrl
        }));
      setTracks(fetchedTracks);
    }
  }, []);

  useEffect(() => { 
    fetchMusic(); 
  }, [fetchMusic]);

  const togglePlay = (track: MusicTrack) => {
    if (currentTrack?.url === track.url) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("vault_music").upload(fileName, file);
    if (!error) fetchMusic();
    else alert("Upload failed. Ensure your 'vault_music' bucket is public and accepts audio files.");
    setIsUploading(false);
  };

  return (
    // z-[999999] ensures this floats above absolutely everything, including the chat vault
    <div className="fixed top-6 left-6 z-[999999]">
      <audio ref={audioRef} src={currentTrack?.url} loop onEnded={() => setIsPlaying(false)} />
      
      <motion.button 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowMenu(!showMenu)}
        className="bg-[#202C33]/90 backdrop-blur-md border border-[#F472B6]/50 text-[#F472B6] px-4 py-2.5 rounded-full font-mono text-xs flex items-center gap-2 shadow-xl hover:bg-[#F472B6] hover:text-black transition-colors"
      >
        <Music className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} /> 
        Library
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-14 left-0 bg-[#111B21] border border-[#F472B6]/30 p-4 rounded-2xl shadow-2xl w-72 text-left max-h-[60vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-[#F472B6] font-mono uppercase tracking-wider font-bold flex items-center gap-2">
                <Music className="w-4 h-4" /> Vault Music
              </p>
              <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4 text-white/50 hover:text-white" />
              </button>
            </div>

            {tracks.length === 0 ? (
              <p className="text-xs text-white/50 italic py-4 text-center">No songs uploaded yet.</p>
            ) : (
              <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                {tracks.map(t => (
                  <button key={t.url} onClick={() => togglePlay(t)} className={`w-full flex items-center justify-between text-xs px-3 py-2.5 rounded-lg transition-colors border ${currentTrack?.url === t.url ? "bg-[#F472B6]/10 border-[#F472B6]/50 text-white font-bold" : "bg-transparent border-transparent text-white/70 hover:bg-white/5"}`}>
                    <span className="truncate pr-2">{t.name}</span>
                    {currentTrack?.url === t.url && isPlaying ? <Pause className="w-4 h-4 text-[#F472B6] flex-shrink-0" /> : <Play className="w-4 h-4 text-white/50 flex-shrink-0 hover:text-white" />}
                  </button>
                ))}
              </div>
            )}
            
            <label className="flex items-center justify-center gap-2 w-full mt-3 bg-[#F472B6]/10 hover:bg-[#F472B6]/20 text-xs text-[#F472B6] font-bold px-3 py-2.5 rounded-lg cursor-pointer transition-colors border border-[#F472B6]/30">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Uploading..." : "Upload New Track"}
              <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}