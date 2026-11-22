"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile, Send, CheckCheck, X, Trash2, Reply, SmilePlus,
  Image as ImageIcon, Download, Palette, ArrowLeft, Search,
  Upload, ChevronUp, ChevronDown, Loader2, Link2, Sparkles,
  ArrowDown, Gift, Maximize, Copy, Check, Music, Play, LayoutGrid
} from "lucide-react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { supabase } from "../lib/supabase";
import VaultGallery, { uploadMediaToVault, downloadVaultMedia } from "./VaultGallery";

const GIPHY_API_KEY = "m8EagdbaKHSgg529mP9wVp1qenRWNMkp";
const START_INDEX = 100000;
const PAGE_SIZE = 35;

type Message = {
  id: string;
  sender: string;
  text: string;
  created_at: string;
  reply_to?: string | null;
  reaction?: string | null;
  deleted?: boolean;
  media_url?: string | null;
  media_type?: string | null;
};

type VirtuosoContext = {
  isLoadingOlder: boolean;
  isMemoriesUnlocked: boolean;
  hasMoreRecent: boolean;
  hasMoreArchive: boolean;
  messagesCount: number;
  onUnlockMemories: () => void;
};

const EMOJI_CATEGORIES = {
  smileys: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗",
    "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕",
    "🙁", "☹", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
    "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😴", "🤤", "😷", "🤒",
    "🤕", "🤢", "🤮", "🤧", "🥴", "😵", "🤠", "🫠", "🫥", "🫡", "🫢", "🫣", "🫤",
    "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
  ],
  gestures: [
    "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝", "👍",
    "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂",
    "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄", "💋", "🫶", "🫱", "🫲", "🫳", "🫴", "🫰", "🫵"
  ],
  hearts: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌",
    "👥", "👤", "🗣", "💋", "💍", "💎", "🌹", "👑", "💐", "🌷", "🌸", "💮", "🏵️", "🌻", "🌼", "🍂", "🍁", "🫀", "🫁"
  ],
  objects: [
    "🎉", "🎊", "🎈", "🎂", "🎁", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🥏", "🎱",
    "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️",
    "🥌", "🎿", "🏄", "🪂", "🤺", "🐶", "🐱", "🦄", "⭐", "✨", "🔥", "🚀", "💫", "💡", "🔮", "🪄", "🧸", "🕯️"
  ]
};

const QUICK_REACTIONS = ["❤️", "😂", "🔥", "🥹", "👍", "🎉"];

const WALLPAPERS = [
  { name: "Obsidian Vault", class: "bg-[#080d12]" },
  { name: "Midnight Purple", class: "bg-gradient-to-br from-[#170928] via-[#090d16] to-[#05060a]" },
  { name: "Romantic Rose", class: "bg-gradient-to-br from-[#2d081d] via-[#0e121c] to-[#06070b]" },
  { name: "Cosmic Nebula", class: "bg-gradient-to-br from-[#0c1426] via-[#240e32] to-[#121030]" },
  { name: "Velvet Noir", class: "bg-[#050507]" }
];

const formatDisplayName = (name: string) => (name === "Kripton" ? "onegame" : name);

