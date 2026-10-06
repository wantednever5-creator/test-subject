"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { 
  Smile, Send, CheckCheck, X, Trash2, Reply, SmilePlus, 
  Image as ImageIcon, Download, Palette, ArrowLeft, Search, 
  Upload, ChevronUp, ChevronDown, Loader2, Link2, Sparkles, 
  Lock, Unlock, ArrowDown, Database, Gift, Maximize
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
    "🤕", "🤢", "🤮", "🤧", "🥴", "😵", "🤠", "🥸", "😎", "🫠", "🫥", "🫡", "🫢", "🫣", "🫤", 
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
    "🎉", "🎊", "🎈", "🎂", "🎁", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏐", "🥏", "🎱", 
    "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", 
    "🥌", "🎿", "🏄", "🪂", "🤺", "🐶", "🐱", "🦄", "⭐", "✨", "🔥", "🚀", "💫", "💡", "🔮", "🪄", "🧸", "🕯️"
  ]
};

const WALLPAPERS = [
  { name: "WhatsApp Classic", class: "bg-[#0B141A]" },
  { name: "Midnight Purple", class: "bg-gradient-to-br from-[#1a0b2e] via-[#0b0f19] to-black" },
  { name: "Romantic Rose", class: "bg-gradient-to-br from-[#3b0724] via-[#111827] to-black" },
  { name: "Cosmic Nebula", class: "bg-gradient-to-br from-[#0f172a] via-[#31103f] to-[#1e1b4b]" },
  { name: "Velvet Noir", class: "bg-neutral-950" }
];

