"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, Play, Pause, Upload, Loader2, ArrowLeft,
  SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Pencil, Check, X, Disc3
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type MusicTrack = {
  fileName: string;
  displayName: string;
  url: string;
};

type RepeatMode = "all" | "one" | "off";

const cleanRawName = (fileName: string) =>
  fileName.replace(/^\d+_/, "").replace(/\.[^/.]+$/, "");

const formatDuration = (secs: number) => {
  if (!secs || isNaN(secs) || !isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function BackgroundAudio() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);

  // Playback Controls State (Muted / Paused by default)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("all");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Upload & Rename State
  const [isUploading, setIsUploading] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch audio files + custom display names
  const fetchMusic = useCallback(async () => {
    const [{ data: files, error: storageErr }, { data: metaRows }] = await Promise.all([
      supabase.storage.from("vault_music").list(),
      supabase.from("vault_music_meta").select("file_name, display_name")
    ]);

    if (storageErr || !files) return;

    const metaMap = new Map<string, string>();
    if (metaRows) {
      metaRows.forEach((row: { file_name: string; display_name: string }) => {
        metaMap.set(row.file_name, row.display_name);
      });
    }

    const fetchedTracks: MusicTrack[] = files
      .filter((f) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(f.name))
      .map((f) => ({
        fileName: f.name,
        displayName: metaMap.get(f.name) || cleanRawName(f.name),
        url: supabase.storage.from("vault_music").getPublicUrl(f.name).data.publicUrl
      }));

    setTracks(fetchedTracks);

    setCurrentTrack((prev) => {
      if (!prev) return fetchedTracks.length > 0 ? fetchedTracks[0] : null;
      const updatedMatch = fetchedTracks.find((t) => t.fileName === prev.fileName);
      return updatedMatch || prev;
    });
  }, []);

  useEffect(() => {
    fetchMusic();
  }, [fetchMusic, isLibraryOpen]);

  // Realtime listener so song renames update live for both users
  useEffect(() => {
    const metaChannel = supabase
      .channel("vault_music_meta_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vault_music_meta" },
        (payload) => {
          const row = payload.new as { file_name?: string; display_name?: string };
          if (!row?.file_name || !row?.display_name) return;

          setTracks((prev) =>
            prev.map((t) =>
              t.fileName === row.file_name
                ? { ...t, displayName: row.display_name! }
                : t
            )
          );
          setCurrentTrack((prev) =>
            prev && prev.fileName === row.file_name
              ? { ...prev, displayName: row.display_name! }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metaChannel);
    };
  }, []);

  // Audio playback sync
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack?.url, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayTrack = (track: MusicTrack) => {
    if (currentTrack?.fileName === track.fileName) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentTrack(track);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const playNext = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.fileName === currentTrack?.fileName);

    if (repeatMode === "off" && !isShuffle && currentIndex === tracks.length - 1) {
      setIsPlaying(false);
      return;
    }

    let nextIndex = 0;
    if (isShuffle && tracks.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tracks.length;
    }

    setCurrentTrack(tracks[nextIndex]);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [tracks, currentTrack, isShuffle, repeatMode]);

  const playPrev = useCallback(() => {
    if (tracks.length === 0) return;
    // If more than 3 seconds into a song, restart it instead of jumping back
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.fileName === currentTrack?.fileName);
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [tracks, currentTrack]);

  const handleTrackEnd = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      playNext();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("vault_music").upload(fileName, file);
    if (!error) {
      await fetchMusic();
    } else {
      alert("Upload failed. Ensure your 'vault_music' bucket policies allow INSERT.");
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const startRenaming = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFile(track.fileName);
    setEditNameValue(track.displayName);
  };

  const saveRename = async (fileName: string) => {
    const trimmed = editNameValue.trim();
    if (!trimmed) {
      setEditingFile(null);
      return;
    }
    setIsSavingName(true);

    const { error } = await supabase
      .from("vault_music_meta")
      .upsert(
        { file_name: fileName, display_name: trimmed, updated_at: new Date().toISOString() },
        { onConflict: "file_name" }
      );

    if (error) {
      alert("Could not save name. Make sure you ran the SQL for 'vault_music_meta' in Supabase.");
    } else {
      setTracks((prev) =>
        prev.map((t) => (t.fileName === fileName ? { ...t, displayName: trimmed } : t))
      );
      setCurrentTrack((prev) =>
        prev && prev.fileName === fileName ? { ...prev, displayName: trimmed } : prev
      );
    }

    setIsSavingName(false);
    setEditingFile(null);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* Persistent Global Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        muted={isMuted}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleTrackEnd}
      />

      {/* Compact Top-Center Trigger Pill (Never overlaps chat header name or icons) */}
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[999990]">
        <motion.button
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsLibraryOpen(true)}
          className="bg-[#111820]/90 backdrop-blur-xl border border-white/10 hover:border-[#F472B6]/50 text-white/90 px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-2 shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition-all"
        >
          {isPlaying && !isMuted ? (
            <span className="flex items-end gap-[2px] h-3">
              <motion.span animate={{ height: ["35%", "100%", "45%"] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-[2px] bg-[#F472B6] rounded-full" />
              <motion.span animate={{ height: ["100%", "30%", "90%"] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-[2px] bg-[#A855F7] rounded-full" />
              <motion.span animate={{ height: ["50%", "95%", "35%"] }} transition={{ duration: 0.7, repeat: Infinity }} className="w-[2px] bg-[#F472B6] rounded-full" />
            </span>
          ) : (
            <Music className="w-3.5 h-3.5 text-[#F472B6]" />
          )}
          <span className="max-w-[78px] sm:max-w-[130px] truncate tracking-wide">
            {isPlaying && currentTrack ? currentTrack.displayName : "Music"}
          </span>
        </motion.button>
      </div>

      {/* FULL-SCREEN DEDICATED MUSIC LIBRARY PAGE */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[9999999] bg-[#070a0f] text-white flex flex-col w-screen h-[100dvh] overflow-hidden"
          >
            {/* Ambient Gradient Glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-b from-[#9333EA]/25 via-[#F472B6]/10 to-transparent blur-3xl" />

            {/* Page Top Bar */}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.07] bg-[#0b1017]/80 backdrop-blur-xl flex-shrink-0">
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="flex items-center gap-2 text-white/75 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 rounded-full text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center">
                <h2 className="text-sm font-semibold tracking-wider uppercase text-white">Vault Music</h2>
                <p className="text-[10px] text-white/40 font-mono">
                  {tracks.length} {tracks.length === 1 ? "Track" : "Tracks"} Synced
                </p>
              </div>

              <label className="flex items-center gap-1.5 bg-gradient-to-r from-[#9333EA] to-[#F472B6] hover:opacity-90 text-white text-xs font-semibold px-3.5 py-2 rounded-full cursor-pointer shadow-lg shadow-pink-500/20 transition-all">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{isUploading ? "Adding..." : "Add Song"}</span>
                <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>

            {/* Responsive Two-Column (PC) / Stacked (Android) Body */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row max-w-6xl w-full mx-auto overflow-hidden">
              
              {/* NOW PLAYING DECK */}
              <div className="w-full lg:w-[42%] p-5 sm:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/[0.06] flex-shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
                {/* Spinning Disc Art */}
                <div className="relative mb-5">
                  <div className={`absolute -inset-3 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] blur-2xl transition-opacity duration-700 ${isPlaying && !isMuted ? "opacity-40" : "opacity-15"}`} />
                  <motion.div
                    animate={isPlaying && !isMuted ? { rotate: 360 } : { rotate: 0 }}
                    transition={isPlaying && !isMuted ? { duration: 10, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
                    className="relative w-28 h-28 sm:w-44 sm:h-44 rounded-full bg-[#111822] border border-white/15 flex items-center justify-center shadow-2xl"
                  >
                    <Disc3 className="w-14 h-14 sm:w-20 sm:h-20 text-[#F472B6]/80" />
                    <div className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#070a0f] border border-white/20" />
                  </motion.div>
                </div>

                {/* Track Title */}
                <h3 className="text-base sm:text-xl font-semibold text-white text-center line-clamp-1 max-w-full px-2">
                  {currentTrack ? currentTrack.displayName : "No Track Selected"}
                </h3>
                <p className="text-[11px] text-white/40 font-mono mt-1 mb-5">
                  {isPlaying ? (isMuted ? "Muted" : "Now Playing") : "Paused"}
                </p>

                {/* INTERACTIVE SEEK / TIMESTAMP SCRUBBER */}
                <div className="w-full max-w-sm space-y-1.5 mb-5">
                  <div className="relative w-full h-5 flex items-center">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#9333EA] to-[#F472B6] rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      disabled={!currentTrack}
                      aria-label="Seek audio position"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div
                      className="pointer-events-none absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(244,114,182,0.9)] -translate-x-1/2"
                      style={{ left: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-white/45">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="w-full max-w-sm flex items-center justify-between px-2">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    title="Shuffle"
                    className={`p-2 rounded-full transition-colors ${isShuffle ? "text-[#F472B6] bg-[#F472B6]/10" : "text-white/45 hover:text-white"}`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button onClick={playPrev} title="Previous" className="p-2.5 text-white/80 hover:text-white active:scale-90 transition-transform">
                    <SkipBack className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => currentTrack && togglePlayTrack(currentTrack)}
                    disabled={!currentTrack}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,114,182,0.45)] hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>

                  <button onClick={playNext} title="Next" className="p-2.5 text-white/80 hover:text-white active:scale-90 transition-transform">
                    <SkipForward className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => setRepeatMode((p) => (p === "all" ? "one" : p === "one" ? "off" : "all"))}
                    title={`Repeat: ${repeatMode}`}
                    className={`p-2 rounded-full transition-colors ${repeatMode !== "off" ? "text-[#F472B6] bg-[#F472B6]/10" : "text-white/45 hover:text-white"}`}
                  >
                    {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  </button>
                </div>

                {/* Volume & Mute Row */}
                <div className="w-full max-w-[220px] flex items-center gap-3 mt-5">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white/60 hover:text-white transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="w-full h-1 accent-[#F472B6] bg-white/10 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* SHARED PLAYLIST & RENAME LIST */}
              <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-white/45">
                    Shared Playlist
                  </span>
                  <span className="text-[11px] text-white/35">
                    Tap pencil to rename for both
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-6">
                  {tracks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-white/40 space-y-3">
                      <Music className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No songs in the vault yet.</p>
                      <p className="text-xs text-white/30">Tap “Add Song” above to upload an audio track.</p>
                    </div>
                  ) : (
                    tracks.map((track, idx) => {
                      const isCurrent = currentTrack?.fileName === track.fileName;
                      const isEditing = editingFile === track.fileName;

                      return (
                        <div
                          key={track.fileName}
                          onClick={() => !isEditing && togglePlayTrack(track)}
                          className={`group flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-gradient-to-r from-[#9333EA]/20 to-[#F472B6]/15 border-[#F472B6]/40 shadow-lg"
                              : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isCurrent ? "bg-[#F472B6] text-black" : "bg-white/[0.06] text-white/60"
                              }`}
                            >
                              {isCurrent && isPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : isCurrent ? (
                                <Play className="w-4 h-4 ml-0.5" />
                              ) : (
                                <span className="text-xs font-mono">{idx + 1}</span>
                              )}
                            </div>

                            {isEditing ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  saveRename(track.fileName);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 flex-1 min-w-0"
                              >
                                <input
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  autoFocus
                                  className="flex-1 min-w-0 bg-black/50 border border-[#F472B6]/60 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  disabled={isSavingName}
                                  className="p-1.5 rounded-lg bg-[#00A884] text-black hover:bg-[#00c298] disabled:opacity-50"
                                >
                                  {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingFile(null)}
                                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </form>
                            ) : (
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm truncate ${isCurrent ? "text-white font-semibold" : "text-white/85"}`}>
                                  {track.displayName}
                                </p>
                                <p className="text-[10px] text-white/35 font-mono truncate">
                                  {isCurrent && isPlaying ? "Playing now" : "Tap to play"}
                                </p>
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <button
                              onClick={(e) => startRenaming(track, e)}
                              title="Rename song for both"
                              className="p-2 rounded-xl text-white/40 hover:text-[#F472B6] hover:bg-white/[0.07] transition-colors flex-shrink-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}