const formatDateLabel = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const renderFormattedText = (text: string) => {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-sky-300 underline underline-offset-2 hover:text-sky-200 break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const VaultHeader = ({ context }: { context?: VirtuosoContext }) => {
  if (!context) return null;
  const {
    isLoadingOlder,
    isMemoriesUnlocked,
    hasMoreRecent,
    hasMoreArchive,
    messagesCount,
    onUnlockMemories
  } = context;

  const canStillScrollUp = isMemoriesUnlocked ? hasMoreArchive : hasMoreRecent;

  return (
    <div className="flex flex-col items-center justify-center my-5 space-y-3 px-4">
      {isLoadingOlder && (
        <div className="flex items-center gap-2 bg-[#121a22]/90 border border-white/10 text-white/70 text-[11px] font-mono px-3.5 py-1.5 rounded-full shadow-md">
          <Loader2 className="w-3.5 h-3.5 text-[#00c896] animate-spin" />
          Loading older messages...
        </div>
      )}

      {!isLoadingOlder && !canStillScrollUp && (
        <span className="bg-[#111922]/85 backdrop-blur-md border border-white/[0.06] text-white/45 text-[10px] px-3.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
          🔒 End-to-End Encrypted Vault
        </span>
      )}

      {!isMemoriesUnlocked && !hasMoreRecent && (
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-md relative group mt-2 mb-2"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F472B6] to-[#9333EA] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 animate-pulse" />
          <div className="relative bg-[#0f1620]/95 backdrop-blur-xl border border-[#F472B6]/30 rounded-3xl p-5 text-center shadow-2xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#9333EA] opacity-15 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F472B6] opacity-15 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-3.5">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9333EA] to-[#F472B6] rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                  <Gift className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#D8B4FE] font-bold text-sm uppercase tracking-widest mb-1">
                  A Special Birthday Surprise
                </h3>
                <p className="text-[11px] text-white/55 leading-relaxed px-2">
                  Your recent messages are loaded. A secured time capsule containing every memory, late-night conversation, and joke from 2024 to 2026 is waiting for you.
                </p>
              </div>
              <button
                onClick={onUnlockMemories}
                disabled={isLoadingOlder}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#F472B6] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 disabled:opacity-50"
              >
                {isLoadingOlder ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                {isLoadingOlder ? "Unwrapping Memories..." : "Unwrap Memories (2024–2026)"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {isMemoriesUnlocked && !hasMoreArchive && (
        <div className="flex items-center gap-1.5 text-[#F472B6] text-[11px] font-mono bg-[#F472B6]/10 border border-[#F472B6]/30 px-3.5 py-1 rounded-full backdrop-blur-md">
          <Gift className="w-3.5 h-3.5" /> Beginning of Time Capsule ({messagesCount.toLocaleString()} loaded)
        </div>
      )}
    </div>
  );
};

const VaultFooter = () => <div className="h-3" />;

export default function WhatsAppVault({ identity, onClose }: { identity: string; onClose: () => void }) {
  const partnerName = identity === "Kripton" ? "Moon" : "Kripton";
  const partnerDisplayName = formatDisplayName(partnerName);

  const [chatState, setChatState] = useState<{
    items: Message[];
    firstItemIndex: number;
  }>({
    items: [],
    firstItemIndex: START_INDEX
  });

  const messages = chatState.items;
  const firstItemIndex = chatState.firstItemIndex;

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isMemoriesUnlocked, setIsMemoriesUnlocked] = useState(false);
  const [hasMoreRecent, setHasMoreRecent] = useState(true);
  const [hasMoreArchive, setHasMoreArchive] = useState(true);

  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pickerTab, setPickerTab] = useState<"emoji" | "gif" | null>(null);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [uploadingMediaText, setUploadingMediaText] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [gifSearch, setGifSearch] = useState("");
  const [giphyResults, setGiphyResults] = useState<{ id: string; title: string; url: string }[]>([]);
  const [isFetchingGifs, setIsFetchingGifs] = useState(false);

  const [linkingReplyFor, setLinkingReplyFor] = useState<string | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [mobileSheetMsg, setMobileSheetMsg] = useState<Message | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [useSongCoverBg, setUseSongCoverBg] = useState<boolean>(true);
  const [roomCoverBg, setRoomCoverBg] = useState<string | null>(null);
  const [currentBgStyle, setCurrentBgStyle] = useState<string>("bg-[#080d12]");
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [partnerOnline, setPartnerOnline] = useState(false);
  const [lastSeenTime, setLastSeenTime] = useState<string>("offline");
  const [partnerTyping, setPartnerTyping] = useState(false);

  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingReadyRef = useRef(false);

  const cutoffRef = useRef<string>(new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  const messagesRef = useRef<Message[]>([]);
  const isAtBottomRef = useRef<boolean>(true);
  const isLoadingOlderRef = useRef<boolean>(false);
  const isMemoriesUnlockedRef = useRef<boolean>(false);
  const hasMoreRecentRef = useRef<boolean>(true);
  const hasMoreArchiveRef = useRef<boolean>(true);
  const canPaginateRef = useRef<boolean>(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const win = window as Window & { __vaultRoomCover?: string | null };
    setRoomCoverBg(win.__vaultRoomCover || null);

    const onCoverChange = (e: Event) => {
      const detail = (e as CustomEvent<{ coverUrl: string | null }>).detail;
      setRoomCoverBg(detail?.coverUrl || null);
    };

    window.addEventListener("vault-room-cover", onCoverChange);
    return () => window.removeEventListener("vault-room-cover", onCoverChange);
  }, []);

  const activeSongCover = useSongCoverBg && roomCoverBg ? roomCoverBg : null;

  const mergeMessages = useCallback((incoming: Message[]) => {
    if (!incoming || incoming.length === 0) return;

    setChatState((prev) => {
      const map = new Map<string, Message>();
      for (const m of prev.items) map.set(m.id, m);
      for (const m of incoming) map.set(m.id, m);

      const sorted = Array.from(map.values()).sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (diff !== 0) return diff;
        return String(a.id).localeCompare(String(b.id));
      });

      const prevFirstId = prev.items[0]?.id;
      let prependedCount = 0;
      if (prevFirstId) {
        const newIndexOfPrevFirst = sorted.findIndex((m) => m.id === prevFirstId);
        if (newIndexOfPrevFirst > 0) {
          prependedCount = newIndexOfPrevFirst;
        }
      }

      return {
        items: sorted,
        firstItemIndex: Math.max(0, prev.firstItemIndex - prependedCount)
      };
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const formatLastSeen = (isoString: string | null) => {
    if (!isoString) return "offline";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "offline";
    const now = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    if (now.toDateString() === date.toDateString()) return `last seen today at ${timeStr}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) return `last seen yesterday at ${timeStr}`;
    return `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (_) {}
  };

  const loadInitialMessages = useCallback(async () => {
    setIsInitialLoading(true);
    const { data, error } = await supabase
      .from("secret_chat")
      .select("*")
      .gte("created_at", cutoffRef.current)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (!error && data) {
      const moreInWindow = data.length === PAGE_SIZE;
      hasMoreRecentRef.current = moreInWindow;
      setHasMoreRecent(moreInWindow);
      mergeMessages(data);
    }

    setIsInitialLoading(false);
    setTimeout(() => {
      canPaginateRef.current = true;
    }, 450);
  }, [mergeMessages]);

  const loadOlderMessages = useCallback(
    async (forceUnlockMode = false) => {
      const unlocked = forceUnlockMode || isMemoriesUnlockedRef.current;

      if (isLoadingOlderRef.current) return;
      if (!forceUnlockMode && !canPaginateRef.current) return;
      if (!unlocked && !hasMoreRecentRef.current) return;
      if (unlocked && !hasMoreArchiveRef.current) return;

      isLoadingOlderRef.current = true;
      setIsLoadingOlder(true);

      const oldestMsg = messagesRef.current[0];

      let query = supabase
        .from("secret_chat")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (oldestMsg) {
        query = query.lt("created_at", oldestMsg.created_at);
      } else if (unlocked) {
        query = query.lt("created_at", cutoffRef.current);
      }

      if (!unlocked) {
        query = query.gte("created_at", cutoffRef.current);
      }

      const { data, error } = await query;

      if (!error && data) {
        if (!unlocked) {
          if (data.length < PAGE_SIZE) {
            hasMoreRecentRef.current = false;
            setHasMoreRecent(false);
          }
        } else {
          if (data.length < PAGE_SIZE) {
            hasMoreArchiveRef.current = false;
            setHasMoreArchive(false);
          }
        }

        if (data.length > 0) {
          mergeMessages(data);
        }
      }

      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    },
    [mergeMessages]
  );

  const handleUnlockMemories = useCallback(async () => {
    if (isMemoriesUnlockedRef.current) return;
    isMemoriesUnlockedRef.current = true;
    setIsMemoriesUnlocked(true);
    canPaginateRef.current = true;
    await loadOlderMessages(true);
  }, [loadOlderMessages]);

  const syncMissedMessages = useCallback(async () => {
    const latestMsg = messagesRef.current[messagesRef.current.length - 1];
    let query = supabase
      .from("secret_chat")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (latestMsg) {
      query = query.gt("created_at", latestMsg.created_at);
    } else {
      query = query.gte("created_at", cutoffRef.current);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const existingIds = new Set(messagesRef.current.map((m) => m.id));
      const newFromPartner = data.filter((m) => !existingIds.has(m.id) && m.sender !== identity);

      mergeMessages(data);

      if (!isAtBottomRef.current && newFromPartner.length > 0) {
        setUnreadCount((c) => c + newFromPartner.length);
      }
    }
  }, [identity, mergeMessages]);

  useEffect(() => {
    loadInitialMessages();

    const fetchLastSeen = async () => {
      const { data } = await supabase
        .from("user_status")
        .select("last_seen")
        .eq("user_name", partnerName)
        .maybeSingle();
      if (data && data.last_seen) setLastSeenTime(formatLastSeen(data.last_seen));
    };
    fetchLastSeen();

    const chatSub = supabase
      .channel("secret_chat_channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "secret_chat" }, (payload) => {
        const incoming = payload.new as Message;
        const alreadyExists = messagesRef.current.some((m) => m.id === incoming.id);

        mergeMessages([incoming]);

        if (incoming.sender === identity) {
          setUnreadCount(0);
          setTimeout(() => {
            virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" });
          }, 50);
        } else if (!alreadyExists) {
          playNotificationSound();
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(formatDisplayName(incoming.sender), {
              body: incoming.media_type === "video" ? "Sent a video" : incoming.media_type === "image" ? "Sent a photo" : incoming.text || "New message"
            });
          }

          if (isAtBottomRef.current) {
            setTimeout(() => {
              virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" });
            }, 60);
          } else {
            setUnreadCount((c) => c + 1);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "secret_chat" }, (payload) => {
        const updated = payload.new as Message;
        setChatState((prev) => ({
          ...prev,
          items: prev.items.map((m) => (m.id === updated.id ? updated : m))
        }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "secret_chat" }, (payload) => {
        setChatState((prev) => ({
          ...prev,
          items: prev.items.filter((m) => m.id !== payload.old.id)
        }));
      })
      .subscribe();

    const presenceChannel = supabase.channel("online_presence");
    const updateStatus = async (online: boolean) => {
      await supabase.from("user_status").upsert({
        user_name: identity,
        last_seen: online ? null : new Date().toISOString()
      });
    };

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        let active = false;
        Object.keys(state).forEach((key) => {
          (state[key] as any[]).forEach((p) => {
            if (p.user === partnerName) active = true;
          });
        });
        setPartnerOnline(active);
        if (active) setLastSeenTime("online");
        else fetchLastSeen();
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          await presenceChannel.track({ user: identity, online_at: new Date().toISOString() });
          await updateStatus(true);
        }
      });

    const typingChannel = supabase.channel("typing_presence", { config: { broadcast: { self: false } } });
    typingChannel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.sender === partnerName) setPartnerTyping(payload.payload.isTyping);
      })
      .subscribe((status) => {
        typingReadyRef.current = status === "SUBSCRIBED";
      });
    typingChannelRef.current = typingChannel;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncMissedMessages();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      typingReadyRef.current = false;
      typingChannelRef.current = null;
      updateStatus(false);
      supabase.removeChannel(chatSub);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [identity, partnerName, loadInitialMessages, syncMissedMessages, mergeMessages]);

  useEffect(() => {
    if (pickerTab !== "gif") return;
    const fetchGiphy = async () => {
      setIsFetchingGifs(true);
      try {
        const query = gifSearch.trim() ? encodeURIComponent(gifSearch) : "love cute happy dance romance";
        const endpoint = gifSearch.trim()
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=30`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data && data.data) {
          setGiphyResults(
            data.data.map((item: any) => ({
              id: item.id,
              title: item.title || "GIF",
              url: item.images.fixed_height.url
            }))
          );
        }
      } catch (_) {} finally {
        setIsFetchingGifs(false);
      }
    };
    const timer = setTimeout(fetchGiphy, 300);
    return () => clearTimeout(timer);
  }, [gifSearch, pickerTab]);

  const scrollToBottom = () => {
    setUnreadCount(0);
    virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" });
  };

  useEffect(() => {
    if (!chatSearchQuery.trim()) {
      setMatchedIndices([]);
      setCurrentMatchIndex(-1);
      return;
    }
    const matches = messages
      .map((m, idx) => (m.text && m.text.toLowerCase().includes(chatSearchQuery.toLowerCase()) ? idx : -1))
      .filter((idx) => idx !== -1);
    setMatchedIndices(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(matches.length - 1);
      virtuosoRef.current?.scrollToIndex({ index: matches[matches.length - 1], align: "center", behavior: "smooth" });
    }
  }, [chatSearchQuery, messages]);

  const handleNextMatch = () => {
    if (matchedIndices.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedIndices.length;
    setCurrentMatchIndex(nextIdx);
    virtuosoRef.current?.scrollToIndex({ index: matchedIndices[nextIdx], align: "center", behavior: "smooth" });
  };

  const handlePrevMatch = () => {
    if (matchedIndices.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedIndices.length) % matchedIndices.length;
    setCurrentMatchIndex(prevIdx);
    virtuosoRef.current?.scrollToIndex({ index: matchedIndices[prevIdx], align: "center", behavior: "smooth" });
  };

  const handleTypingChange = (val: string) => {
    setNewMessage(val);
    if (typingReadyRef.current && typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { sender: identity, isTyping: val.length > 0 }
      });
    }
  };

  const sendMessage = async (textToSend: string, mediaUrl?: string, mediaType?: string) => {
    if (!textToSend.trim() && !mediaUrl) return;

    const replyText = replyingTo
      ? replyingTo.text || (replyingTo.media_type === "video" ? "Video" : "Photo")
      : null;
    setNewMessage("");
    setReplyingTo(null);
    setPickerTab(null);
    setGifSearch("");

    if (typingReadyRef.current && typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { sender: identity, isTyping: false }
      });
    }

    const { data, error } = await supabase
      .from("secret_chat")
      .insert([
        {
          sender: identity,
          text: textToSend || (mediaType === "gif" ? "GIF" : ""),
          reply_to: replyText,
          media_url: mediaUrl || null,
          media_type: mediaType || null
        }
      ])
      .select()
      .single();

    if (!error && data) {
      mergeMessages([data as Message]);
      setUnreadCount(0);
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" });
      }, 50);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video");
      setUploadingMediaText(
        files.length > 1
          ? `Uploading ${i + 1}/${files.length} (${isVideo ? "video" : "photo"})...`
          : `Uploading ${isVideo ? "video" : "photo"}...`
      );

      try {
        const { publicUrl, mediaType } = await uploadMediaToVault(file, identity, "chat");
        await sendMessage("", publicUrl, mediaType);
      } catch (err: any) {
        alert(
          err?.message?.includes("maximum allowed size")
            ? "File exceeds Supabase's 50 MB limit."
            : "Media upload failed. Check your 'vault_media' bucket policy in Supabase."
        );
      }
    }

    setUploadingMediaText(null);
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomBgImage(reader.result as string);
      setUseSongCoverBg(false);
      setShowSettings(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const executeMagicLink = async (targetMsg: Message) => {
    if (!linkingReplyFor) return;
    const preview =
      targetMsg.text || (targetMsg.media_type === "video" ? "Video" : targetMsg.media_type === "image" ? "Photo" : "Media");
    setChatState((prev) => ({
      ...prev,
      items: prev.items.map((m) => (m.id === linkingReplyFor ? { ...m, reply_to: preview } : m))
    }));
    await supabase.from("secret_chat").update({ reply_to: preview }).eq("id", linkingReplyFor);
    setLinkingReplyFor(null);
  };

  const deleteMessage = async (msg: Message) => {
    const sentTime = new Date(msg.created_at).getTime();
    if ((new Date().getTime() - sentTime) / (1000 * 60) > 15) {
      alert("Messages can only be deleted within 15 minutes of sending.");
      return;
    }
    await supabase
      .from("secret_chat")
      .update({ deleted: true, text: "This message was deleted.", media_url: null, media_type: null })
      .eq("id", msg.id);
  };

  const addReaction = async (msg: Message, emoji: string) => {
    let reactions: Record<string, string> = {};
    try {
      if (msg.reaction && msg.reaction.startsWith("{")) reactions = JSON.parse(msg.reaction);
      else if (msg.reaction) reactions["OldUser"] = msg.reaction;
    } catch (_) {
      reactions = {};
    }
    reactions[identity] = emoji;
    await supabase.from("secret_chat").update({ reaction: JSON.stringify(reactions) }).eq("id", msg.id);
    setActiveReactionMenu(null);
    setMobileSheetMsg(null);
  };

  const copyText = (msg: Message) => {
    if (!msg.text) return;
    navigator.clipboard?.writeText(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => {
      setCopiedId(null);
      setMobileSheetMsg(null);
    }, 600);
  };

  const exportChat = () => {
    const chatContent = messages
      .map((m) => `[${new Date(m.created_at).toLocaleString()}] ${formatDisplayName(m.sender)}: ${m.text || m.media_url || ""}`)
      .join("\n");
    const blob = new Blob([chatContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${partnerDisplayName}-Secure-Chat.txt`;
    link.click();
  };

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="fixed inset-0 z-[99999] bg-[#080d12] flex flex-col w-screen h-[100dvh] overflow-hidden select-none sm:select-auto">

      {/* SHARED GALLERY MODAL */}
      <AnimatePresence>
        {isGalleryOpen && <VaultGallery identity={identity} onClose={() => setIsGalleryOpen(false)} />}
      </AnimatePresence>

      {/* FULLSCREEN MEDIA LIGHTBOX */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenMedia(null)}
            className="absolute inset-0 z-[999999] bg-black/96 backdrop-blur-2xl flex flex-col items-center justify-center p-4"
          >
            <div className="absolute top-5 right-5 flex gap-3 z-20" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => downloadVaultMedia(fullscreenMedia.url, fullscreenMedia.type)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 rounded-full text-white text-xs font-semibold transition-colors"
                title="Download to device"
              >
                <Download className="w-4 h-4 text-[#00c896]" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setFullscreenMedia(null)}
                className="bg-white/10 hover:bg-white/20 border border-white/15 p-2.5 rounded-full text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[85dvh] flex items-center justify-center">
              {fullscreenMedia.type === "video" ? (
                <video
                  src={fullscreenMedia.url}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="max-w-full max-h-[85dvh] rounded-2xl shadow-2xl bg-black"
                />
              ) : (
                <img
                  src={fullscreenMedia.url}
                  alt="Fullscreen"
                  className="max-w-full max-h-[85dvh] object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NATIVE MOBILE BOTTOM ACTION SHEET */}
      <AnimatePresence>
        {mobileSheetMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSheetMsg(null)}
            className="fixed inset-0 z-[999998] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-3"
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#121a22] border border-white/10 rounded-3xl p-4 shadow-2xl space-y-3"
            >
              <div className="bg-white/[0.04] rounded-2xl px-3.5 py-2.5 border border-white/[0.06]">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#F472B6] mb-0.5">
                  {formatDisplayName(mobileSheetMsg.sender)}
                </p>
                <p className="text-xs text-white/80 line-clamp-2">
                  {mobileSheetMsg.text || (mobileSheetMsg.media_type === "video" ? "Video" : "Photo")}
                </p>
              </div>

              <div className="flex items-center justify-between bg-white/[0.04] rounded-2xl px-3 py-2 border border-white/[0.06]">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(mobileSheetMsg, emoji)}
                    className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setReplyingTo(mobileSheetMsg);
                    setMobileSheetMsg(null);
                  }}
                  className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium py-3 rounded-2xl transition-colors"
                >
                  <Reply className="w-4 h-4 text-[#00A884]" /> Reply
                </button>
                <button
                  onClick={() => {
                    setLinkingReplyFor(mobileSheetMsg.id);
                    setMobileSheetMsg(null);
                  }}
                  className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium py-3 rounded-2xl transition-colors"
                >
                  <Link2 className="w-4 h-4 text-[#F472B6]" /> Link Reply
                </button>
                {mobileSheetMsg.media_url ? (
                  <button
                    onClick={() => {
                      downloadVaultMedia(
                        mobileSheetMsg.media_url!,
                        mobileSheetMsg.media_type === "video" ? "video" : "image"
                      );
                      setMobileSheetMsg(null);
                    }}
                    className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium py-3 rounded-2xl transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#00c896]" /> Download
                  </button>
                ) : (
                  <button
                    onClick={() => copyText(mobileSheetMsg)}
                    className="flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium py-3 rounded-2xl transition-colors"
                  >
                    {copiedId === mobileSheetMsg.id ? (
                      <Check className="w-4 h-4 text-[#00A884]" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/70" />
                    )}
                    {copiedId === mobileSheetMsg.id ? "Copied" : "Copy Text"}
                  </button>
                )}
                {mobileSheetMsg.sender === identity ? (
                  <button
                    onClick={() => {
                      deleteMessage(mobileSheetMsg);
                      setMobileSheetMsg(null);
                    }}
                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium py-3 rounded-2xl transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                ) : (
                  <button
                    onClick={() => setMobileSheetMsg(null)}
                    className="flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 text-xs font-medium py-3 rounded-2xl transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAGIC LINK BANNER */}
      <AnimatePresence>
        {linkingReplyFor && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-[68px] left-0 right-0 z-[999] mx-auto w-11/12 md:w-1/2 bg-[#044e41]/95 backdrop-blur-xl text-white px-4 py-2.5 rounded-2xl shadow-2xl flex justify-between items-center border border-[#00A884]/50"
          >
            <span className="text-xs sm:text-sm font-medium">Tap the message you want to link as a reply...</span>
            <button onClick={() => setLinkingReplyFor(null)} className="p-1 hover:bg-black/20 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM GLASS HEADER */}
      <div className="bg-[#0e151d]/90 backdrop-blur-xl px-3 sm:px-5 py-2.5 flex justify-between items-center border-b border-white/[0.06] z-30 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/[0.06] p-2 rounded-full transition-colors flex-shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] flex items-center justify-center font-bold text-white text-sm shadow-lg ${partnerOnline ? "ring-2 ring-[#00A884]/60 ring-offset-2 ring-offset-[#0e151d]" : ""}`}>
              {partnerDisplayName[0].toUpperCase()}
            </div>
            {partnerOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00A884] border-2 border-[#0e151d] rounded-full" />
            )}
          </div>

          <div className="text-left min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-[15px] leading-tight truncate">
              {partnerDisplayName}
            </h3>
            <p className={`text-[11px] font-medium truncate ${partnerTyping || partnerOnline ? "text-[#00c896]" : "text-white/45"}`}>
              {partnerTyping ? "typing..." : partnerOnline ? "online" : lastSeenTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 text-white/65 flex-shrink-0">
          {/* GALLERY BUTTON */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            title="Open Shared Gallery"
            className="bg-[#111820]/90 hover:bg-[#F472B6]/15 border border-[#F472B6]/40 text-[#F472B6] px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-md transition-all"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline tracking-wide">Gallery</span>
          </button>

          <button
            onClick={() => setIsSearchingChat(!isSearchingChat)}
            title="Search Chat"
            className={`p-2 rounded-full transition-colors ${isSearchingChat ? "bg-white/10 text-white" : "hover:bg-white/[0.06] hover:text-white"}`}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Change Wallpaper"
            className={`p-2 rounded-full transition-colors ${showSettings ? "bg-white/10 text-[#F472B6]" : "hover:bg-white/[0.06] hover:text-white"}`}
          >
            <Palette className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={exportChat}
            title="Export Chat"
            className="hidden sm:flex p-2 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Download className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="hidden sm:flex p-2 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* IN-CHAT SEARCH BAR */}
      <AnimatePresence>
        {isSearchingChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#121a23] px-4 py-2 border-b border-white/[0.06] flex items-center gap-3 z-30 flex-shrink-0"
          >
            <Search className="w-4 h-4 text-white/45" />
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search loaded messages..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-white/35"
              autoFocus
            />
            {matchedIndices.length > 0 && (
              <span className="text-[11px] text-white/50 font-mono">
                {currentMatchIndex + 1}/{matchedIndices.length}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              <button onClick={handlePrevMatch} disabled={matchedIndices.length === 0} className="text-white/60 hover:text-white p-1 disabled:opacity-25">
                <ChevronUp className="w-5 h-5" />
              </button>
              <button onClick={handleNextMatch} disabled={matchedIndices.length === 0} className="text-white/60 hover:text-white p-1 disabled:opacity-25">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <button onClick={() => { setIsSearchingChat(false); setChatSearchQuery(""); }} className="text-white/50 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WALLPAPER & EXPORT POPOVER */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute top-[64px] right-3 bg-[#121a22]/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl z-50 shadow-2xl w-64 text-left"
          >
            <p className="text-[10px] text-white/45 font-mono mb-2 uppercase tracking-widest">Chat Theme</p>

            <button
              onClick={() => {
                setUseSongCoverBg(true);
                setShowSettings(false);
              }}
              className={`w-full flex items-center justify-between text-xs px-3 py-2.5 rounded-xl text-left transition-colors mb-2 border ${
                useSongCoverBg
                  ? "bg-gradient-to-r from-[#9333EA]/25 to-[#F472B6]/20 border-[#F472B6]/45 text-white font-semibold"
                  : "bg-white/[0.04] border-white/[0.06] text-white/80 hover:bg-white/[0.08]"
              }`}
            >
              <span className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-[#F472B6]" />
                Live Song Cover
              </span>
              {roomCoverBg && (
                <span className="w-2 h-2 rounded-full bg-[#00c896] animate-pulse" title="Room active" />
              )}
            </button>

            <p className="text-[10px] text-white/35 font-mono mb-1.5 mt-2 uppercase tracking-widest">Static Wallpapers</p>
            <div className="space-y-1 mb-3">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.name}
                  onClick={() => {
                    setUseSongCoverBg(false);
                    setCurrentBgStyle(w.class);
                    setCustomBgImage(null);
                    setShowSettings(false);
                  }}
                  className={`w-full text-xs px-3 py-2 rounded-xl text-left transition-colors ${
                    !useSongCoverBg && currentBgStyle === w.class && !customBgImage
                      ? "bg-[#F472B6]/15 text-[#F472B6] font-semibold"
                      : "text-white/85 hover:bg-white/[0.06]"
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 w-full bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white px-3 py-2.5 rounded-xl cursor-pointer transition-colors border border-white/[0.08] mb-2">
              <Upload className="w-4 h-4 text-[#F472B6]" /> Custom Wallpaper
              <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
            </label>
            <button
              onClick={() => {
                exportChat();
                setShowSettings(false);
              }}
              className="flex sm:hidden items-center gap-2 w-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/80 px-3 py-2.5 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4 text-[#00A884]" /> Export Chat (.txt)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT STREAM VIEWPORT */}
      <div
        className={`flex-1 min-h-0 w-full relative overflow-hidden transition-colors duration-500 ${!activeSongCover && !customBgImage ? currentBgStyle : ""}`}
        style={
          !activeSongCover && customBgImage
            ? { backgroundImage: `url(${customBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
            : !activeSongCover
            ? {
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "22px 22px"
              }
            : {}
        }
      >
        <AnimatePresence mode="wait">
          {activeSongCover && (
            <motion.div
              key={activeSongCover}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute inset-0 z-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${activeSongCover})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
            </motion.div>
          )}
        </AnimatePresence>

        {!activeSongCover && customBgImage && <div className="pointer-events-none absolute inset-0 z-0 bg-black/35" />}

        {isInitialLoading ? (
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 text-white/45">
            <Loader2 className="w-6 h-6 text-[#00c896] animate-spin" />
            <span className="text-xs font-mono tracking-wider">Loading recent messages...</span>
          </div>
        ) : (
          <Virtuoso<Message, VirtuosoContext>
            ref={virtuosoRef}
            className="relative z-10"
            data={messages}
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={Math.max(0, messages.length - 1)}
            alignToBottom={true}
            atBottomThreshold={80}
            followOutput={(isAtBottom) => (isAtBottom ? "smooth" : false)}
            startReached={() => {
              loadOlderMessages(false);
            }}
            computeItemKey={(_index, msg) => msg.id}
            style={{ height: "100%", width: "100%" }}
            atBottomStateChange={(atBottom) => {
              isAtBottomRef.current = atBottom;
              setShowScrollBottom(!atBottom);
              if (atBottom) setUnreadCount(0);
            }}
            context={{
              isLoadingOlder,
              isMemoriesUnlocked,
              hasMoreRecent,
              hasMoreArchive,
              messagesCount: messages.length,
              onUnlockMemories: handleUnlockMemories
            }}
            components={{
              Header: VaultHeader,
              Footer: VaultFooter
            }}
            itemContent={(virtuosoIndex, msg) => {
              const arrayIndex = virtuosoIndex - firstItemIndex;
              const isMe = msg.sender === identity;
              const isGif = msg.media_type === "gif";
              const isMedia = Boolean(msg.media_url && !msg.deleted);
              const isHighlighted = matchedIndices[currentMatchIndex] === arrayIndex;

              const prevMsg = arrayIndex > 0 ? messages[arrayIndex - 1] : null;
              const nextMsg = arrayIndex < messages.length - 1 ? messages[arrayIndex + 1] : null;

              const showDateDivider =
                !prevMsg ||
                new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

              const samePrev = !showDateDivider && prevMsg?.sender === msg.sender;
              const sameNext =
                nextMsg &&
                nextMsg.sender === msg.sender &&
                new Date(nextMsg.created_at).toDateString() === new Date(msg.created_at).toDateString();

              let reactionDisplay: string[] = [];
              if (msg.reaction) {
                try {
                  reactionDisplay = msg.reaction.startsWith("{")
                    ? (Array.from(new Set(Object.values(JSON.parse(msg.reaction)))) as string[])
                    : [msg.reaction];
                } catch (_) {
                  reactionDisplay = [msg.reaction];
                }
              }

              const bubbleRadius = isMe
                ? `${samePrev ? "rounded-tr-md" : "rounded-tr-2xl"} ${sameNext ? "rounded-br-md" : "rounded-br-sm"} rounded-tl-2xl rounded-bl-2xl`
                : `${samePrev ? "rounded-tl-md" : "rounded-tl-2xl"} ${sameNext ? "rounded-bl-md" : "rounded-bl-sm"} rounded-tr-2xl rounded-br-2xl`;

              return (
                <div className={`px-3 sm:px-6 w-full flex flex-col max-w-4xl mx-auto ${samePrev ? "pt-[3px]" : "pt-2.5"} ${reactionDisplay.length > 0 ? "pb-3" : "pb-[2px]"}`}>

                  {showDateDivider && (
                    <div className="flex justify-center my-3">
                      <span className="bg-[#111922]/85 backdrop-blur-md border border-white/[0.06] text-white/55 text-[11px] font-medium px-3.5 py-1 rounded-full shadow-sm">
                        {formatDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div
                    onClick={() => {
                      if (linkingReplyFor && linkingReplyFor !== msg.id) {
                        executeMagicLink(msg);
                      } else if (!msg.deleted && window.innerWidth < 768) {
                        setMobileSheetMsg(msg);
                      }
                    }}
                    onContextMenu={(e) => {
                      if (!linkingReplyFor && !msg.deleted) {
                        e.preventDefault();
                        setMobileSheetMsg(msg);
                      }
                    }}
                    className={`flex flex-col group relative ${isMe ? "items-end" : "items-start"} transition-transform duration-200 ${isHighlighted ? "scale-[1.015]" : ""}`}
                  >
                    {!msg.deleted && !linkingReplyFor && (
                      <div
                        className={`hidden md:group-hover:flex absolute -top-9 ${isMe ? "right-1" : "left-1"} items-center gap-0.5 bg-[#151e28]/95 backdrop-blur-xl border border-white/10 rounded-full px-1.5 py-1 z-30 shadow-2xl`}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                          title="Reply"
                          className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinkingReplyFor(msg.id); }}
                          title="Link as Reply"
                          className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#00A884] transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id); }}
                          title="React"
                          className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#F472B6] transition-colors"
                        >
                          <SmilePlus className="w-3.5 h-3.5" />
                        </button>
                        {isMedia && msg.media_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadVaultMedia(msg.media_url!, msg.media_type === "video" ? "video" : "image");
                            }}
                            title="Download"
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#00c896] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isMe && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMessage(msg); }}
                            title="Delete"
                            className="p-1.5 rounded-full hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {activeReactionMenu === msg.id && !msg.deleted && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`hidden md:flex absolute -top-12 ${isMe ? "right-0" : "left-0"} bg-[#151e28]/95 backdrop-blur-xl border border-white/15 rounded-full px-2.5 py-1.5 gap-1.5 z-40 shadow-2xl`}
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg, emoji)}
                            className="hover:scale-125 transition-transform text-lg px-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`max-w-[84%] sm:max-w-[70%] ${isMedia ? "p-1.5" : "px-3.5 pt-2 pb-1.5"} relative shadow-[0_2px_12px_rgba(0,0,0,0.22)] ${bubbleRadius} ${
                        msg.deleted
                          ? "bg-white/[0.04] border border-white/[0.07] text-white/45 italic"
                          : isMe
                          ? "bg-gradient-to-br from-[#066957]/95 to-[#024d40]/95 text-[#EFF5F3] border border-[#10b981]/20 backdrop-blur-sm"
                          : "bg-[#161f29]/90 text-[#E8EEF2] border border-white/[0.08] backdrop-blur-sm"
                      } ${isHighlighted ? "ring-2 ring-[#F472B6] shadow-[0_0_20px_rgba(244,114,182,0.3)]" : ""}`}
                    >
                      {msg.reply_to && msg.reply_to.trim() !== "" && !msg.deleted && (
                        <div
                          className={`p-2 mb-1.5 rounded-xl border-l-[3px] ${
                            isMe ? "border-[#34d399] bg-black/20" : "border-[#F472B6] bg-black/25"
                          }`}
                        >
                          <span className={`block text-[10px] font-bold tracking-wide mb-0.5 ${isMe ? "text-[#34d399]" : "text-[#F472B6]"}`}>
                            Replying to
                          </span>
                          <p className="text-[12px] text-white/80 line-clamp-2 leading-snug">{msg.reply_to}</p>
                        </div>
                      )}

                      {isGif && msg.media_url && (
                        <div
                          className="relative cursor-pointer group/img overflow-hidden rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenMedia({ url: msg.media_url!, type: "image" });
                          }}
                        >
                          <img src={msg.media_url} alt="GIF" className="rounded-xl max-w-[240px] max-h-[220px] object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}

                      {msg.media_url && !isGif && msg.media_type === "image" && (
                        <div
                          className="relative cursor-pointer group/img overflow-hidden rounded-xl bg-black/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenMedia({ url: msg.media_url!, type: "image" });
                          }}
                        >
                          <img
                            src={msg.media_url}
                            alt="Shared photo"
                            loading="lazy"
                            className="rounded-xl max-w-full max-h-[320px] object-cover"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-full border border-white/20">
                              <Maximize className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.media_url && !isGif && msg.media_type === "video" && (
                        <div
                          className="relative cursor-pointer group/vid overflow-hidden rounded-xl bg-black/70 min-w-[210px] sm:min-w-[260px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenMedia({ url: msg.media_url!, type: "video" });
                          }}
                        >
                          <video
                            src={`${msg.media_url}#t=0.1`}
                            preload="metadata"
                            muted
                            playsInline
                            className="rounded-xl w-full max-h-[300px] object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-black/60 group-hover/vid:bg-[#F472B6]/90 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-2xl group-hover/vid:scale-110 transition-all">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white/90 border border-white/15">
                            HD Video
                          </span>
                        </div>
                      )}

                      {msg.text && !isGif && !isMedia && (
                        <p className="text-[14.5px] leading-[1.45] break-words whitespace-pre-wrap">
                          {msg.deleted ? msg.text : renderFormattedText(msg.text)}
                        </p>
                      )}

                      {reactionDisplay.length > 0 && !msg.deleted && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`absolute -bottom-3 ${isMe ? "right-2.5" : "left-2.5"} bg-[#141d27] border border-white/15 rounded-full px-2 py-0.5 text-xs shadow-xl z-10 flex items-center gap-0.5`}
                        >
                          {reactionDisplay.map((emoji, idx) => (
                            <span key={idx}>{emoji}</span>
                          ))}
                        </motion.div>
                      )}

                      <div className={`flex items-center justify-end gap-1 mt-1 opacity-65 ${isMedia ? "px-1.5 pb-0.5" : ""}`}>
                        <span className="text-[10px] font-mono tracking-tight">{formatTime(msg.created_at)}</span>
                        {isMe && !msg.deleted && (
                          <CheckCheck className={`w-3.5 h-3.5 ${partnerOnline ? "text-[#53bdeb]" : "text-white/45"}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}

        <AnimatePresence>
          {(showScrollBottom || unreadCount > 0) && (
            <motion.button
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              onClick={scrollToBottom}
              className="absolute bottom-5 right-4 sm:right-6 z-40 bg-[#141d27]/95 hover:bg-[#1c2836] text-white p-3 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.45)] border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-105"
              title="Jump to latest"
            >
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-[#9333EA] to-[#F472B6] text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <ArrowDown className="w-5 h-5 text-[#00c896]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* LIVE MEDIA UPLOAD PROGRESS BAR */}
      <AnimatePresence>
        {uploadingMediaText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0e151d] px-4 py-2 border-t border-white/[0.06] flex-shrink-0"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-2.5 text-xs text-[#F472B6] font-mono">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>{uploadingMediaText}</span>
              <span className="text-white/40 ml-auto">Saving to Chat & Gallery</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPLY PREVIEW BAR */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0e151d] px-3 sm:px-5 pt-2 flex-shrink-0 border-t border-white/[0.06]"
          >
            <div className="max-w-4xl mx-auto flex justify-between items-center bg-[#16202a] border-l-[3px] border-[#00c896] rounded-xl px-3 py-2">
              <div className="text-left min-w-0 pr-3">
                <p className="text-[11px] text-[#00c896] font-semibold">Replying to {formatDisplayName(replyingTo.sender)}</p>
                <p className="text-xs text-white/70 truncate">
                  {replyingTo.text || (replyingTo.media_type === "video" ? "Video" : "Photo")}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-white/50 hover:text-white p-1.5 bg-white/[0.06] rounded-full flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMOJI & GIPHY DRAWER */}
      <AnimatePresence>
        {pickerTab && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 300 }}
            exit={{ height: 0 }}
            className="bg-[#0f161f] border-t border-white/[0.07] flex flex-col overflow-hidden flex-shrink-0"
          >
            <div className="flex border-b border-white/[0.06] px-4 bg-[#0b1118]">
              <button
                onClick={() => setPickerTab("emoji")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors ${
                  pickerTab === "emoji" ? "border-[#00c896] text-[#00c896]" : "border-transparent text-white/45"
                }`}
              >
                Emojis
              </button>
              <button
                onClick={() => setPickerTab("gif")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors ${
                  pickerTab === "gif" ? "border-[#00c896] text-[#00c896]" : "border-transparent text-white/45"
                }`}
              >
                GIFs
              </button>
            </div>

            {pickerTab === "emoji" && (
              <div className="flex justify-around bg-[#111922] py-1.5 border-b border-white/[0.05] text-xs text-white/55 flex-shrink-0">
                <button onClick={() => setEmojiCategory("smileys")} className={`px-3 py-1 rounded-full ${emojiCategory === "smileys" ? "bg-white/10 text-white" : ""}`}>😀</button>
                <button onClick={() => setEmojiCategory("gestures")} className={`px-3 py-1 rounded-full ${emojiCategory === "gestures" ? "bg-white/10 text-white" : ""}`}>👋</button>
                <button onClick={() => setEmojiCategory("hearts")} className={`px-3 py-1 rounded-full ${emojiCategory === "hearts" ? "bg-white/10 text-white" : ""}`}>❤️</button>
                <button onClick={() => setEmojiCategory("objects")} className={`px-3 py-1 rounded-full ${emojiCategory === "objects" ? "bg-white/10 text-white" : ""}`}>🎉</button>
              </div>
            )}

            {pickerTab === "gif" && (
              <div className="px-3 pt-2 flex-shrink-0">
                <div className="bg-white/[0.06] rounded-xl px-3 py-2 flex items-center gap-2 border border-white/[0.06]">
                  <Search className="w-4 h-4 text-white/45" />
                  <input
                    type="text"
                    value={gifSearch}
                    onChange={(e) => setGifSearch(e.target.value)}
                    placeholder="Search GIFs..."
                    className="bg-transparent text-white text-xs w-full focus:outline-none placeholder:text-white/40"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {pickerTab === "emoji" ? (
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {EMOJI_CATEGORIES[emojiCategory].map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      onClick={() => setNewMessage((prev) => prev + emoji)}
                      className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : isFetchingGifs ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 text-[#00c896] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {giphyResults.map((gif) => (
                    <div
                      key={gif.id}
                      onClick={() => sendMessage("", gif.url, "gif")}
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-white/10 h-28 bg-black/60 flex items-center justify-center"
                    >
                      <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODERN FLOATING INPUT DOCK */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(newMessage);
        }}
        className="bg-[#0e151d]/95 backdrop-blur-xl px-2.5 sm:px-4 py-2.5 border-t border-white/[0.06] z-20 flex-shrink-0 pb-[max(10px,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1 bg-[#18222d] border border-white/[0.07] focus-within:border-[#00c896]/50 rounded-full px-2 py-1 transition-colors">
            <button
              type="button"
              onClick={() => setPickerTab(pickerTab === "emoji" ? null : "emoji")}
              className={`p-2 rounded-full transition-colors ${pickerTab === "emoji" ? "text-[#00c896]" : "text-white/55 hover:text-white"}`}
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTypingChange(e.target.value)}
              placeholder="Message..."
              className="flex-1 min-w-0 bg-transparent text-[#EFF5F3] py-2 px-1 text-[15px] focus:outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              onClick={() => setPickerTab(pickerTab === "gif" ? null : "gif")}
              className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-md border transition-colors ${
                pickerTab === "gif"
                  ? "border-[#00c896] text-[#00c896] bg-[#00c896]/10"
                  : "border-white/25 text-white/55 hover:text-white hover:border-white/50"
              }`}
              title="GIFs"
            >
              GIF
            </button>

            <label
              className={`p-2 rounded-full transition-colors ${
                uploadingMediaText ? "opacity-40 pointer-events-none" : "text-white/55 hover:text-white cursor-pointer"
              }`}
              title="Send Photo or Video"
            >
              {uploadingMediaText ? <Loader2 className="w-5 h-5 animate-spin text-[#F472B6]" /> : <ImageIcon className="w-5 h-5" />}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                disabled={Boolean(uploadingMediaText)}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-tr from-[#00A884] to-[#10b981] w-11 h-11 rounded-full flex items-center justify-center text-[#051813] shadow-[0_4px_16px_rgba(0,168,132,0.35)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none flex-shrink-0"
            title="Send"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}