"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, Play, Pause, Upload, Loader2, ArrowLeft,
  SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Pencil, Check, X, Disc3,
  Plus, Link2, Trash2, AlertCircle, Search,
  Compass, Radio, ListMusic, Heart, ChevronDown,
  ListPlus, Headphones, LogOut, ArrowUp
} from "lucide-react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayerInstance = {
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState?: () => number;
  destroy: () => void;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type MusicTrack = {
  id: string;
  source: "youtube" | "upload";
  videoId?: string;
  fileName?: string;
  displayName: string;
  artist?: string;
  url: string;
  thumbnail?: string;
  duration?: number | null;
};

type HomeShelf = {
  title: string;
  items: MusicTrack[];
};

type RoomMember = {
  user: string;
  sessionId: string;
  inRoom: boolean;
  track: MusicTrack | null;
  isPlaying: boolean;
  baseTime: number;
  updatedAt: number;
};

type RoomSyncPayload = {
  sender: string;
  senderId: string;
  targetId?: string;
  echoReqSentAt?: number;
  track: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  sentAt: number;
  manualQueue: MusicTrack[];
  note?: string;
};

type RepeatMode = "all" | "one" | "off";
type ActiveTab = "search" | "discover" | "upnext" | "vault";

const cleanRawName = (fileName: string) =>
  fileName.replace(/^\d+_/, "").replace(/\.[^/.]+$/, "");

const formatDuration = (secs: number | null | undefined) => {
  if (!secs || isNaN(secs) || !isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const extractYouTubeId = (input: string): string | null => {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const vParam = parsed.searchParams.get("v");
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "shorts" || p === "embed" || p === "live");
    if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
      return parts[idx + 1];
    }
  } catch (_) {
    const match = trimmed.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
};