export default function WhatsAppVault({ identity, onClose }: { identity: string; onClose: () => void }) {
  const partnerName = identity === "Kripton" ? "Moon" : "Kripton";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pickerTab, setPickerTab] = useState<"emoji" | "gif" | null>(null);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");

  const [viewportHeight, setViewportHeight] = useState<number>(0);
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
  const [activeTouchMenu, setActiveTouchMenu] = useState<string | null>(null); 
  const [currentBgStyle, setCurrentBgStyle] = useState<string>("bg-[#0B141A]");
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

  // 1. Android Viewport Safe-Area Scaling
  useEffect(() => {
    setViewportHeight(window.innerHeight);
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const formatLastSeen = (isoString: string | null) => {
    if (!isoString) return "offline";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "offline";
    const now = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    if (now.toDateString() === date.toDateString()) return `last seen today at ${timeStr}`;
    return `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch(e) {}
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
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end" }), 200);
    }
  }, []);

  useEffect(() => {
    loadRecentOnly();

    const fetchLastSeen = async () => {
      const { data } = await supabase.from("user_status").select("last_seen").eq("user_name", partnerName).maybeSingle();
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
        setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" }), 100);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "secret_chat" }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "secret_chat" }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();

    const presenceChannel = supabase.channel("online_presence");
    const updateStatus = async (online: boolean) => {
      await supabase.from("user_status").upsert({ user_name: identity, last_seen: online ? null : new Date().toISOString() });
    };

    presenceChannel.on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      let active = false;
      Object.keys(state).forEach((key) => {
        (state[key] as any[]).forEach((p) => { if (p.user === partnerName) active = true; });
      });
      setPartnerOnline(active);
      if (active) setLastSeenTime("online");
      else fetchLastSeen();
    }).subscribe(async (s) => {
      if (s === "SUBSCRIBED") {
        await presenceChannel.track({ user: identity, online_at: new Date().toISOString() });
        await updateStatus(true);
      }
    });

    const typingChannel = supabase.channel("typing_presence", { config: { broadcast: { self: false } } });
    typingChannel.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload.sender === partnerName) setPartnerTyping(payload.payload.isTyping);
    }).subscribe();

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
          setGiphyResults(data.data.map((item: any) => ({
            id: item.id, title: item.title || "GIF", url: item.images.fixed_height.url
          })));
        }
      } catch (err) {} finally {
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
      .map((m, idx) => m.text && m.text.toLowerCase().includes(chatSearchQuery.toLowerCase()) ? idx : -1)
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
    supabase.channel("typing_presence").send({ type: "broadcast", event: "typing", payload: { sender: identity, isTyping: val.length > 0 } });
  };

  const sendMessage = async (textToSend: string, mediaUrl?: string, mediaType?: string) => {
    if (!textToSend.trim() && !mediaUrl) return;
    await supabase.from("secret_chat").insert([{ 
      sender: identity, text: textToSend || (mediaType === "gif" ? "GIF" : mediaType === "video" ? "🎬 Video" : "📷 Photo"), 
      reply_to: replyingTo ? replyingTo.text : null, media_url: mediaUrl || null, media_type: mediaType || null
    }]);
    setNewMessage(""); setReplyingTo(null); setPickerTab(null); setGifSearch("");
    supabase.channel("typing_presence").send({ type: "broadcast", event: "typing", payload: { sender: identity, isTyping: false } });
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
    setMessages((prev) => prev.map((m) => m.id === linkingReplyFor ? { ...m, reply_to: targetMsg.text } : m));
    await supabase.from("secret_chat").update({ reply_to: targetMsg.text }).eq("id", linkingReplyFor);
    setLinkingReplyFor(null);
  };

  const deleteMessage = async (msg: Message) => {
    const sentTime = new Date(msg.created_at).getTime();
    if ((new Date().getTime() - sentTime) / (1000 * 60) > 15) {
      alert("Messages can only be deleted within 15 minutes of sending."); return;
    }
    await supabase.from("secret_chat").update({ deleted: true, text: "This message was deleted." }).eq("id", msg.id);
  };

  const addReaction = async (msg: Message, emoji: string) => {
    let reactions: Record<string, string> = {};
    try {
      if (msg.reaction && msg.reaction.startsWith("{")) reactions = JSON.parse(msg.reaction);
      else if (msg.reaction) reactions["OldUser"] = msg.reaction;
    } catch (e) { reactions = {}; }
    reactions[identity] = emoji;
    await supabase.from("secret_chat").update({ reaction: JSON.stringify(reactions) }).eq("id", msg.id);
    setActiveReactionMenu(null);
    setActiveTouchMenu(null);
  };

  const exportChat = () => {
    const chatContent = messages.map(m => `[${new Date(m.created_at).toLocaleString()}] ${m.sender}: ${m.text}`).join("\n");
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
    } catch (e) {
      alert("Unable to download file.");
    }
  };

  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    // FULLSCREEN BACKGROUND LOCK - Prevents any underlying content from showing
    <div className="fixed inset-0 z-[99999] bg-[#0B141A] overflow-hidden">
      {/* DYNAMIC VIEWPORT CONTAINER - Shrinks specifically for the Android keyboard */}
      <div 
        className="flex flex-col w-full mx-auto relative"
        style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
      >
        {/* FULLSCREEN MEDIA OVERLAY */}
        <AnimatePresence>
          {fullscreenMedia && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[999999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            >
              <div className="absolute top-6 right-6 flex gap-4">
                <button onClick={() => downloadMedia(fullscreenMedia.url, fullscreenMedia.type)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 text-white transition-colors">
                  <Download className="w-6 h-6" />
                </button>
                <button onClick={() => setFullscreenMedia(null)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              {fullscreenMedia.type === "video" ? (
                <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
              ) : (
                <img src={fullscreenMedia.url} alt="Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* DISCREET BACKGROUND SYNC INDICATOR */}
        <AnimatePresence>
          {isRestoringArchive && (
            <motion.div 
              initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
              className="absolute top-16 right-4 z-50 bg-[#202C33]/95 border border-[#F472B6]/40 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md"
            >
              <Loader2 className="w-3.5 h-3.5 text-[#F472B6] animate-spin" />
              <span className="text-[11px] font-mono text-white/90">
                Unwrapping memories ({restoredCount.toLocaleString()})...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {linkingReplyFor && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-16 left-0 right-0 z-[999] mx-auto w-11/12 md:w-1/2 bg-[#005C4B] text-white px-4 py-3 rounded-2xl shadow-2xl flex justify-between items-center border border-[#00A884]">
              <span className="text-sm font-medium">Click on the original message this replied to...</span>
              <button onClick={() => setLinkingReplyFor(null)} className="p-1 hover:bg-black/20 rounded-full"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp Header */}
        <div className="bg-[#202C33] px-4 py-3 flex justify-between items-center border-b border-[#2A3942] z-30 shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-[#8696A0] hover:text-white mr-1"><ArrowLeft className="w-6 h-6" /></button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] flex items-center justify-center font-bold text-white text-sm">{partnerName[0]}</div>
              {partnerOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] border-2 border-[#202C33] rounded-full" />}
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold text-base leading-tight">{partnerName}</h3>
              <p className="text-[#00A884] text-xs font-medium">
                {partnerTyping ? "typing..." : partnerOnline ? "online" : lastSeenTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#8696A0]">
            <button onClick={() => setIsSearchingChat(!isSearchingChat)} title="Search Chat"><Search className="w-5 h-5 hover:text-white" /></button>
            <button onClick={() => setShowSettings(!showSettings)} title="Change Wallpaper"><Palette className="w-5 h-5 hover:text-white" /></button>
            <button onClick={exportChat} title="Export Chat"><Download className="w-5 h-5 hover:text-white" /></button>
            <button onClick={onClose} title="Close"><X className="w-6 h-6 hover:text-white" /></button>
          </div>
        </div>

        {/* In-Chat Search Bar */}
        <AnimatePresence>
          {isSearchingChat && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#1F2C34] px-4 py-2 border-b border-white/5 flex items-center gap-3 z-30 shadow-lg flex-shrink-0">
              <Search className="w-4 h-4 text-[#8696A0]" />
              <input 
                type="text" value={chatSearchQuery} onChange={(e) => setChatSearchQuery(e.target.value)} placeholder="Search conversation..." 
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#8696A0]" autoFocus
              />
              {matchedIndices.length > 0 && <span className="text-xs text-[#8696A0] font-mono">{currentMatchIndex + 1} of {matchedIndices.length}</span>}
              <div className="flex items-center gap-1">
                <button onClick={handlePrevMatch} disabled={matchedIndices.length === 0} className="text-[#8696A0] hover:text-white p-1 disabled:opacity-30"><ChevronUp className="w-5 h-5" /></button>
                <button onClick={handleNextMatch} disabled={matchedIndices.length === 0} className="text-[#8696A0] hover:text-white p-1 disabled:opacity-30"><ChevronDown className="w-5 h-5" /></button>
              </div>
              <button onClick={() => { setIsSearchingChat(false); setChatSearchQuery(""); }} className="text-[#8696A0] hover:text-white ml-2"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallpaper Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-16 right-4 bg-[#202C33] border border-white/10 p-4 rounded-2xl z-50 shadow-2xl w-64 text-left">
              <p className="text-xs text-[#8696A0] font-mono mb-2 uppercase tracking-wider">Chat Wallpaper</p>
              <div className="space-y-1 mb-3">
                {WALLPAPERS.map(w => (
                  <button key={w.name} onClick={() => { setCurrentBgStyle(w.class); setCustomBgImage(null); setShowSettings(false); }} className="w-full text-xs text-white/90 hover:bg-white/5 px-3 py-2 rounded-lg text-left">{w.name}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 w-full bg-white/5 hover:bg-white/10 text-xs text-white px-3 py-2.5 rounded-xl cursor-pointer transition-colors border border-white/10">
                <Upload className="w-4 h-4 text-[#F472B6]" /> Upload Custom Image
                <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Viewport with Virtuoso */}
        <div 
          className={`flex-1 min-h-0 w-full relative transition-colors duration-500 ${!customBgImage ? currentBgStyle : ''}`} 
          style={customBgImage ? { backgroundImage: `url(${customBgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
            style={{ height: "100%", width: "100%" }}
            atBottomStateChange={(atBottom) => setShowScrollBottom(!atBottom)}
            components={{
              Header: () => (
                <div className="flex flex-col items-center justify-center my-6 space-y-3 px-4">
                  <span className="bg-[#182229]/80 backdrop-blur-md text-[#8696A0] text-[10px] px-4 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                    🔒 End-to-End Encrypted Vault
                  </span>

                  {!isMemoriesUnlocked && (
                    <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-md relative group mt-4 mb-2">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F472B6] to-[#9333EA] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
                      <div className="relative bg-[#111B21] border border-[#F472B6]/30 rounded-2xl p-5 text-center shadow-2xl overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#9333EA] opacity-10 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F472B6] opacity-10 rounded-full blur-2xl"></div>
                        <div className="relative z-10 space-y-4">
                          <div className="flex justify-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#9333EA] to-[#F472B6] rounded-full flex items-center justify-center shadow-lg shadow-pink-500/20 mb-1">
                              <Gift className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#D8B4FE] font-bold text-sm uppercase tracking-widest mb-1">
                              A Special Birthday Surprise
                            </h3>
                            <p className="text-[11px] text-[#8696A0] leading-relaxed px-2">
                              Your recent messages are loaded. But a secured time capsule containing every single memory, late-night conversation, and joke from 2024 to 2026 is waiting for you.
                            </p>
                          </div>
                          <button
                            onClick={handleUnlockMemories} disabled={isRestoringArchive}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#F472B6] hover:from-[#7e22ce] hover:to-[#db2777] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 disabled:opacity-50"
                          >
                            {isRestoringArchive ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                            {isRestoringArchive ? "Unwrapping Memories..." : "Unwrap Memories (2024–2026)"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isMemoriesUnlocked && (
                    <div className="flex items-center gap-1.5 text-[#F472B6] text-[11px] font-mono bg-[#F472B6]/10 border border-[#F472B6]/30 px-3 py-1 rounded-full">
                      <Gift className="w-3.5 h-3.5" /> Full Time Capsule Unwrapped ({messages.length.toLocaleString()} memories)
                    </div>
                  )}
                </div>
              )
            }}
            itemContent={(index, msg) => {
              const isMe = msg.sender === identity;
              const isGif = msg.media_type === "gif";
              const isMedia = !!msg.media_url;
              const isHighlighted = matchedIndices[currentMatchIndex] === index;

              let reactionDisplay: string[] = [];
              if (msg.reaction) {
                try {
                  reactionDisplay = msg.reaction.startsWith("{") ? Array.from(new Set(Object.values(JSON.parse(msg.reaction)))) as string[] : [msg.reaction];
                } catch (e) { reactionDisplay = [msg.reaction]; }
              }

              return (
                <div className="px-4 py-1.5 w-full flex flex-col">
                  <div 
                    onClick={(e) => { 
                      if (linkingReplyFor && linkingReplyFor !== msg.id) {
                        executeMagicLink(msg);
                      } else if (!isMedia) {
                        setActiveTouchMenu(activeTouchMenu === msg.id ? null : msg.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      if (!linkingReplyFor) {
                        e.preventDefault();
                        setActiveTouchMenu(msg.id);
                      }
                    }}
                    className={`flex flex-col group relative ${isMe ? "items-end" : "items-start"} transition-all duration-300 ${isHighlighted ? "scale-[1.02]" : ""}`}
                  >
                    
                    {/* MOBILE-OPTIMIZED ACTION BAR */}
                    {!msg.deleted && !linkingReplyFor && (
                      <div className={`absolute -top-10 ${isMe ? "right-2" : "left-2"} ${activeTouchMenu === msg.id ? '!flex' : 'hidden md:group-hover:flex'} items-center gap-1 bg-[#202C33] border border-white/10 rounded-full px-2 py-1 z-[999] shadow-2xl transition-all`}>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyingTo(msg); setActiveTouchMenu(null); }} title="Reply" className="p-2 cursor-pointer"><Reply className="w-4 h-4 text-white/70 hover:text-white" /></button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLinkingReplyFor(msg.id); setActiveTouchMenu(null); }} title="Link as Reply" className="p-2 cursor-pointer"><Link2 className="w-4 h-4 text-white/70 hover:text-[#00A884]" /></button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id); }} title="React" className="p-2 cursor-pointer"><SmilePlus className="w-4 h-4 text-white/70 hover:text-white" /></button>
                        {isMe && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteMessage(msg); setActiveTouchMenu(null); }} title="Delete" className="p-2 cursor-pointer"><Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" /></button>}
                      </div>
                    )}

                    {/* REACTION BAR */}
                    {activeReactionMenu === msg.id && !msg.deleted && (
                      <div className={`absolute top-8 ${isMe ? "right-0" : "left-0"} bg-[#202C33] border border-white/10 rounded-full px-3 py-2 flex gap-2 z-[999] shadow-2xl`}>
                        {["❤️", "🔥", "😂", "👍", "🥹", "🎉"].map((emoji) => (
                          <button key={emoji} onClick={(e) => { e.preventDefault(); e.stopPropagation(); addReaction(msg, emoji); }} className="hover:scale-125 transition-transform text-2xl cursor-pointer">{emoji}</button>
                        ))}
                      </div>
                    )}

                    <div className={`max-w-[85%] md:max-w-[70%] px-3.5 pt-2.5 pb-1.5 rounded-2xl relative shadow-md ${isMe ? "bg-[#005C4B] text-[#E9EDEF] rounded-tr-none" : "bg-[#202C33] text-[#E9EDEF] rounded-tl-none"} ${isHighlighted ? "ring-2 ring-[#00A884] bg-emerald-950" : ""}`}>
                      
                      {msg.reply_to && msg.reply_to.trim() !== "" && (
                        <div className={`relative overflow-hidden p-2.5 mb-1.5 rounded-lg border-l-4 ${isMe ? 'border-[#10b981] bg-[#025144]' : 'border-[#F472B6] bg-[#1d282f]'}`}>
                          <span className={`block text-[10px] font-extrabold mb-0.5 ${isMe ? 'text-[#10b981]' : 'text-[#F472B6]'}`}>Replying to</span>
                          <p className="text-xs text-white/90 line-clamp-3 leading-snug italic">{msg.reply_to}</p>
                        </div>
                      )}

                      {/* CLICKABLE FULLSCREEN MEDIA */}
                      {isGif && msg.media_url && (
                        <div className="relative cursor-pointer group/img" onClick={() => setFullscreenMedia({ url: msg.media_url!, type: "image" })}>
                          <img src={msg.media_url} alt="GIF" className="rounded-xl max-w-[240px] max-h-[220px] object-cover my-1" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center"><Maximize className="w-6 h-6 text-white" /></div>
                        </div>
                      )}
                      {msg.media_url && !isGif && msg.media_type === "image" && (
                        <div className="relative cursor-pointer group/img" onClick={() => setFullscreenMedia({ url: msg.media_url!, type: "image" })}>
                          <img src={msg.media_url} alt="Media" className="rounded-xl max-w-full max-h-[280px] object-cover my-1" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center"><Maximize className="w-6 h-6 text-white" /></div>
                        </div>
                      )}
                      {msg.media_url && !isGif && msg.media_type === "video" && (
                        <div className="relative cursor-pointer group/img">
                          <video src={msg.media_url} controls className="rounded-xl max-w-full max-h-[280px] object-cover my-1 z-10 relative" />
                          <button onClick={(e) => { e.preventDefault(); setFullscreenMedia({ url: msg.media_url!, type: "video" })}} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-md z-20 hover:bg-black/80"><Maximize className="w-4 h-4 text-white" /></button>
                        </div>
                      )}
                      
                      {msg.text && !isGif && !msg.media_url && <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}

                      {reactionDisplay.length > 0 && !msg.deleted && (
                        <motion.div initial={{ scale: 0, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="absolute -bottom-2 right-2 bg-[#202C33] border border-white/20 rounded-full px-2 py-0.5 text-xs shadow-2xl z-10 flex items-center gap-1">
                          {reactionDisplay.map((emoji, idx) => <span key={idx}>{emoji}</span>)}
                        </motion.div>
                      )}

                      <div className="flex items-center justify-end gap-1.5 mt-0.5 opacity-70">
                        <span className="text-[10px] font-mono">{formatTime(msg.created_at)}</span>
                        {isMe && <CheckCheck className={`w-3.5 h-3.5 ${partnerOnline ? "text-[#53bdeb]" : "text-white/40"}`} />}
                        {!msg.deleted && !linkingReplyFor && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTouchMenu(activeTouchMenu === msg.id ? null : msg.id); }} className="md:hidden ml-1 p-0.5 cursor-pointer">
                            <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />

          {/* Floating Scroll-Down Button */}
          <AnimatePresence>
            {showScrollBottom && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={scrollToBottom}
                className="absolute bottom-6 right-6 z-40 bg-[#202C33]/90 hover:bg-[#2A3942] text-white p-3 rounded-full shadow-2xl border border-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110"
                title="Jump to bottom"
              >
                <ArrowDown className="w-5 h-5 text-[#00A884]" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Reply Preview */}
        <AnimatePresence>
          {replyingTo && (
            <div className="bg-[#1F2C34] px-4 py-2 flex justify-between items-center border-t border-white/5 flex-shrink-0">
              <div className="border-l-4 border-[#00A884] bg-[#2A3942] p-2 rounded-r-lg w-full text-left mr-3">
                <p className="text-[11px] text-[#00A884] font-bold mb-0.5">Replying to message</p>
                <p className="text-xs text-white/70 line-clamp-2">{replyingTo.text}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-white/50 hover:text-white p-1 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
            </div>
          )}
        </AnimatePresence>

        {/* Emoji Drawer */}
        <AnimatePresence>
          {pickerTab && (
            <motion.div initial={{ height: 0 }} animate={{ height: 320 }} exit={{ height: 0 }} className="bg-[#1F2C34] border-t border-white/5 flex flex-col overflow-hidden flex-shrink-0">
              <div className="flex border-b border-white/10 px-4 bg-[#111B21]">
                <button onClick={() => setPickerTab("emoji")} className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase border-b-2 ${pickerTab === "emoji" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-white/50"}`}>Emojis</button>
                <button onClick={() => setPickerTab("gif")} className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase border-b-2 ${pickerTab === "gif" ? "border-[#00A884] text-[#00A884]" : "border-transparent text-white/50"}`}>GIFs (Live API)</button>
              </div>

              {pickerTab === "emoji" && (
                <div className="flex justify-around bg-[#182229] py-1.5 border-b border-white/5 text-xs text-[#8696A0] flex-shrink-0">
                  <button onClick={() => setEmojiCategory("smileys")} className={`px-3 py-1 rounded ${emojiCategory === "smileys" ? "bg-white/10 text-white" : ""}`}>😀 Smileys</button>
                  <button onClick={() => setEmojiCategory("gestures")} className={`px-3 py-1 rounded ${emojiCategory === "gestures" ? "bg-white/10 text-white" : ""}`}>👋 Gestures</button>
                  <button onClick={() => setEmojiCategory("hearts")} className={`px-3 py-1 rounded ${emojiCategory === "hearts" ? "bg-white/10 text-white" : ""}`}>❤️ Hearts</button>
                  <button onClick={() => setEmojiCategory("objects")} className={`px-3 py-1 rounded ${emojiCategory === "objects" ? "bg-white/10 text-white" : ""}`}>🎉 Objects</button>
                </div>
              )}

              {pickerTab === "gif" && (
                <div className="px-3 pt-2 flex-shrink-0">
                  <div className="bg-[#2A3942] rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#8696A0]" />
                    <input type="text" value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} placeholder="Search millions of live GIFs..." className="bg-transparent text-white text-xs w-full focus:outline-none placeholder:text-[#8696A0]" autoFocus />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {pickerTab === "emoji" ? (
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_CATEGORIES[emojiCategory].map((emoji, index) => (
                      <button key={`${emoji}-${index}`} onClick={() => setNewMessage(prev => prev + emoji)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>
                    ))}
                  </div>
                ) : (
                  <div>
                    {isFetchingGifs ? (
                      <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 text-[#00A884] animate-spin" /></div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {giphyResults.map((gif) => (
                          <div key={gif.id} onClick={() => sendMessage("", gif.url, "gif")} className="cursor-pointer group relative rounded-xl overflow-hidden border border-white/10 h-32 bg-black/80 flex items-center justify-center">
                            <img src={gif.url} alt={gif.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Input Bar with Safe Area Support */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="bg-[#202C33] px-3 py-3 flex items-center gap-2 border-t border-[#2A3942] z-20 flex-shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setPickerTab(pickerTab === "emoji" ? null : "emoji")} className="text-[#8696A0] hover:text-white p-2"><Smile className="w-6 h-6" /></button>
          <button type="button" onClick={() => setPickerTab(pickerTab === "gif" ? null : "gif")} className="text-[#8696A0] hover:text-white p-2 text-xs font-bold border border-[#8696A0] rounded px-1.5 py-0.5">GIF</button>
          <label className="text-[#8696A0] hover:text-white p-2 cursor-pointer" title="Send Photo/Video">
            <ImageIcon className="w-6 h-6" />
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTypingChange(e.target.value)}
            placeholder="Type a message"
            className="flex-1 bg-[#2A3942] text-[#E9EDEF] rounded-xl px-4 py-3 text-[15px] focus:outline-none placeholder:text-[#8696A0]"
          />
          <button type="submit" disabled={!newMessage.trim()} className="bg-[#00A884] w-11 h-11 rounded-full flex items-center justify-center text-black hover:bg-[#00c298] disabled:opacity-50">
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}