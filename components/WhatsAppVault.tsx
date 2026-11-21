"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  Smile, Send, CheckCheck, X, Trash2, Reply, SmilePlus,
  Image as ImageIcon, Download, Palette, ArrowLeft, Search,
  Upload, ChevronUp, ChevronDown, Loader2, Link2, Sparkles,
  ArrowDown, Gift, Maximize, Copy, Check
} from "lucide-react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

const GIPHY_API_KEY = "m8EagdbaKHSgg529mP9wVp1qenRWNMkp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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

export default function WhatsAppVault({ identity, onClose }: { identity: string; onClose: () => void }) {
  const partnerName = identity === "Kripton" ? "Moon" : "Kripton";

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pickerTab, setPickerTab] = useState<"emoji" | "gif" | null>(null);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");

  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string } | null>(null);

  const [isMemoriesUnlocked, setIsMemoriesUnlocked] = useState(false);
  const [isRestoringArchive, setIsRestoringArchive] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [giphyResults, setGiphyResults] = useState<{ id: string; title: string; url: string }[]>([]);
  const [isFetchingGifs, setIsFetchingGifs] = useState(false);

  const [linkingReplyFor, setLinkingReplyFor] = useState<string | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [mobileSheetMsg, setMobileSheetMsg] = useState<Message | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const syncMissedMessages = useCallback(async () => {
    const { data } = await supabase
      .from("secret_chat")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      setMessages((prev) => {
        const newMsgs = data.reverse();
        const combined = [...prev, ...newMsgs];
        const seen = new Set<string>();
        return combined.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      });
    }
  }, []);

  const loadRecentOnly = useCallback(async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("secret_chat")
      .select("*")
      .gte("created_at", fortyEightHoursAgo)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end" }), 180);
    }
  }, []);

  useEffect(() => {
    loadRecentOnly();

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
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });

        if (incoming.sender !== identity) {
          playNotificationSound();
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(incoming.sender, { body: incoming.text || "Sent a media file" });
          }
        }
        setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" }), 90);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "secret_chat" }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "secret_chat" }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
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
      .subscribe();

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
      updateStatus(false);
      supabase.removeChannel(chatSub);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [identity, partnerName, loadRecentOnly, syncMissedMessages]);

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

  const handleUnlockMemories = async () => {
    if (isRestoringArchive || isMemoriesUnlocked) return;
    setIsRestoringArchive(true);
    setRestoredCount(0);

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    let localArchiveBuffer: Message[] = [];
    let page = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("secret_chat")
        .select("*")
        .lt("created_at", fortyEightHoursAgo)
        .order("created_at", { ascending: true })
        .range(page * batchSize, (page + 1) * batchSize - 1);

      if (error || !data || data.length === 0) break;
      localArchiveBuffer = [...localArchiveBuffer, ...data];
      setRestoredCount(localArchiveBuffer.length);
      if (data.length < batchSize) break;
      page++;
    }

    setMessages((currentActive) => {
      const combined = [...localArchiveBuffer, ...currentActive];
      const seen = new Set<string>();
      return combined.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    });

    setIsMemoriesUnlocked(true);
    setIsRestoringArchive(false);
    setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end" }), 120);
  };

  const scrollToBottom = () => {
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
    supabase.channel("typing_presence").send({
      type: "broadcast",
      event: "typing",
      payload: { sender: identity, isTyping: val.length > 0 }
    });
  };

  const sendMessage = async (textToSend: string, mediaUrl?: string, mediaType?: string) => {
    if (!textToSend.trim() && !mediaUrl) return;
    await supabase.from("secret_chat").insert([
      {
        sender: identity,
        text: textToSend || (mediaType === "gif" ? "GIF" : mediaType === "video" ? "🎬 Video" : "📷 Photo"),
        reply_to: replyingTo ? replyingTo.text : null,
        media_url: mediaUrl || null,
        media_type: mediaType || null
      }
    ]);
    setNewMessage("");
    setReplyingTo(null);
    setPickerTab(null);
    setGifSearch("");
    supabase.channel("typing_presence").send({
      type: "broadcast",
      event: "typing",
      payload: { sender: identity, isTyping: false }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const type = file.type.startsWith("video") ? "video" : "image";
      sendMessage("", base64String, type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomBgImage(reader.result as string);
      setShowSettings(false);
    };
    reader.readAsDataURL(file);
  };

  const executeMagicLink = async (targetMsg: Message) => {
    if (!linkingReplyFor) return;
    setMessages((prev) => prev.map((m) => (m.id === linkingReplyFor ? { ...m, reply_to: targetMsg.text } : m)));
    await supabase.from("secret_chat").update({ reply_to: targetMsg.text }).eq("id", linkingReplyFor);
    setLinkingReplyFor(null);
  };

  const deleteMessage = async (msg: Message) => {
    const sentTime = new Date(msg.created_at).getTime();
    if ((new Date().getTime() - sentTime) / (1000 * 60) > 15) {
      alert("Messages can only be deleted within 15 minutes of sending.");
      return;
    }
    await supabase.from("secret_chat").update({ deleted: true, text: "This message was deleted." }).eq("id", msg.id);
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
      .map((m) => `[${new Date(m.created_at).toLocaleString()}] ${m.sender}: ${m.text}`)
      .join("\n");
    const blob = new Blob([chatContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${partnerName}-Secure-Chat.txt`;
    link.click();
  };

  const downloadMedia = async (url: string, type: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Vault_Media_${Date.now()}.${type === "video" ? "mp4" : "png"}`;
      link.click();
    } catch (_) {
      alert("Unable to download file.");
    }
  };

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="fixed inset-0 z-[99999] bg-[#080d12] flex flex-col w-screen h-[100dvh] overflow-hidden select-none sm:select-auto">
      
      {/* FULLSCREEN MEDIA LIGHTBOX */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenMedia(null)}
            className="absolute inset-0 z-[999999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4"
          >
            <div className="absolute top-5 right-5 flex gap-3 z-10" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => downloadMedia(fullscreenMedia.url, fullscreenMedia.type)}
                className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-full text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setFullscreenMedia(null)}
                className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-full text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[85vh]">
              {fullscreenMedia.type === "video" ? (
                <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
              ) : (
                <img src={fullscreenMedia.url} alt="Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NATIVE MOBILE BOTTOM ACTION SHEET (Replaces cramped mobile floating bars) */}
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
              {/* Preview snippet */}
              <div className="bg-white/[0.04] rounded-2xl px-3.5 py-2.5 border border-white/[0.06]">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#F472B6] mb-0.5">
                  {mobileSheetMsg.sender}
                </p>
                <p className="text-xs text-white/80 line-clamp-2">{mobileSheetMsg.text}</p>
              </div>

              {/* Quick Reaction Row */}
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

              {/* Action Buttons */}
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

      {/* DISCREET BACKGROUND SYNC INDICATOR */}
      <AnimatePresence>
        {isRestoringArchive && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="absolute top-[68px] right-4 z-50 bg-[#121a22]/95 border border-[#F472B6]/40 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl"
          >
            <Loader2 className="w-3.5 h-3.5 text-[#F472B6] animate-spin" />
            <span className="text-[11px] font-mono text-white/90">
              Unwrapping ({restoredCount.toLocaleString()})...
            </span>
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
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/[0.06] p-2 rounded-full transition-colors flex-shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] flex items-center justify-center font-bold text-white text-sm shadow-lg ${partnerOnline ? "ring-2 ring-[#00A884]/60 ring-offset-2 ring-offset-[#0e151d]" : ""}`}>
              {partnerName[0]}
            </div>
            {partnerOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00A884] border-2 border-[#0e151d] rounded-full" />
            )}
          </div>

          <div className="text-left min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-[15px] leading-tight truncate">
              {partnerName}
            </h3>
            <p className={`text-[11px] font-medium truncate ${partnerTyping || partnerOnline ? "text-[#00c896]" : "text-white/45"}`}>
              {partnerTyping ? "typing..." : partnerOnline ? "online" : lastSeenTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1.5 text-white/65 flex-shrink-0">
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
            className="p-2 rounded-full hover:bg-white/[0.06] hover:text-white transition-colors"
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
              placeholder="Search messages..."
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
            <div className="space-y-1 mb-3">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.name}
                  onClick={() => {
                    setCurrentBgStyle(w.class);
                    setCustomBgImage(null);
                    setShowSettings(false);
                  }}
                  className={`w-full text-xs px-3 py-2 rounded-xl text-left transition-colors ${
                    currentBgStyle === w.class && !customBgImage
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
        className={`flex-1 min-h-0 w-full relative transition-colors duration-500 ${!customBgImage ? currentBgStyle : ""}`}
        style={
          customBgImage
            ? { backgroundImage: `url(${customBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "22px 22px"
              }
        }
      >
        {customBgImage && <div className="pointer-events-none absolute inset-0 bg-black/35" />}

        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
          style={{ height: "100%", width: "100%" }}
          atBottomStateChange={(atBottom) => setShowScrollBottom(!atBottom)}
          components={{
            Header: () => (
              <div className="flex flex-col items-center justify-center my-5 space-y-3 px-4">
                <span className="bg-[#111922]/85 backdrop-blur-md border border-white/[0.06] text-white/45 text-[10px] px-3.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  🔒 End-to-End Encrypted Vault
                </span>

                {!isMemoriesUnlocked && (
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="w-full max-w-md relative group mt-3 mb-2"
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
                          onClick={handleUnlockMemories}
                          disabled={isRestoringArchive}
                          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#F472B6] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 disabled:opacity-50"
                        >
                          {isRestoringArchive ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                          {isRestoringArchive ? "Unwrapping Memories..." : "Unwrap Memories (2024–2026)"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isMemoriesUnlocked && (
                  <div className="flex items-center gap-1.5 text-[#F472B6] text-[11px] font-mono bg-[#F472B6]/10 border border-[#F472B6]/30 px-3.5 py-1 rounded-full backdrop-blur-md">
                    <Gift className="w-3.5 h-3.5" /> Full Time Capsule Unwrapped ({messages.length.toLocaleString()} memories)
                  </div>
                )}
              </div>
            ),
            Footer: () => <div className="h-3" />
          }}
          itemContent={(index, msg) => {
            const isMe = msg.sender === identity;
            const isGif = msg.media_type === "gif";
            const isMedia = !!msg.media_url;
            const isHighlighted = matchedIndices[currentMatchIndex] === index;

            const prevMsg = index > 0 ? messages[index - 1] : null;
            const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

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

            // Adaptive native-style bubble corners for grouped messages
            const bubbleRadius = isMe
              ? `${samePrev ? "rounded-tr-md" : "rounded-tr-2xl"} ${sameNext ? "rounded-br-md" : "rounded-br-sm"} rounded-tl-2xl rounded-bl-2xl`
              : `${samePrev ? "rounded-tl-md" : "rounded-tl-2xl"} ${sameNext ? "rounded-bl-md" : "rounded-bl-sm"} rounded-tr-2xl rounded-br-2xl`;

            return (
              <div className={`px-3 sm:px-6 w-full flex flex-col max-w-4xl mx-auto ${samePrev ? "pt-[3px]" : "pt-2.5"} ${reactionDisplay.length > 0 ? "pb-3" : "pb-[2px]"}`}>
                
                {/* DATE SEPARATOR PILL */}
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
                  {/* DESKTOP HOVER ACTION PILL */}
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

                  {/* DESKTOP QUICK REACTION BAR */}
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

                  {/* MESSAGE BUBBLE */}
                  <div
                    className={`max-w-[84%] sm:max-w-[70%] px-3.5 pt-2 pb-1.5 relative shadow-[0_2px_12px_rgba(0,0,0,0.22)] ${bubbleRadius} ${
                      msg.deleted
                        ? "bg-white/[0.04] border border-white/[0.07] text-white/45 italic"
                        : isMe
                        ? "bg-gradient-to-br from-[#066957] to-[#024d40] text-[#EFF5F3] border border-[#10b981]/20"
                        : "bg-[#161f29]/95 text-[#E8EEF2] border border-white/[0.06]"
                    } ${isHighlighted ? "ring-2 ring-[#F472B6] shadow-[0_0_20px_rgba(244,114,182,0.3)]" : ""}`}
                  >
                    {/* Quoted Reply Block */}
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

                    {/* Media */}
                    {isGif && msg.media_url && (
                      <div
                        className="relative cursor-pointer group/img overflow-hidden rounded-xl my-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenMedia({ url: msg.media_url!, type: "image" });
                        }}
                      >
                        <img src={msg.media_url} alt="GIF" className="rounded-xl max-w-[240px] max-h-[220px] object-cover" />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {msg.media_url && !isGif && msg.media_type === "image" && (
                      <div
                        className="relative cursor-pointer group/img overflow-hidden rounded-xl my-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenMedia({ url: msg.media_url!, type: "image" });
                        }}
                      >
                        <img src={msg.media_url} alt="Media" className="rounded-xl max-w-full max-h-[290px] object-cover" />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {msg.media_url && !isGif && msg.media_type === "video" && (
                      <div className="relative rounded-xl overflow-hidden my-1" onClick={(e) => e.stopPropagation()}>
                        <video src={msg.media_url} controls className="rounded-xl max-w-full max-h-[290px] object-cover" />
                        <button
                          onClick={() => setFullscreenMedia({ url: msg.media_url!, type: "video" })}
                          className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-lg hover:bg-black/80 text-white"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Text Body */}
                    {msg.text && !isGif && !isMedia && (
                      <p className="text-[14.5px] leading-[1.45] break-words whitespace-pre-wrap">
                        {msg.deleted ? msg.text : renderFormattedText(msg.text)}
                      </p>
                    )}

                    {/* Floating Reaction Badge */}
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

                    {/* Timestamp & Read Ticks */}
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-65">
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

        {/* FLOATING SCROLL-TO-BOTTOM BUTTON */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              onClick={scrollToBottom}
              className="absolute bottom-5 right-4 sm:right-6 z-40 bg-[#141d27]/90 hover:bg-[#1c2836] text-white p-3 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.45)] border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-105"
              title="Jump to latest"
            >
              <ArrowDown className="w-5 h-5 text-[#00c896]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

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
                <p className="text-[11px] text-[#00c896] font-semibold">Replying to {replyingTo.sender}</p>
                <p className="text-xs text-white/70 truncate">{replyingTo.text}</p>
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
              className="text-white/55 hover:text-white p-2 cursor-pointer rounded-full transition-colors"
              title="Send Photo/Video"
            >
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
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