const extractPlaylistId = (input: string): string | null => {
  const trimmed = input.trim();
  try {
    const parsed = new URL(trimmed);
    const list = parsed.searchParams.get("list");
    if (list && list.length >= 10) return list;
  } catch (_) {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  if (/^(PL|OLAK5uy_|RDCLAK|LM)[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return null;
};

const apiItemToTrack = (item: any): MusicTrack => ({
  id: `yt:${item.videoId}`,
  source: "youtube",
  videoId: item.videoId,
  displayName: item.title || "Untitled Track",
  artist: item.artist || "YouTube Music",
  url: `https://www.youtube.com/watch?v=${item.videoId}`,
  thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
  duration: typeof item.duration === "number" ? item.duration : null
});

export default function BackgroundAudio({ identity = "Vault User" }: { identity?: string }) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("discover");
  const [mobilePlayerExpanded, setMobilePlayerExpanded] = useState(false);

  // Playlists & Feeds
  const [vaultTracks, setVaultTracks] = useState<MusicTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [homeShelves, setHomeShelves] = useState<HomeShelf[]>([]);
  const [isLoadingHome, setIsLoadingHome] = useState(false);

  // Room Queue (plays before auto-radio) + Auto-Recommended Radio
  const [manualQueue, setManualQueue] = useState<MusicTrack[]>([]);
  const [upNextTracks, setUpNextTracks] = useState<MusicTrack[]>([]);
  const [isLoadingUpNext, setIsLoadingUpNext] = useState(false);

  // Player State (Silent/Idle by default until playing or joining the Room)
  const [activeQueue, setActiveQueue] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("all");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusNotice, setStatusNotice] = useState<{ type: "error" | "info"; text: string } | null>(null);

  // Discord-Style Music Room State
  const [inRoom, setInRoom] = useState(false);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [roomActivity, setRoomActivity] = useState<string | null>(null);
  const [pendingAudioUnlock, setPendingAudioUnlock] = useState<RoomSyncPayload | null>(null);

  // Vault Import / Upload / Rename State
  const [linkInput, setLinkInput] = useState("");
  const [isImportingLink, setIsImportingLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [savingVideoIds, setSavingVideoIds] = useState<Set<string>>(new Set());

  // Refs
  const sessionIdRef = useRef<string>(`${identity}_${Math.random().toString(36).slice(2, 9)}`);
  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const pendingYtCmdRef = useRef<{ videoId: string; startSeconds: number; autoplay: boolean } | null>(null);

  const isSeekingRef = useRef(false);
  const fallbackTriedRef = useRef<Set<string>>(new Set());
  const isRemoteActionRef = useRef(false);
  const remoteGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live mirrors for callbacks
  const inRoomRef = useRef(false);
  const roomMembersRef = useRef<RoomMember[]>([]);
  const currentTrackRef = useRef<MusicTrack | null>(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const manualQueueRef = useRef<MusicTrack[]>([]);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  const handleTrackEndRef = useRef<() => void>(() => {});
  const handleYtErrorRef = useRef<(code: number) => void>(() => {});
  const applyRemoteSyncRef = useRef<(payload: RoomSyncPayload) => void>(() => {});

  useEffect(() => { inRoomRef.current = inRoom; }, [inRoom]);
  useEffect(() => { roomMembersRef.current = roomMembers; }, [roomMembers]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { manualQueueRef.current = manualQueue; }, [manualQueue]);
  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
  }, [volume, isMuted]);

  const savedVideoIdSet = new Set(
    vaultTracks.filter((t) => t.source === "youtube" && t.videoId).map((t) => t.videoId!)
  );

  // Active members currently connected inside the Music Room
  const activeListeners = roomMembers.filter((m) => m.inRoom);
  const remoteListeners = activeListeners.filter((m) => m.sessionId !== sessionIdRef.current);
  const remoteHostWithTrack =
    remoteListeners.find((m) => m.track && m.isPlaying) ||
    remoteListeners.find((m) => m.track) ||
    remoteListeners[0] ||
    null;

  const showTempNotice = useCallback((text: string, type: "info" | "error" = "info", ms = 2800) => {
    setStatusNotice({ type, text });
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (ms > 0) {
      noticeTimerRef.current = setTimeout(() => setStatusNotice(null), ms);
    }
  }, []);

  const flashRoomActivity = useCallback((text: string) => {
    setRoomActivity(text);
    setTimeout(() => {
      setRoomActivity((prev) => (prev === text ? null : prev));
    }, 3200);
  }, []);

  const markRemoteAction = useCallback((durationMs = 1000) => {
    isRemoteActionRef.current = true;
    if (remoteGuardTimerRef.current) clearTimeout(remoteGuardTimerRef.current);
    remoteGuardTimerRef.current = setTimeout(() => {
      isRemoteActionRef.current = false;
    }, durationMs);
  }, []);

  const getLiveTime = useCallback(() => {
    const track = currentTrackRef.current;
    if (!track) return 0;
    if (track.source === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
      try {
        const t = ytPlayerRef.current.getCurrentTime();
        if (!isNaN(t)) return t;
      } catch (_) {}
    } else if (track.source === "upload" && audioRef.current) {
      return audioRef.current.currentTime || 0;
    }
    return currentTimeRef.current;
  }, []);

  // Push our current presence metadata to the Discord-style Room channel
  const syncMyPresence = useCallback(
    (overrides?: Partial<RoomMember>) => {
      if (!roomChannelRef.current) return;
      const joined = overrides?.inRoom ?? inRoomRef.current;
      const track = overrides && "track" in overrides ? (overrides.track ?? null) : currentTrackRef.current;
      const playing = overrides?.isPlaying ?? isPlayingRef.current;
      const baseTime = overrides?.baseTime ?? getLiveTime();

      roomChannelRef.current
        .track({
          user: identity,
          sessionId: sessionIdRef.current,
          inRoom: joined,
          track: joined ? track : null,
          isPlaying: joined ? playing : false,
          baseTime: joined ? baseTime : 0,
          updatedAt: Date.now()
        } as RoomMember)
        .catch(() => {});
    },
    [identity, getLiveTime]
  );

  // Broadcast live playback/queue changes to everyone in the Room
  const broadcastRoomSync = useCallback(
    (overrides?: Partial<RoomSyncPayload>) => {
      if (!inRoomRef.current || !roomChannelRef.current) return;

      const nextTrack = overrides && "track" in overrides ? (overrides.track ?? null) : currentTrackRef.current;
      const nextPlaying = overrides?.isPlaying ?? isPlayingRef.current;
      const nextTime = overrides?.currentTime ?? getLiveTime();
      const nextQueue = overrides?.manualQueue ?? manualQueueRef.current;

      const payload: RoomSyncPayload = {
        sender: identity,
        senderId: sessionIdRef.current,
        targetId: overrides?.targetId,
        echoReqSentAt: overrides?.echoReqSentAt,
        track: nextTrack,
        isPlaying: nextPlaying,
        currentTime: nextTime,
        sentAt: Date.now(),
        manualQueue: nextQueue,
        note: overrides?.note
      };

      roomChannelRef.current.send({
        type: "broadcast",
        event: "room_sync",
        payload
      });

      syncMyPresence({
        inRoom: true,
        track: nextTrack,
        isPlaying: nextPlaying,
        baseTime: nextTime
      });
    },
    [identity, getLiveTime, syncMyPresence]
  );

  // Stop local playback & leave the room (never pauses the other person if they stay)
  const leaveRoomAndStop = useCallback(
    (silent = false) => {
      if (endFallbackTimerRef.current) clearTimeout(endFallbackTimerRef.current);

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (_) {}
      }
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (_) {}
      }

      setIsPlaying(false);
      isPlayingRef.current = false;
      setInRoom(false);
      inRoomRef.current = false;
      setPendingAudioUnlock(null);

      syncMyPresence({ inRoom: false, track: null, isPlaying: false, baseTime: 0 });

      if (!silent) {
        flashRoomActivity("Left Music Room");
      }

      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.playbackState = "none";
        } catch (_) {}
      }
    },
    [syncMyPresence, flashRoomActivity]
  );

  // 1. STRICT ACTIVE-DEVICE GUARD: Closing tab, switching apps, or locking screen stops audio & exits room
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        leaveRoomAndStop(true);
      }
    };

    const handleClose = () => {
      leaveRoomAndStop(true);
      if (roomChannelRef.current) {
        roomChannelRef.current.untrack().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleClose);
    window.addEventListener("beforeunload", handleClose);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleClose);
      window.removeEventListener("beforeunload", handleClose);
    };
  }, [leaveRoomAndStop]);

  // 2. Always-Connected Discord-Style Room Channel (Shows live listener status even before joining)
  useEffect(() => {
    const channel = supabase.channel("vault_discord_music_room", {
      config: {
        broadcast: { self: false },
        presence: { key: sessionIdRef.current }
      }
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const members: RoomMember[] = [];
        Object.values(state).forEach((presences: any) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const latest = presences[presences.length - 1] as RoomMember;
            if (latest?.sessionId) members.push(latest);
          }
        });
        setRoomMembers(members);
        roomMembersRef.current = members;
      })
      .on("broadcast", { event: "room_sync" }, ({ payload }) => {
        const data = payload as RoomSyncPayload;
        if (!data || data.senderId === sessionIdRef.current) return;
        if (data.targetId && data.targetId !== sessionIdRef.current) return;
        // Ignore playback syncs unless we have actively joined the Room
        if (!inRoomRef.current) return;
        applyRemoteSyncRef.current(data);
      })
      .on("broadcast", { event: "request_room_state" }, ({ payload }) => {
        const requesterId = payload?.requesterId as string | undefined;
        const reqSentAt = payload?.reqSentAt as number | undefined;
        if (!requesterId || requesterId === sessionIdRef.current) return;
        if (!inRoomRef.current || document.visibilityState !== "visible") return;

        // Reply immediately with exact live position & full upcoming queue
        channel.send({
          type: "broadcast",
          event: "room_sync",
          payload: {
            sender: identity,
            senderId: sessionIdRef.current,
            targetId: requesterId,
            echoReqSentAt: reqSentAt,
            track: currentTrackRef.current,
            isPlaying: isPlayingRef.current,
            currentTime: getLiveTime(),
            sentAt: Date.now(),
            manualQueue: manualQueueRef.current,
            note: `Synced with ${identity}`
          } as RoomSyncPayload
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user: identity,
            sessionId: sessionIdRef.current,
            inRoom: inRoomRef.current,
            track: inRoomRef.current ? currentTrackRef.current : null,
            isPlaying: inRoomRef.current ? isPlayingRef.current : false,
            baseTime: inRoomRef.current ? getLiveTime() : 0,
            updatedAt: Date.now()
          } as RoomMember);
        }
      });

    roomChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      roomChannelRef.current = null;
    };
  }, [identity, getLiveTime]);

  // 3. Initialize Official YouTube IFrame Player API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initYouTubePlayer = () => {
      if (!ytContainerRef.current || ytPlayerRef.current || !window.YT?.Player) return;

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        height: "200",
        width: "200",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            ytReadyRef.current = true;
            event.target.setVolume(Math.round(volumeRef.current * 100));
            if (isMutedRef.current) event.target.mute();
            else event.target.unMute();

            if (pendingYtCmdRef.current) {
              const cmd = pendingYtCmdRef.current;
              pendingYtCmdRef.current = null;
              if (cmd.autoplay) {
                event.target.loadVideoById(cmd.videoId, cmd.startSeconds);
              } else {
                event.target.cueVideoById(cmd.videoId, cmd.startSeconds);
              }
            }
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.ENDED) {
              handleTrackEndRef.current();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              if (document.visibilityState === "hidden" || !inRoomRef.current) {
                event.target.pauseVideo();
                return;
              }
              setIsPlaying(true);
              isPlayingRef.current = true;
              setPendingAudioUnlock(null);
              const d = event.target.getDuration();
              if (d && !isNaN(d)) setDuration(d);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              if (!isRemoteActionRef.current) {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }
            }
          },
          onError: (event) => {
            handleYtErrorRef.current(event.data);
          }
        }
      });
    };

    if (window.YT?.Player) {
      initYouTubePlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initYouTubePlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
        ytReadyRef.current = false;
      }
    };
  }, []);

  // 4. Fetch Saved Vault Playlist (Supabase YT Tracks + Uploaded MP3s)
  const fetchVaultMusic = useCallback(async () => {
    const [{ data: ytRows }, { data: files, error: storageErr }, { data: metaRows }] = await Promise.all([
      supabase.from("vault_yt_tracks").select("*").order("created_at", { ascending: false }),
      supabase.storage.from("vault_music").list(),
      supabase.from("vault_music_meta").select("file_name, display_name")
    ]);

    const combined: MusicTrack[] = [];

    if (ytRows) {
      ytRows.forEach((row: any) => {
        combined.push({
          id: `yt:${row.video_id}`,
          source: "youtube",
          videoId: row.video_id,
          displayName: row.display_name,
          artist: row.artist || "YouTube Music",
          url: `https://www.youtube.com/watch?v=${row.video_id}`,
          thumbnail: row.thumbnail_url || `https://i.ytimg.com/vi/${row.video_id}/hqdefault.jpg`
        });
      });
    }

    if (!storageErr && files) {
      const metaMap = new Map<string, string>();
      if (metaRows) {
        metaRows.forEach((row: { file_name: string; display_name: string }) => {
          metaMap.set(row.file_name, row.display_name);
        });
      }

      files
        .filter((f) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(f.name))
        .forEach((f) => {
          combined.push({
            id: `file:${f.name}`,
            source: "upload",
            fileName: f.name,
            displayName: metaMap.get(f.name) || cleanRawName(f.name),
            artist: "Uploaded Audio",
            url: supabase.storage.from("vault_music").getPublicUrl(f.name).data.publicUrl
          });
        });
    }

    setVaultTracks(combined);
    setCurrentTrack((prev) => {
      if (!prev) return prev;
      const updated = combined.find((t) => t.id === prev.id);
      return updated ? { ...prev, displayName: updated.displayName } : prev;
    });
  }, []);

  useEffect(() => {
    fetchVaultMusic();
  }, [fetchVaultMusic, isLibraryOpen]);

  useEffect(() => {
    const channel = supabase
      .channel("vault_music_unified_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "vault_yt_tracks" }, () => {
        fetchVaultMusic();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vault_music_meta" }, () => {
        fetchVaultMusic();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVaultMusic]);

  // 5. Load Discover Feed
  useEffect(() => {
    if (!isLibraryOpen || activeTab !== "discover" || homeShelves.length > 0 || isLoadingHome) return;

    const loadDiscover = async () => {
      setIsLoadingHome(true);
      try {
        const res = await fetch("/api/ytmusic?action=home");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.shelves)) {
            setHomeShelves(
              data.shelves.map((s: any) => ({
                title: s.title,
                items: (s.items || []).map(apiItemToTrack)
              }))
            );
          }
        }
      } catch (_) {} finally {
        setIsLoadingHome(false);
      }
    };
    loadDiscover();
  }, [isLibraryOpen, activeTab, homeShelves.length, isLoadingHome]);

  // 6. Debounced Live YT Music Search
  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/ytmusic?action=search&q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data.tracks) ? data.tracks.map(apiItemToTrack) : []);
      }
    } catch (_) {} finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => runSearch(searchQuery), 380);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  // 7. Fetch YT Music "Up Next" Radio Queue
  const fetchUpNextForTrack = useCallback(async (track: MusicTrack, makeActiveQueue: boolean) => {
    if (track.source !== "youtube" || !track.videoId) return;
    setIsLoadingUpNext(true);
    try {
      const params = new URLSearchParams({
        action: "upnext",
        videoId: track.videoId,
        title: track.displayName,
        artist: track.artist || ""
      });
      const res = await fetch(`/api/ytmusic?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const radioTracks: MusicTrack[] = Array.isArray(data.tracks) ? data.tracks.map(apiItemToTrack) : [];
        setUpNextTracks(radioTracks);
        if (makeActiveQueue && radioTracks.length > 0) {
          setActiveQueue([track, ...radioTracks]);
        }
      }
    } catch (_) {} finally {
      setIsLoadingUpNext(false);
    }
  }, []);

  // 8. Volume & Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      ytPlayerRef.current.setVolume(Math.round(volume * 100));
      if (isMuted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    }
  }, [volume, isMuted]);

  // 9. Progress Polling for YouTube Engine
  useEffect(() => {
    if (!isPlaying || currentTrack?.source !== "youtube") return;
    const interval = setInterval(() => {
      if (isSeekingRef.current || !ytPlayerRef.current || !ytReadyRef.current) return;
      try {
        const curr = ytPlayerRef.current.getCurrentTime();
        const dur = ytPlayerRef.current.getDuration();
        if (!isNaN(curr)) setCurrentTime(curr);
        if (!isNaN(dur) && dur > 0) setDuration(dur);
      } catch (_) {}
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // Core Playback Engine (Playing any track automatically puts you in the Music Room)
  const playTrackFromContext = useCallback(
    (
      track: MusicTrack,
      contextQueue?: MusicTrack[],
      triggerRadio = false,
      options?: {
        startSeconds?: number;
        fromRemote?: boolean;
        autoplay?: boolean;
        nextManualQueue?: MusicTrack[];
        suppressBroadcast?: boolean;
      }
    ) => {
      const startSec = Math.max(0, options?.startSeconds || 0);
      const shouldPlay = options?.autoplay ?? true;
      const fromRemote = options?.fromRemote ?? false;
      const suppressBroadcast = options?.suppressBroadcast ?? false;

      if (endFallbackTimerRef.current) clearTimeout(endFallbackTimerRef.current);
      if (fromRemote) markRemoteAction(1100);

      // Playing a track automatically connects you to the Discord-style Music Room
      if (!inRoomRef.current) {
        setInRoom(true);
        inRoomRef.current = true;
      }

      setStatusNotice(null);
      setPendingAudioUnlock(null);
      setCurrentTrack(track);
      currentTrackRef.current = track;
      setCurrentTime(startSec);
      currentTimeRef.current = startSec;
      setDuration(track.duration || 0);
      setIsPlaying(shouldPlay);
      isPlayingRef.current = shouldPlay;

      if (contextQueue && contextQueue.length > 0) {
        setActiveQueue(contextQueue);
      }

      if (track.source === "youtube" && track.videoId) {
        if (audioRef.current) audioRef.current.pause();
        if (ytPlayerRef.current && ytReadyRef.current) {
          if (shouldPlay) ytPlayerRef.current.loadVideoById(track.videoId, startSec);
          else ytPlayerRef.current.cueVideoById(track.videoId, startSec);
        } else {
          pendingYtCmdRef.current = { videoId: track.videoId, startSeconds: startSec, autoplay: shouldPlay };
        }
        fetchUpNextForTrack(track, triggerRadio);
      } else if (track.source === "upload") {
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (_) {}
        }
        if (audioRef.current) {
          audioRef.current.src = track.url;
          audioRef.current.currentTime = startSec;
          if (shouldPlay) {
            audioRef.current.play().catch(() => {
              setIsPlaying(false);
              isPlayingRef.current = false;
              if (fromRemote) {
                setPendingAudioUnlock({
                  sender: "Room",
                  senderId: "remote",
                  track,
                  isPlaying: true,
                  currentTime: startSec,
                  sentAt: Date.now(),
                  manualQueue: options?.nextManualQueue ?? manualQueueRef.current
                });
              }
            });
          } else {
            audioRef.current.pause();
          }
        }
      }

      if (!fromRemote && !suppressBroadcast) {
        broadcastRoomSync({
          track,
          isPlaying: shouldPlay,
          currentTime: startSec,
          manualQueue: options?.nextManualQueue ?? manualQueueRef.current,
          note: `${identity} played ${track.displayName}`
        });
      }
    },
    [fetchUpNextForTrack, markRemoteAction, broadcastRoomSync, identity]
  );

  // JOIN THE DISCORD-STYLE MUSIC ROOM (Runs audio start synchronously inside tap gesture!)
  const joinMusicRoom = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setInRoom(true);
      inRoomRef.current = true;
      setPendingAudioUnlock(null);

      // Look for an active partner already listening in the room
      const remoteInRoom = roomMembersRef.current.filter(
        (m) => m.inRoom && m.sessionId !== sessionIdRef.current
      );
      const host =
        remoteInRoom.find((m) => m.track && m.isPlaying) ||
        remoteInRoom.find((m) => m.track) ||
        null;

      if (host?.track) {
        const elapsed = host.isPlaying
          ? Math.min(600, Math.max(0, (Date.now() - host.updatedAt) / 1000))
          : 0;
        const startAt = Math.max(0, (host.baseTime || 0) + elapsed);

        // Start playback synchronously on user tap so Android/iOS unlocks unmuted audio
        playTrackFromContext(host.track, undefined, false, {
          startSeconds: startAt,
          fromRemote: true,
          autoplay: host.isPlaying,
          suppressBroadcast: true
        });
        flashRoomActivity(`Joined ${host.user} in Music Room`);
      } else {
        flashRoomActivity("Joined Music Room");
      }

      syncMyPresence({
        inRoom: true,
        track: host?.track ?? currentTrackRef.current,
        isPlaying: host ? host.isPlaying : isPlayingRef.current,
        baseTime: host?.track ? host.baseTime : getLiveTime()
      });

      // Request exact RTT-compensated position + full shared upcoming queue
      if (roomChannelRef.current) {
        roomChannelRef.current.send({
          type: "broadcast",
          event: "request_room_state",
          payload: {
            requesterId: sessionIdRef.current,
            reqSentAt: Date.now()
          }
        });
      }
    },
    [playTrackFromContext, flashRoomActivity, syncMyPresence, getLiveTime]
  );

  // Apply incoming room sync from partner
  const applyRemoteSync = useCallback(
    (payload: RoomSyncPayload) => {
      if (!inRoomRef.current || document.visibilityState !== "visible") return;
      if (endFallbackTimerRef.current) clearTimeout(endFallbackTimerRef.current);

      // Always sync the shared upcoming queue
      if (Array.isArray(payload.manualQueue)) {
        setManualQueue(payload.manualQueue);
        manualQueueRef.current = payload.manualQueue;
      }

      if (payload.note) flashRoomActivity(payload.note);
      if (!payload.track) return;

      // Use clock-skew-free RTT when answering a join request; fall back to clamped delta otherwise
      let latencySec = 0;
      if (payload.isPlaying) {
        if (typeof payload.echoReqSentAt === "number") {
          latencySec = Math.min(2.5, Math.max(0, (Date.now() - payload.echoReqSentAt) / 2000));
        } else {
          latencySec = Math.min(3, Math.max(0, (Date.now() - payload.sentAt) / 1000));
        }
      }
      const targetTime = Math.max(0, (payload.currentTime || 0) + latencySec);
      const isSameTrack = currentTrackRef.current?.id === payload.track.id;

      if (!isSameTrack) {
        playTrackFromContext(payload.track, undefined, false, {
          startSeconds: targetTime,
          fromRemote: true,
          autoplay: payload.isPlaying,
          nextManualQueue: payload.manualQueue,
          suppressBroadcast: true
        });
      } else {
        markRemoteAction(900);
        const localTime = getLiveTime();
        const needsSeek = Math.abs(localTime - targetTime) > 1.8;

        if (payload.track.source === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
          if (needsSeek) {
            ytPlayerRef.current.seekTo(targetTime, true);
            setCurrentTime(targetTime);
            currentTimeRef.current = targetTime;
          }
          if (payload.isPlaying) {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
            isPlayingRef.current = true;
          } else {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
            isPlayingRef.current = false;
            setPendingAudioUnlock(null);
          }
        } else if (payload.track.source === "upload" && audioRef.current) {
          if (needsSeek) {
            audioRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);
            currentTimeRef.current = targetTime;
          }
          if (payload.isPlaying) {
            audioRef.current.play().catch(() => {
              setIsPlaying(false);
              isPlayingRef.current = false;
              setPendingAudioUnlock(payload);
            });
            setIsPlaying(true);
            isPlayingRef.current = true;
          } else {
            audioRef.current.pause();
            setIsPlaying(false);
            isPlayingRef.current = false;
            setPendingAudioUnlock(null);
          }
        }
      }

      syncMyPresence({
        inRoom: true,
        track: payload.track,
        isPlaying: payload.isPlaying,
        baseTime: targetTime
      });

      // Fallback detector if mobile browser blocked remote track change autoplay
      if (payload.isPlaying && payload.track.source === "youtube") {
        setTimeout(() => {
          if (!inRoomRef.current || document.visibilityState !== "visible") return;
          if (currentTrackRef.current?.id !== payload.track?.id) return;
          const ytState = ytPlayerRef.current?.getPlayerState?.();
          if (
            ytState !== undefined &&
            window.YT &&
            ytState !== window.YT.PlayerState.PLAYING &&
            ytState !== window.YT.PlayerState.BUFFERING
          ) {
            setPendingAudioUnlock(payload);
          }
        }, 1600);
      }
    },
    [flashRoomActivity, playTrackFromContext, markRemoteAction, getLiveTime, syncMyPresence]
  );

  useEffect(() => {
    applyRemoteSyncRef.current = applyRemoteSync;
  }, [applyRemoteSync]);

  const handleManualUnlock = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const payload = pendingAudioUnlock;
    if (!payload?.track) return;
    const track = payload.track;
    const elapsed = Math.min(30, Math.max(0, (Date.now() - payload.sentAt) / 1000));
    const targetTime = Math.max(0, (payload.currentTime || 0) + elapsed);
    setPendingAudioUnlock(null);
    playTrackFromContext(track, undefined, false, {
      startSeconds: targetTime,
      fromRemote: true,
      autoplay: true,
      suppressBroadcast: true
    });
  };

  // Auto-Fallback on embed-restricted YouTube tracks (Error 101 / 150)
  const handleYtPlaybackError = useCallback(
    async (errorCode: number) => {
      if (!currentTrack || currentTrack.source !== "youtube" || !currentTrack.videoId) {
        setIsPlaying(false);
        return;
      }

      const originalVid = currentTrack.videoId;
      if ((errorCode === 101 || errorCode === 150) && !fallbackTriedRef.current.has(originalVid)) {
        fallbackTriedRef.current.add(originalVid);
        showTempNotice("Official audio restricted — switching to playable version...", "info", 0);

        try {
          const q = `${currentTrack.displayName} ${currentTrack.artist && currentTrack.artist !== "YouTube Music" ? currentTrack.artist : ""}`.trim();
          const res = await fetch(`/api/ytmusic?action=search&embedFallback=1&q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            const alt = (data.tracks || []).find((t: any) => t.videoId && t.videoId !== originalVid);
            if (alt && ytPlayerRef.current && ytReadyRef.current) {
              fallbackTriedRef.current.add(alt.videoId);
              const altTrack: MusicTrack = {
                ...currentTrack,
                id: `yt:${alt.videoId}`,
                videoId: alt.videoId,
                url: `https://www.youtube.com/watch?v=${alt.videoId}`
              };
              playTrackFromContext(altTrack, undefined, false, { startSeconds: 0, autoplay: true });
              showTempNotice("Switched to embeddable version", "info", 2800);
              return;
            }
          }
        } catch (_) {}
      }

      showTempNotice("This upload blocks external playback. Try another result or tap Next.", "error", 5000);
      setIsPlaying(false);
    },
    [currentTrack, showTempNotice, playTrackFromContext]
  );

  useEffect(() => {
    handleYtErrorRef.current = handleYtPlaybackError;
  }, [handleYtPlaybackError]);

  const togglePlayPauseCurrent = () => {
    if (!currentTrack) {
      if (remoteHostWithTrack) joinMusicRoom();
      return;
    }

    if (!inRoomRef.current) {
      setInRoom(true);
      inRoomRef.current = true;
    }

    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (currentTrack.source === "youtube") ytPlayerRef.current?.pauseVideo();
      else audioRef.current?.pause();

      broadcastRoomSync({ isPlaying: false, note: `${identity} paused` });
    } else {
      setStatusNotice(null);
      setPendingAudioUnlock(null);
      setIsPlaying(true);
      isPlayingRef.current = true;

      if (currentTrack.source === "youtube" && currentTrack.videoId) {
        if (ytPlayerRef.current && ytReadyRef.current) {
          const loadedDur = ytPlayerRef.current.getDuration?.() || 0;
          if (loadedDur > 0) ytPlayerRef.current.playVideo();
          else ytPlayerRef.current.loadVideoById(currentTrack.videoId, currentTimeRef.current);
        } else {
          pendingYtCmdRef.current = {
            videoId: currentTrack.videoId,
            startSeconds: currentTimeRef.current,
            autoplay: true
          };
        }
      } else if (audioRef.current) {
        if (audioRef.current.src !== currentTrack.url) audioRef.current.src = currentTrack.url;
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
          isPlayingRef.current = false;
        });
      }

      broadcastRoomSync({ isPlaying: true, note: `${identity} resumed` });
    }
  };

  // --- SHARED UPCOMING QUEUE HELPERS ---
  const addToUpcomingQueue = (track: MusicTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextQueue = [...manualQueueRef.current, track];
    setManualQueue(nextQueue);
    manualQueueRef.current = nextQueue;
    showTempNotice(`Queued "${track.displayName}" — tap Next to play now`, "info", 2600);

    if (inRoomRef.current) {
      broadcastRoomSync({
        manualQueue: nextQueue,
        note: `${identity} queued ${track.displayName}`
      });
    }
  };

  const removeFromUpcomingQueue = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextQueue = manualQueueRef.current.filter((_, i) => i !== index);
    setManualQueue(nextQueue);
    manualQueueRef.current = nextQueue;
    if (inRoomRef.current) broadcastRoomSync({ manualQueue: nextQueue });
  };

  const moveQueueItemToTop = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (index <= 0) return;
    const copy = [...manualQueueRef.current];
    const [picked] = copy.splice(index, 1);
    copy.unshift(picked);
    setManualQueue(copy);
    manualQueueRef.current = copy;
    if (inRoomRef.current) broadcastRoomSync({ manualQueue: copy });
  };

  const clearUpcomingQueue = () => {
    setManualQueue([]);
    manualQueueRef.current = [];
    if (inRoomRef.current) {
      broadcastRoomSync({ manualQueue: [], note: `${identity} cleared the queue` });
    }
  };

  const playFromUpcomingQueue = (index: number) => {
    const copy = [...manualQueueRef.current];
    const [chosen] = copy.splice(index, 1);
    if (!chosen) return;
    setManualQueue(copy);
    manualQueueRef.current = copy;
    playTrackFromContext(chosen, undefined, chosen.source === "youtube", { nextManualQueue: copy });
  };

  const getEffectiveQueue = useCallback(() => {
    if (activeQueue.length > 0) return activeQueue;
    if (upNextTracks.length > 0) return upNextTracks;
    return vaultTracks;
  }, [activeQueue, upNextTracks, vaultTracks]);

  const playNext = useCallback(() => {
    // 1. Always play manually queued upcoming songs FIRST
    if (manualQueueRef.current.length > 0) {
      const [nextQueued, ...rest] = manualQueueRef.current;
      setManualQueue(rest);
      manualQueueRef.current = rest;
      playTrackFromContext(nextQueued, undefined, nextQueued.source === "youtube", {
        nextManualQueue: rest
      });
      return;
    }

    // 2. Otherwise fall back to active playlist / auto-radio
    const queue = getEffectiveQueue();
    if (queue.length === 0) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrackRef.current?.id);

    if (repeatMode === "off" && !isShuffle && currentIndex === queue.length - 1) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      broadcastRoomSync({ isPlaying: false });
      return;
    }

    let nextIndex = 0;
    if (isShuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % queue.length;
    }

    playTrackFromContext(queue[nextIndex], queue, false);
  }, [getEffectiveQueue, isShuffle, repeatMode, playTrackFromContext, broadcastRoomSync]);

  const playPrev = useCallback(() => {
    const queue = getEffectiveQueue();
    if (queue.length === 0) return;

    if (getLiveTime() > 3) {
      setCurrentTime(0);
      currentTimeRef.current = 0;
      if (currentTrackRef.current?.source === "youtube") ytPlayerRef.current?.seekTo(0, true);
      else if (audioRef.current) audioRef.current.currentTime = 0;
      if (inRoomRef.current) {
        broadcastRoomSync({ currentTime: 0, note: `${identity} restarted track` });
      }
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrackRef.current?.id);
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + queue.length) % queue.length;
    playTrackFromContext(queue[prevIndex], queue, false);
  }, [getEffectiveQueue, getLiveTime, playTrackFromContext, broadcastRoomSync, identity]);

  // Prevent double-skipping when two synced devices finish a track within milliseconds of each other
  const handleTrackEnd = useCallback(() => {
    const advanceNow = () => {
      if (repeatMode === "one" && currentTrackRef.current) {
        setCurrentTime(0);
        currentTimeRef.current = 0;
        if (currentTrackRef.current.source === "youtube") {
          ytPlayerRef.current?.seekTo(0, true);
          ytPlayerRef.current?.playVideo();
        } else if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        if (inRoomRef.current) broadcastRoomSync({ currentTime: 0, isPlaying: true });
      } else {
        playNext();
      }
    };

    const inRoomIds = roomMembersRef.current
      .filter((m) => m.inRoom)
      .map((m) => m.sessionId)
      .sort();

    // Designate lowest sessionId as auto-advance leader; partner waits 1.5s fallback so queue never double-pops
    const isLeader = inRoomIds.length <= 1 || inRoomIds[0] === sessionIdRef.current;

    if (isLeader) {
      advanceNow();
    } else {
      const endedTrackId = currentTrackRef.current?.id;
      if (endFallbackTimerRef.current) clearTimeout(endFallbackTimerRef.current);
      endFallbackTimerRef.current = setTimeout(() => {
        if (inRoomRef.current && currentTrackRef.current?.id === endedTrackId) {
          advanceNow();
        }
      }, 1500);
    }
  }, [repeatMode, playNext, broadcastRoomSync]);

  useEffect(() => {
    handleTrackEndRef.current = handleTrackEnd;
  }, [handleTrackEnd]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;
    if (currentTrack?.source === "youtube") {
      ytPlayerRef.current?.seekTo(newTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const commitSeekBroadcast = () => {
    isSeekingRef.current = false;
    if (inRoomRef.current) {
      broadcastRoomSync({
        currentTime: currentTimeRef.current,
        note: `${identity} jumped to ${formatDuration(currentTimeRef.current)}`
      });
    }
  };

  // Save / Unsave song into Shared Vault
  const toggleSaveToVault = async (track: MusicTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (track.source !== "youtube" || !track.videoId) return;
    const vid = track.videoId;

    setSavingVideoIds((prev) => new Set(prev).add(vid));
    try {
      if (savedVideoIdSet.has(vid)) {
        await supabase.from("vault_yt_tracks").delete().eq("video_id", vid);
      } else {
        const { error } = await supabase.from("vault_yt_tracks").upsert(
          {
            video_id: vid,
            display_name: track.displayName,
            artist: track.artist || "YouTube Music",
            thumbnail_url: track.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
          },
          { onConflict: "video_id" }
        );
        if (error) {
          showTempNotice("Run the 'vault_yt_tracks' SQL in Supabase to save songs.", "error", 4000);
        }
      }
      await fetchVaultMusic();
    } finally {
      setSavingVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(vid);
        return next;
      });
    }
  };

  // Import YT Music Playlist or Song URL
  const handleImportLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = linkInput.trim();
    if (!raw) return;

    setIsImportingLink(true);
    setStatusNotice(null);

    try {
      const playlistId = extractPlaylistId(raw);
      const videoId = extractYouTubeId(raw);

      if (playlistId && (!videoId || raw.includes("/playlist"))) {
        const res = await fetch(`/api/ytmusic?action=playlist&listId=${encodeURIComponent(playlistId)}`);
        const data = await res.json();
        const items: MusicTrack[] = Array.isArray(data.tracks) ? data.tracks.map(apiItemToTrack) : [];

        if (items.length === 0) {
          showTempNotice("No songs found. Set the YT Music playlist to Unlisted or Public.", "error", 4500);
        } else {
          const rows = items.map((t) => ({
            video_id: t.videoId!,
            display_name: t.displayName,
            artist: t.artist || "YouTube Music",
            thumbnail_url: t.thumbnail || null
          }));
          const { error } = await supabase.from("vault_yt_tracks").upsert(rows, { onConflict: "video_id" });
          if (error) {
            showTempNotice("Could not save playlist to Supabase.", "error", 4000);
          } else {
            setLinkInput("");
            showTempNotice(`Imported ${items.length} songs to Vault!`, "info", 3500);
            await fetchVaultMusic();
          }
        }
      } else if (videoId) {
        let title = `YouTube Song (${videoId})`;
        let artist = "YouTube Music";
        try {
          const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
          if (res.ok) {
            const meta = await res.json();
            if (meta?.title) title = meta.title;
            if (meta?.author_name) artist = meta.author_name.replace(/\s*-\s*Topic$/i, "");
          }
        } catch (_) {}

        const { error } = await supabase.from("vault_yt_tracks").upsert(
          {
            video_id: videoId,
            display_name: title,
            artist,
            thumbnail_url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          },
          { onConflict: "video_id" }
        );
        if (!error) {
          setLinkInput("");
          await fetchVaultMusic();
        }
      } else {
        showTempNotice("Paste a valid YT Music song or Unlisted playlist link.", "error", 3500);
      }
    } finally {
      setIsImportingLink(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("vault_music").upload(fileName, file);
    if (!error) await fetchVaultMusic();
    else showTempNotice("Upload failed. Check 'vault_music' bucket policies.", "error", 4000);
    setIsUploading(false);
    e.target.value = "";
  };

  const startRenaming = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(track.id);
    setEditNameValue(track.displayName);
  };

  const saveRename = async (track: MusicTrack) => {
    const trimmed = editNameValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setIsSavingName(true);

    let error = null;
    if (track.source === "youtube" && track.videoId) {
      const res = await supabase.from("vault_yt_tracks").update({ display_name: trimmed }).eq("video_id", track.videoId);
      error = res.error;
    } else if (track.fileName) {
      const res = await supabase
        .from("vault_music_meta")
        .upsert(
          { file_name: track.fileName, display_name: trimmed, updated_at: new Date().toISOString() },
          { onConflict: "file_name" }
        );
      error = res.error;
    }

    if (!error) {
      setVaultTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, displayName: trimmed } : t)));
      setCurrentTrack((prev) => (prev && prev.id === track.id ? { ...prev, displayName: trimmed } : prev));
    }
    setIsSavingName(false);
    setEditingId(null);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isCurrentSaved = Boolean(currentTrack?.videoId && savedVideoIdSet.has(currentTrack.videoId));

  // Reusable Discord-Style Voice/Music Room Status Strip
  const renderDiscordRoomBar = () => (
    <div className="relative z-10 px-3 sm:px-6 py-2.5 bg-[#0d141d] border-b border-white/[0.06] flex items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            inRoom
              ? "bg-[#00A884]/15 border-[#00c896]/40 text-[#34d399]"
              : remoteHostWithTrack
              ? "bg-[#9333EA]/20 border-[#F472B6]/40 text-[#F472B6]"
              : "bg-white/[0.04] border-white/10 text-white/45"
          }`}
        >
          <Headphones className="w-4 h-4" />
        </div>

        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Music Room</span>
            {activeListeners.length > 0 && (
              <div className="flex items-center gap-1">
                {activeListeners.map((member) => (
                  <span
                    key={member.sessionId}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#00A884]/15 text-[#34d399] border border-[#00c896]/30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
                    {member.user}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-white/45 truncate mt-0.5">
            {inRoom
              ? roomActivity ||
                (activeListeners.length >= 2
                  ? "Connected together • Controls & queue synced live"
                  : "You're live in the room — partner can join anytime")
              : remoteHostWithTrack?.track
              ? `${remoteHostWithTrack.user} is listening to "${remoteHostWithTrack.track.displayName}"`
              : "Play any song or join the room to listen together"}
          </p>
        </div>
      </div>

      {inRoom ? (
        <button
          onClick={() => leaveRoomAndStop(false)}
          className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave</span>
        </button>
      ) : (
        <button
          onClick={joinMusicRoom}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#00A884] to-[#10b981] hover:brightness-110 text-[#051813] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-[0_0_18px_rgba(0,168,132,0.35)] transition-all flex-shrink-0"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>{remoteHostWithTrack ? "Join Room" : "Start Room"}</span>
        </button>
      )}
    </div>
  );

  // Reusable Full Player Deck (Desktop Left Panel + Mobile Expanded Modal)
  const renderFullPlayerDeck = (isMobileModal = false) => (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto">
      {/* Album Art */}
      <div className="relative mb-5">
        <div
          className={`absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#9333EA] to-[#F472B6] blur-3xl transition-opacity duration-700 ${
            isPlaying && !isMuted ? "opacity-35" : "opacity-15"
          }`}
        />
        <div
          className={`relative ${
            isMobileModal ? "w-52 h-52" : "w-44 h-44"
          } rounded-3xl bg-[#111822] border border-white/15 flex items-center justify-center shadow-2xl overflow-hidden`}
        >
          {currentTrack?.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.displayName}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? "scale-105" : "scale-100"}`}
            />
          ) : (
            <Disc3 className={`w-20 h-20 text-[#F472B6]/80 ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "8s" }} />
          )}
        </div>
      </div>

      {/* Title, Artist & Save Heart */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 px-1">
        <div className="min-w-0 text-left flex-1">
          <h3 className="text-lg font-semibold text-white truncate">
            {currentTrack ? currentTrack.displayName : remoteHostWithTrack?.track ? remoteHostWithTrack.track.displayName : "No track playing"}
          </h3>
          <p className="text-xs text-white/50 truncate mt-0.5">
            {currentTrack
              ? currentTrack.artist || "YouTube Music"
              : remoteHostWithTrack?.track
              ? `Playing in ${remoteHostWithTrack.user}'s room`
              : "Search or tap Discover to start"}
          </p>
        </div>

        {currentTrack?.source === "youtube" && (
          <button
            onClick={(e) => toggleSaveToVault(currentTrack, e)}
            title={isCurrentSaved ? "Remove from Vault" : "Save to Shared Vault"}
            className={`p-2.5 rounded-full border transition-all flex-shrink-0 ${
              isCurrentSaved
                ? "bg-[#F472B6]/15 border-[#F472B6]/40 text-[#F472B6]"
                : "bg-white/[0.05] border-white/10 text-white/55 hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isCurrentSaved ? "fill-[#F472B6]" : ""}`} />
          </button>
        )}
      </div>

      {/* Tap to Unlock Audio if Mobile Blocked Remote Autoplay */}
      {pendingAudioUnlock && (
        <button
          onClick={handleManualUnlock}
          className="w-full mb-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00A884] to-[#10b981] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse"
        >
          <Play className="w-4 h-4 fill-black" /> Tap to Unmute Room Audio
        </button>
      )}

      {/* Status / Error Banner */}
      <AnimatePresence>
        {statusNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full mb-3 text-[11px] px-3 py-2 rounded-xl flex items-start gap-2 border ${
              statusNotice.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-[#F472B6]/10 border-[#F472B6]/30 text-pink-200"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="flex-1 text-left">{statusNotice.text}</span>
            <button onClick={() => setStatusNotice(null)}><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Timestamp Scrubber */}
      <div className="w-full space-y-1.5 mb-5">
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
            step={0.5}
            value={currentTime}
            onMouseDown={() => { isSeekingRef.current = true; }}
            onMouseUp={commitSeekBroadcast}
            onTouchStart={() => { isSeekingRef.current = true; }}
            onTouchEnd={commitSeekBroadcast}
            onChange={handleSeek}
            disabled={!currentTrack}
            aria-label="Seek track"
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

      {/* Main Transport Controls */}
      <div className="w-full flex items-center justify-between px-2">
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
          onClick={togglePlayPauseCurrent}
          disabled={!currentTrack && !remoteHostWithTrack}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,114,182,0.45)] hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button
          onClick={playNext}
          title={manualQueue.length > 0 ? `Play Next: ${manualQueue[0].displayName}` : "Next"}
          className="relative p-2.5 text-white/80 hover:text-white active:scale-90 transition-transform"
        >
          <SkipForward className="w-6 h-6" />
          {manualQueue.length > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#00c896] text-black text-[9px] font-bold flex items-center justify-center">
              {manualQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setRepeatMode((p) => (p === "all" ? "one" : p === "one" ? "off" : "all"))}
          title={`Repeat: ${repeatMode}`}
          className={`p-2 rounded-full transition-colors ${repeatMode !== "off" ? "text-[#F472B6] bg-[#F472B6]/10" : "text-white/45 hover:text-white"}`}
        >
          {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
        </button>
      </div>

      {/* Volume Row */}
      <div className="w-full max-w-[230px] flex items-center gap-3 mt-5">
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
  );

  // Reusable Track Row for Search / Discover / Radio
  const renderStreamTrackRow = (track: MusicTrack, contextList: MusicTrack[], triggerRadio: boolean, keySuffix = "") => {
    const isCurrent = currentTrack?.id === track.id;
    const isSaved = Boolean(track.videoId && savedVideoIdSet.has(track.videoId));
    const isSaving = Boolean(track.videoId && savingVideoIds.has(track.videoId));

    return (
      <div
        key={`${track.id}-${keySuffix}`}
        onClick={() => {
          if (isCurrent) togglePlayPauseCurrent();
          else playTrackFromContext(track, contextList, triggerRadio);
        }}
        className={`group flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer ${
          isCurrent
            ? "bg-gradient-to-r from-[#9333EA]/20 to-[#F472B6]/15 border-[#F472B6]/40 shadow-lg"
            : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.06]">
            {track.thumbnail && <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />}
            <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? "bg-black/45" : "bg-black/20 group-hover:bg-black/45"}`}>
              {isCurrent && isPlaying ? (
                <Pause className="w-4 h-4 text-[#F472B6]" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className={`text-sm truncate ${isCurrent ? "text-white font-semibold" : "text-white/90"}`}>
              {track.displayName}
            </p>
            <p className="text-[11px] text-white/45 truncate mt-0.5">
              {track.artist || "YouTube Music"}
              {track.duration ? ` • ${formatDuration(track.duration)}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => addToUpcomingQueue(track, e)}
            title="Add to Upcoming Queue"
            className="p-2 rounded-xl text-white/50 hover:text-[#00c896] hover:bg-[#00c896]/10 transition-colors"
          >
            <ListPlus className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => toggleSaveToVault(track, e)}
            disabled={isSaving}
            title={isSaved ? "Saved in Vault" : "Save to Shared Vault"}
            className={`p-2 rounded-xl transition-colors ${
              isSaved
                ? "text-[#F472B6] bg-[#F472B6]/10"
                : "text-white/40 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${isSaved ? "fill-[#F472B6]" : ""}`} />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Persistent HTML5 Audio Engine (Uploaded MP3s) */}
      <audio
        ref={audioRef}
        muted={isMuted}
        onTimeUpdate={() => {
          if (currentTrack?.source === "upload" && !isSeekingRef.current) {
            setCurrentTime(audioRef.current?.currentTime || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (currentTrack?.source === "upload") {
            setDuration(audioRef.current?.duration || 0);
          }
        }}
        onEnded={() => {
          if (currentTrack?.source === "upload") handleTrackEnd();
        }}
      />

      {/* Persistent Offscreen YouTube IFrame Engine */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] w-[200px] h-[200px] opacity-0 pointer-events-none overflow-hidden"
      >
        <div ref={ytContainerRef} />
      </div>

      {/* TOP-CENTER DISCORD-STYLE ROOM PILL (Visible across Home & Chat) */}
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[999990] flex flex-col items-center gap-1.5">
        {!inRoom && remoteHostWithTrack ? (
          /* Partner is live in the Room -> One-Tap Join straight from Chat! */
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#101822]/95 backdrop-blur-xl border border-[#00c896]/55 rounded-full pl-2.5 pr-1.5 py-1 flex items-center gap-2 shadow-[0_6px_26px_rgba(0,168,132,0.28)]"
          >
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-white/90"
            >
              <span className="w-2 h-2 rounded-full bg-[#00c896] animate-pulse flex-shrink-0" />
              <span className="max-w-[92px] sm:max-w-[150px] truncate font-medium">
                {remoteHostWithTrack.track
                  ? remoteHostWithTrack.track.displayName
                  : `${remoteHostWithTrack.user} in Room`}
              </span>
            </button>
            <button
              onClick={joinMusicRoom}
              className="bg-[#00A884] hover:bg-[#00c298] text-[#051813] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
            >
              <Headphones className="w-3 h-3" /> Join
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsLibraryOpen(true)}
            className={`bg-[#111820]/90 backdrop-blur-xl border ${
              inRoom ? "border-[#00c896]/55" : "border-white/10 hover:border-[#F472B6]/50"
            } text-white/90 px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-2 shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition-all`}
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
              {inRoom && currentTrack ? currentTrack.displayName : "Music"}
            </span>
            {inRoom && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#34d399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
                {activeListeners.length || 1}
              </span>
            )}
          </motion.button>
        )}

        {/* Fallback unlock button over Chat if mobile browser paused a remote track switch */}
        <AnimatePresence>
          {!isLibraryOpen && pendingAudioUnlock && (
            <motion.button
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onClick={handleManualUnlock}
              className="bg-[#00A884] text-black font-bold text-[11px] px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-black" /> Tap to hear Room
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* FULL-SCREEN VAULT MUSIC ROOM APP */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[9999999] bg-[#070a0f] text-white flex flex-col w-screen h-[100dvh] overflow-hidden"
          >
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-b from-[#9333EA]/20 via-[#F472B6]/10 to-transparent blur-3xl" />

            {/* Top Header */}
            <div className="relative z-10 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/[0.07] bg-[#0b1017]/85 backdrop-blur-xl flex-shrink-0 gap-2">
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="flex items-center gap-1.5 text-white/75 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 rounded-full text-xs font-medium transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="text-center">
                <h2 className="text-sm font-semibold tracking-wider uppercase text-white">Vault Music</h2>
                <p className="text-[10px] text-white/40 font-mono">YouTube Music • Live Room</p>
              </div>

              <label className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-medium px-3 py-2 rounded-full cursor-pointer transition-all flex-shrink-0">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#F472B6]" />}
                <span>{isUploading ? "..." : "MP3"}</span>
                <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>

            {/* DISCORD-STYLE VOICE / MUSIC ROOM BAR */}
            {renderDiscordRoomBar()}

            {/* Mobile Toast Notice */}
            <AnimatePresence>
              {statusNotice && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`lg:hidden relative z-10 px-4 py-1.5 border-b border-white/[0.06] text-center text-[11px] font-mono flex-shrink-0 ${
                    statusNotice.type === "error" ? "bg-red-950/60 text-red-300" : "bg-[#121a24] text-pink-200"
                  }`}
                >
                  {statusNotice.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Body Split */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row max-w-6xl w-full mx-auto overflow-hidden">
              
              {/* DESKTOP LEFT PANEL */}
              <div className="hidden lg:flex w-[40%] p-8 flex-col items-center justify-center border-r border-white/[0.06] flex-shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
                {renderFullPlayerDeck(false)}
              </div>

              {/* MAIN CONTENT AREA: 4-Tab Browser */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                
                {/* Navigation Tabs */}
                <div className="grid grid-cols-4 gap-1 px-3 sm:px-6 pt-3 pb-2 border-b border-white/[0.06] flex-shrink-0">
                  {[
                    { id: "discover" as ActiveTab, label: "Discover", icon: Compass },
                    { id: "search" as ActiveTab, label: "Search", icon: Search },
                    {
                      id: "upnext" as ActiveTab,
                      label: manualQueue.length > 0 ? `Queue (${manualQueue.length})` : "Queue",
                      icon: Radio
                    },
                    { id: "vault" as ActiveTab, label: `Vault (${vaultTracks.length})`, icon: ListMusic }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-[#9333EA]/25 to-[#F472B6]/20 text-white border border-[#F472B6]/35"
                            : "text-white/50 hover:text-white/85 hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? "text-[#F472B6]" : ""}`} />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: DISCOVER / RECOMMENDATIONS */}
                {activeTab === "discover" && (
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6 pb-6">
                    {isLoadingHome ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/45">
                        <Loader2 className="w-6 h-6 text-[#F472B6] animate-spin" />
                        <span className="text-xs font-mono">Loading recommendations...</span>
                      </div>
                    ) : homeShelves.length === 0 ? (
                      <div className="text-center py-16 text-white/45 space-y-2">
                        <Compass className="w-8 h-8 mx-auto opacity-40" />
                        <p className="text-sm">Could not load recommendations right now.</p>
                        <button onClick={() => setActiveTab("search")} className="text-xs text-[#F472B6] underline">
                          Use Search instead
                        </button>
                      </div>
                    ) : (
                      homeShelves.map((shelf, sIdx) => (
                        <div key={shelf.title} className="space-y-2.5">
                          <h3 className="text-xs font-mono uppercase tracking-widest text-white/55 px-1">
                            {shelf.title}
                          </h3>
                          <div className="space-y-2">
                            {shelf.items.map((track, idx) =>
                              renderStreamTrackRow(track, shelf.items, true, `d-${sIdx}-${idx}`)
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: SEARCH ALL OF YOUTUBE MUSIC */}
                {activeTab === "search" && (
                  <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        runSearch(searchQuery);
                      }}
                      className="flex items-center gap-2 mb-4 flex-shrink-0"
                    >
                      <div className="flex-1 flex items-center gap-2.5 bg-white/[0.06] border border-white/10 focus-within:border-[#F472B6]/60 rounded-2xl px-4 py-3 transition-colors">
                        <Search className="w-4 h-4 text-[#F472B6] flex-shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search any song, artist, or album on YT Music..."
                          className="flex-1 min-w-0 bg-transparent text-sm text-white focus:outline-none placeholder:text-white/35"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
                      {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/45">
                          <Loader2 className="w-6 h-6 text-[#F472B6] animate-spin" />
                          <span className="text-xs font-mono">Searching YouTube Music...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((track, idx) => renderStreamTrackRow(track, searchResults, true, `s-${idx}`))
                      ) : searchQuery.trim() ? (
                        <p className="text-center text-xs text-white/40 py-14">No songs found for “{searchQuery}”.</p>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-14 space-y-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                            <Search className="w-6 h-6 text-[#F472B6]/80" />
                          </div>
                          <div>
                            <p className="text-sm text-white/85 font-medium">Play or Queue anything in the Room</p>
                            <p className="text-xs text-white/40 mt-1 max-w-xs">
                              Tap a song to play right now, or tap the + queue icon to play it after the current song (or hit Next to skip straight to it).
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 pt-1 max-w-sm">
                            {["Arijit Singh", "The Weeknd", "Pritam", "Lana Del Rey", "Anuv Jain", "Bollywood Romance"].map((chip) => (
                              <button
                                key={chip}
                                onClick={() => setSearchQuery(chip)}
                                className="text-[11px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/75 px-3 py-1.5 rounded-full transition-colors"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SHARED ROOM QUEUE + AUTO-RECOMMENDED RADIO */}
                {activeTab === "upnext" && (
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6 pb-6">
                    
                    {/* SECTION A: UPCOMING ROOM QUEUE */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#00c896] flex items-center gap-1.5">
                          <ListPlus className="w-3.5 h-3.5" /> Room Queue ({manualQueue.length})
                        </span>
                        {manualQueue.length > 0 && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={playNext}
                              className="text-[11px] font-semibold text-[#34d399] hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <SkipForward className="w-3.5 h-3.5" /> Play Next Now
                            </button>
                            <button
                              onClick={clearUpcomingQueue}
                              className="text-[11px] text-white/45 hover:text-red-400 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {manualQueue.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center text-xs text-white/40">
                          Queue is empty. Tap <ListPlus className="w-3.5 h-3.5 inline mx-0.5 text-[#00c896]" /> on any song to line it up next—then let it play automatically or hit Next to skip to it.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {manualQueue.map((track, idx) => (
                            <div
                              key={`q-${track.id}-${idx}`}
                              onClick={() => playFromUpcomingQueue(idx)}
                              className="group flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl border border-[#00c896]/25 bg-[#00A884]/[0.07] hover:bg-[#00A884]/[0.12] transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="text-[11px] font-mono text-[#34d399] w-4 text-center flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.06] flex items-center justify-center">
                                  {track.thumbnail ? (
                                    <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Music className="w-4 h-4 text-[#F472B6]" />
                                  )}
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Play className="w-4 h-4 text-white ml-0.5" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="text-sm text-white font-medium truncate">{track.displayName}</p>
                                  <p className="text-[11px] text-white/45 truncate">
                                    {track.artist || "Queued Track"} • Tap to play now
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                {idx > 0 && (
                                  <button
                                    onClick={(e) => moveQueueItemToTop(idx, e)}
                                    title="Move to top of queue"
                                    className="p-1.5 rounded-lg text-white/45 hover:text-[#34d399] hover:bg-white/[0.08] transition-colors"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => removeFromUpcomingQueue(idx, e)}
                                  title="Remove from queue"
                                  className="p-1.5 rounded-lg text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION B: AUTO-RECOMMENDED RADIO */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-mono uppercase tracking-widest text-white/50">
                          Auto-Recommended Radio
                        </span>
                        <span className="text-[11px] text-[#F472B6]">After queue finishes</span>
                      </div>

                      {isLoadingUpNext ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-white/45">
                          <Loader2 className="w-5 h-5 text-[#F472B6] animate-spin" />
                          <span className="text-xs font-mono">Loading related tracks...</span>
                        </div>
                      ) : upNextTracks.length === 0 ? (
                        <div className="text-center py-10 text-white/40 space-y-1.5">
                          <Radio className="w-8 h-8 mx-auto opacity-30" />
                          <p className="text-xs">Play any YouTube Music track to fill auto-radio.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {upNextTracks.map((track, idx) =>
                            renderStreamTrackRow(
                              track,
                              [currentTrack!, ...upNextTracks].filter(Boolean),
                              false,
                              `u-${idx}`
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: SHARED VAULT PLAYLIST + IMPORT YT PLAYLIST */}
                {activeTab === "vault" && (
                  <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5">
                    <form onSubmit={handleImportLink} className="flex items-center gap-2 mb-3.5 flex-shrink-0">
                      <div className="flex-1 flex items-center gap-2 bg-white/[0.05] border border-white/10 focus-within:border-[#F472B6]/60 rounded-2xl px-3.5 py-2.5 transition-colors">
                        <Link2 className="w-4 h-4 text-[#F472B6] flex-shrink-0" />
                        <input
                          type="text"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          placeholder="Paste YT Music playlist (Unlisted/Public) or song link..."
                          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-white focus:outline-none placeholder:text-white/35"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isImportingLink || !linkInput.trim()}
                        className="bg-gradient-to-r from-[#9333EA] to-[#F472B6] hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-pink-500/20 flex-shrink-0"
                      >
                        {isImportingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Import</span>
                      </button>
                    </form>

                    <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
                      <span className="text-xs font-mono uppercase tracking-widest text-white/45">
                        Saved For Both Of You
                      </span>
                      <span className="text-[11px] text-white/35">Queue, play, or rename</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
                      {vaultTracks.length === 0 ? (
                        <div className="text-center py-14 text-white/40 space-y-2">
                          <Music className="w-9 h-9 mx-auto opacity-30" />
                          <p className="text-sm">Your shared Vault playlist is empty.</p>
                          <p className="text-xs text-white/30">
                            Tap the heart on any song in Search/Discover, or import your YT Music playlist above.
                          </p>
                        </div>
                      ) : (
                        vaultTracks.map((track, idx) => {
                          const isCurrent = currentTrack?.id === track.id;
                          const isEditing = editingId === track.id;

                          return (
                            <div
                              key={track.id}
                              onClick={() => {
                                if (isEditing) return;
                                if (isCurrent) togglePlayPauseCurrent();
                                else playTrackFromContext(track, vaultTracks, false);
                              }}
                              className={`group flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-gradient-to-r from-[#9333EA]/20 to-[#F472B6]/15 border-[#F472B6]/40 shadow-lg"
                                  : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/[0.06]">
                                  {track.thumbnail ? (
                                    <>
                                      <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                                      <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? "bg-black/45" : "bg-black/25 group-hover:bg-black/45"}`}>
                                        {isCurrent && isPlaying ? <Pause className="w-4 h-4 text-[#F472B6]" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                                      </div>
                                    </>
                                  ) : isCurrent && isPlaying ? (
                                    <Pause className="w-4 h-4 text-[#F472B6]" />
                                  ) : isCurrent ? (
                                    <Play className="w-4 h-4 text-[#F472B6] ml-0.5" />
                                  ) : (
                                    <span className="text-xs font-mono text-white/55">{idx + 1}</span>
                                  )}
                                </div>

                                {isEditing ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      saveRename(track);
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
                                      onClick={() => setEditingId(null)}
                                      className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </form>
                                ) : (
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className={`text-sm truncate ${isCurrent ? "text-white font-semibold" : "text-white/85"}`}>
                                      {track.displayName}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={`text-[9px] font-mono uppercase px-1.5 py-[1px] rounded ${track.source === "youtube" ? "bg-red-500/15 text-red-300" : "bg-purple-500/15 text-purple-300"}`}>
                                        {track.source === "youtube" ? "YT" : "MP3"}
                                      </span>
                                      <span className="text-[11px] text-white/40 truncate">
                                        {track.artist || "Vault Track"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {!isEditing && (
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <button
                                    onClick={(e) => addToUpcomingQueue(track, e)}
                                    title="Add to Room Queue"
                                    className="p-2 rounded-xl text-white/45 hover:text-[#00c896] hover:bg-[#00c896]/10 transition-colors"
                                  >
                                    <ListPlus className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => startRenaming(track, e)}
                                    title="Rename song for both"
                                    className="p-2 rounded-xl text-white/40 hover:text-[#F472B6] hover:bg-white/[0.07] transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {track.source === "youtube" && (
                                    <button
                                      onClick={(e) => toggleSaveToVault(track, e)}
                                      title="Remove from Vault"
                                      className="p-2 rounded-xl text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE BOTTOM MINI-PLAYER BAR */}
            {currentTrack && (
              <div
                onClick={() => setMobilePlayerExpanded(true)}
                className="lg:hidden relative z-20 bg-[#101720]/95 backdrop-blur-2xl border-t border-white/10 px-3.5 py-2.5 flex-shrink-0 cursor-pointer pb-[max(10px,env(safe-area-inset-bottom))]"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#9333EA] to-[#F472B6]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {pendingAudioUnlock ? (
                  <button
                    onClick={handleManualUnlock}
                    className="w-full py-2 rounded-xl bg-[#00A884] text-black font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black" /> Tap to Unmute Room Audio
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                        {currentTrack.thumbnail ? (
                          <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Disc3 className="w-5 h-5 text-[#F472B6]" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-semibold text-white truncate">{currentTrack.displayName}</p>
                        <p className="text-[10px] text-white/45 truncate">
                          {manualQueue.length > 0
                            ? `Next: ${manualQueue[0].displayName}`
                            : currentTrack.artist || "Tap for controls"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={togglePlayPauseCurrent}
                        className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] text-white flex items-center justify-center shadow-lg"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <button
                        onClick={playNext}
                        className="relative p-2 text-white/75 hover:text-white"
                        title="Next"
                      >
                        <SkipForward className="w-5 h-5" />
                        {manualQueue.length > 0 && (
                          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-[#00c896] text-black text-[8px] font-bold flex items-center justify-center">
                            {manualQueue.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MOBILE EXPANDED FULL-SCREEN PLAYER OVERLAY */}
            <AnimatePresence>
              {mobilePlayerExpanded && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  className="lg:hidden fixed inset-0 z-50 bg-[#070a0f] flex flex-col p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setMobilePlayerExpanded(false)}
                      className="p-2 rounded-full bg-white/[0.06] text-white/80 hover:text-white"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-white/45">
                      {inRoom ? `Music Room • ${activeListeners.length || 1} Live` : "Now Playing"}
                    </span>
                    <button
                      onClick={() => {
                        setMobilePlayerExpanded(false);
                        setActiveTab("upnext");
                      }}
                      className="p-2 rounded-full bg-white/[0.06] text-white/80 hover:text-[#F472B6] relative"
                      title="Room Queue"
                    >
                      <ListMusic className="w-4 h-4" />
                      {manualQueue.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00c896] text-black text-[9px] font-bold flex items-center justify-center">
                          {manualQueue.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    {renderFullPlayerDeck(true)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}