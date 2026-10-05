"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { MessageCircle, X, Send, Lock, CheckCheck, KeyRound, AlertCircle, Cake } from "lucide-react";

// ==========================================
// 🔒 SET YOUR SECRET LOGIN CREDENTIALS HERE
// ==========================================
const SECRETS = {
  MOON: { id: "moon", pass: "17thbirthday" },
  KRIPTON: { id: "kripton", pass: "bossman" }
};

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY"
);

type Message = { id: string; sender: string; text: string; created_at: string };

// --- CUTE SHIT: ANIMATED SVGS FOR THE THEATRICAL STAGE ---
const SVGMoonAvatar = () => (
  <svg viewBox="0 0 100 120" className="w-[120px] md:w-[160px] drop-shadow-[0_0_20px_rgba(244,114,182,0.5)]">
    <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="75" y="40" width="15" height="40" rx="7.5" fill="#DB2777" />
      <rect x="25" y="20" width="55" height="70" rx="27.5" fill="#F472B6" />
      <rect x="10" y="40" width="45" height="25" rx="12.5" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="2" />
      <path d="M 20 48 Q 30 43 40 48" stroke="#FFFFFF" strokeWidth="3" fill="transparent" strokeLinecap="round" opacity="0.6"/>
      {/* Yellow Flower */}
      <motion.g animate={{ rotate: [-5, 10, -5] }} transition={{ duration: 2.5, repeat: Infinity }} transform="translate(60, 10)">
        <path d="M 0 0 C -8 -12, 8 -12, 0 0 C 12 -8, 12 8, 0 0 C 8 12, -8 12, 0 0 C -12 8, -12 -8, 0 0 Z" fill="#FDE047" />
        <circle cx="0" cy="0" r="3" fill="#CA8A04" />
      </motion.g>
    </motion.g>
  </svg>
);

const SVGKriptonAvatar = () => (
  <svg viewBox="0 0 100 120" className="w-[120px] md:w-[160px] drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]">
    <rect x="10" y="40" width="15" height="40" rx="7.5" fill="#6D28D9" />
    <rect x="20" y="20" width="55" height="70" rx="27.5" fill="#7C3AED" />
    <rect x="45" y="40" width="45" height="25" rx="12.5" fill="#1F2937" stroke="#111827" strokeWidth="2" />
    <path d="M 55 50 Q 65 60 75 50" stroke="#4B5563" strokeWidth="3" fill="transparent" strokeLinecap="round" />
  </svg>
);

// Reusing Gift icon manually since it was added to imports
const Gift = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

export default function SecretChat() {
  // 0: Closed | 1: Cake Waiting | 2: Blown | 3: Kripton Enters | 4: Clapping | 5: Msg1 | 6: Msg2 | 7: Gift Ready | 8: Login | 9: Chat
  const [seqStep, setSeqStep] = useState(0); 
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [identity, setIdentity] = useState<"Kripton" | "Moon" | null>(null);
  const [inputId, setInputId] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- THE CINEMATIC SEQUENCE TIMERS ---
  useEffect(() => {
    if (seqStep === 2) setTimeout(() => setSeqStep(3), 1500); // Wait for smoke, Kripton enters
    if (seqStep === 3) setTimeout(() => setSeqStep(4), 1500); // Kripton reaches cake, starts clapping
    if (seqStep === 4) setTimeout(() => setSeqStep(5), 1500); // Shows "Happy 17th Birthday!"
    if (seqStep === 5) setTimeout(() => setSeqStep(6), 4000); // Shows "A gift for you..."
    if (seqStep === 6) setTimeout(() => setSeqStep(7), 3000); // Gift drops down
  }, [seqStep]);

  // --- SUPABASE CHAT LOGIC ---
  useEffect(() => {
    if (seqStep !== 9 || !identity) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("secret_chat").select("*").order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const subscription = supabase
      .channel("secret_chat_channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "secret_chat" }, (payload) => {
        setMessages((current) => [...current, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [seqStep, identity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    if (inputId.toLowerCase() === SECRETS.MOON.id && inputPass === SECRETS.MOON.pass) {
      setIdentity("Moon"); setSeqStep(9);
    } else if (inputId.toLowerCase() === SECRETS.KRIPTON.id && inputPass === SECRETS.KRIPTON.pass) {
      setIdentity("Kripton"); setSeqStep(9);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !identity) return;
    const textToSend = newMessage;
    setNewMessage(""); 
    await supabase.from("secret_chat").insert([{ sender: identity, text: textToSend }]);
  };

  // --- THIS FIXES THE ERROR! Formats the timestamp for the chat bubbles ---
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <>
      {/* 1. THE FLOATING TRIGGER (Hyper-visible to ensure it isn't lost) */}
      <AnimatePresence>
        {seqStep === 0 && (
          <motion.button
            initial={{ scale: 0, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 100 }}
            onClick={() => setSeqStep(1)}
            className="fixed bottom-8 left-8 z-[9999] w-16 h-16 bg-gradient-to-tr from-[#9333EA] to-[#F472B6] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(244,114,182,0.6)] outline-none group hover:shadow-[0_0_50px_rgba(244,114,182,0.9)] transition-shadow"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping"></div>
            <Cake className="w-8 h-8 text-white group-hover:animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {seqStep > 0 && (
          <motion.div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
          >
            {/* Background Ambient Stars */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
              {[...Array(40)].map((_, i) => (
                <motion.div key={i} className="absolute w-1 h-1 bg-white rounded-full"
                  style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.5, 1] }} transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
                />
              ))}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-t from-[#9333EA]/10 to-transparent blur-[100px] rounded-full"></div>
            </div>

            {/* --- PHASE 1: THE THEATRICAL STAGE (Steps 1 to 7) --- */}
            {seqStep >= 1 && seqStep <= 7 && (
              <div className="relative w-full max-w-4xl h-[600px] flex items-end justify-center pb-20">
                
                {/* MOON (Standing by the cake) */}
                <motion.div className="absolute bottom-10 right-[10%] md:right-[20%] z-20"
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}
                >
                  <SVGMoonAvatar />
                </motion.div>

                {/* THE CAKE */}
                <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
                  initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}
                >
                  {/* The Interactive Candle/Flame */}
                  <div className="relative w-12 h-20 flex flex-col items-center -mb-2 z-40">
                    <AnimatePresence>
                      {seqStep === 1 && (
                        <motion.div 
                          exit={{ opacity: 0, scale: 0, y: -20 }}
                          className="w-6 h-10 bg-gradient-to-t from-orange-500 via-yellow-300 to-white rounded-[50%_50%_50%_50%/60%_60%_40%_40%] cursor-pointer shadow-[0_0_30px_#FDE047]"
                          animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }} transition={{ duration: 0.5, repeat: Infinity }}
                          onClick={() => setSeqStep(2)} // BLOW OUT CANDLE
                        />
                      )}
                    </AnimatePresence>
                    {/* Smoke Effect when blown */}
                    {seqStep >= 2 && (
                      <motion.div 
                        initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -100, scale: 3, x: [-10, 10, -20] }} transition={{ duration: 3, ease: "easeOut" }}
                        className="w-4 h-4 bg-white/40 blur-md rounded-full absolute top-0"
                      />
                    )}
                    <div className="w-2 h-10 bg-gradient-to-b from-white to-gray-300 rounded-sm mt-1"></div>
                  </div>

                  {/* 3-Tier Cake Body */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-12 bg-gradient-to-b from-[#FDE047] to-[#CA8A04] rounded-t-xl rounded-b-md border-b border-black/20 shadow-[0_-5px_20px_rgba(253,224,71,0.4)]"></div>
                    <div className="w-32 h-14 bg-gradient-to-b from-[#F472B6] to-[#BE185D] rounded-t-md rounded-b-md border-b border-black/20 shadow-[0_-5px_20px_rgba(244,114,182,0.4)]"></div>
                    <div className="w-44 h-16 bg-gradient-to-b from-[#9333EA] to-[#581C87] rounded-t-md rounded-b-2xl shadow-[0_10px_30px_rgba(147,51,234,0.6)] flex items-center justify-center">
                      <span className="text-white/80 font-bold tracking-widest text-sm">17</span>
                    </div>
                  </div>
                  
                  {/* Instructional Text */}
                  {seqStep === 1 && (
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -bottom-16 w-64 text-center">
                      <p className="text-[#FDE047] font-mono text-sm tracking-widest uppercase drop-shadow-[0_0_10px_#FDE047]">Make a wish & click the flame</p>
                    </motion.div>
                  )}
                </motion.div>

                {/* KRIPTON (Enters from left, claps) */}
                <motion.div className="absolute bottom-10 left-[5%] md:left-[15%] z-20"
                  initial={{ x: "-100vw", opacity: 0 }}
                  animate={{ 
                    x: seqStep >= 3 ? 0 : "-100vw", 
                    opacity: seqStep >= 3 ? 1 : 0,
                    y: seqStep >= 4 ? [0, -30, 0, -20, 0] : 0 // The Clapping Bounce
                  }} 
                  transition={{ 
                    x: { type: "spring", stiffness: 60, damping: 15 },
                    y: { duration: 1, repeat: seqStep === 4 ? Infinity : 0 }
                  }}
                >
                  <SVGKriptonAvatar />

                  {/* Clapping Sparkles */}
                  {seqStep === 4 && (
                    <>
                      <motion.div animate={{ scale: [0, 1.5, 0], y: -50, x: -20 }} transition={{ duration: 0.5, repeat: Infinity }} className="absolute top-10 right-0 w-4 h-4 bg-yellow-300 rounded-full blur-[2px]" />
                      <motion.div animate={{ scale: [0, 1.5, 0], y: -30, x: 30 }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} className="absolute top-10 right-0 w-3 h-3 bg-pink-400 rounded-full blur-[2px]" />
                    </>
                  )}

                  {/* The Chat Bubbles */}
                  <AnimatePresence>
                    {seqStep >= 5 && seqStep <= 7 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0, originX: 0, originY: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                        className="absolute bottom-[110%] left-[80%] w-64 md:w-80 bg-white rounded-2xl rounded-bl-none p-5 shadow-[0_10px_40px_rgba(255,255,255,0.2)] z-50"
                      >
                        <p className="text-black font-semibold text-lg md:text-xl">
                          {seqStep === 5 ? "Happy 17th Birthday! 🎉" : "A gift for you.. won't you see what it is?"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* THE FINAL GIFT TRIGGER */}
                <AnimatePresence>
                  {seqStep === 7 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -100, scale: 0 }} animate={{ opacity: 1, y: -250, scale: 1 }}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 cursor-pointer group"
                      onClick={() => setSeqStep(8)} // GO TO LOGIN
                    >
                      <div className="w-24 h-24 bg-gradient-to-tr from-[#9333EA] to-[#F472B6] rounded-xl flex items-center justify-center shadow-[0_0_50px_rgba(244,114,182,0.8)] border border-white/40 group-hover:scale-110 transition-transform duration-300">
                        <Gift className="w-12 h-12 text-white animate-pulse" />
                        <div className="absolute -inset-4 bg-white/20 rounded-xl blur-xl group-hover:bg-white/40 transition-colors"></div>
                      </div>
                      <p className="text-white font-mono text-center mt-6 tracking-widest uppercase animate-bounce drop-shadow-[0_0_10px_#fff]">Click to Open</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* --- PHASE 2: THE SECURE VAULT LOGIN (Step 8) --- */}
            {seqStep === 8 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }}
                className="w-[90vw] md:w-[450px] bg-[#0B141A] rounded-3xl shadow-[0_30px_100px_rgba(147,51,234,0.4)] flex flex-col overflow-hidden border border-white/10 backdrop-blur-xl relative"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9333EA]/10 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="p-10 flex flex-col items-center text-center relative z-10">
                  <motion.div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(147,51,234,0.3)]"
                    animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    <KeyRound className="w-10 h-10 text-[#9333EA]" />
                  </motion.div>
                  <h2 className="text-white text-2xl font-light tracking-widest uppercase mb-2">Secure Vault</h2>
                  <p className="text-white/40 font-mono text-xs mb-8">End-to-End Encrypted Comms</p>
                  
                  <form onSubmit={handleLogin} className="w-full space-y-5">
                    <input type="text" value={inputId} onChange={(e) => setInputId(e.target.value)} placeholder="Identification (ID)"
                      className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#F472B6] focus:ring-1 focus:ring-[#F472B6] transition-all placeholder:text-white/30 font-mono" />
                    <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} placeholder="Passcode"
                      className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#F472B6] focus:ring-1 focus:ring-[#F472B6] transition-all placeholder:text-white/30 font-mono tracking-widest" />
                    
                    <AnimatePresence>
                      {loginError && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-mono flex items-center justify-center gap-2 pt-2">
                          <AlertCircle className="w-4 h-4" /> Access Denied. Check credentials.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button type="submit" className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#F472B6] text-white font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(244,114,182,0.3)] hover:shadow-[0_0_40px_rgba(244,114,182,0.6)] transition-all active:scale-95 flex items-center justify-center gap-3">
                      <Lock className="w-4 h-4" /> Decrypt
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* --- PHASE 3: THE CHAT INTERFACE (Step 9) --- */}
            {seqStep === 9 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                className="w-[95vw] md:w-[600px] h-[85vh] bg-[#0B141A] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10 relative z-50"
              >
                {/* Chat Header */}
                <div className="bg-[#202C33]/95 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/5 z-20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#F472B6] flex items-center justify-center shadow-inner">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg tracking-wide">Kripton & Moon</h3>
                      <p className="text-[#F472B6] text-xs font-mono tracking-widest uppercase">AUTH: {identity}</p>
                    </div>
                  </div>
                  <button onClick={() => setSeqStep(0)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-3 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#0B141A] relative z-10">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-repeat bg-[length:300px]"></div>
                  
                  <div className="flex justify-center mb-8 relative z-10">
                    <span className="bg-white/5 border border-white/10 text-white/50 text-xs font-mono tracking-widest uppercase px-5 py-2 rounded-full backdrop-blur-md">
                      Secure Connection Established
                    </span>
                  </div>

                  <div className="relative z-10 space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.sender === identity;
                      return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[85%] px-4 pt-3 pb-2 rounded-2xl relative shadow-lg ${isMe ? "bg-gradient-to-br from-[#005C4B] to-[#014d3f] text-[#E9EDEF] rounded-tr-sm" : "bg-[#202C33] border border-white/5 text-[#E9EDEF] rounded-tl-sm"}`}>
                            <p className="text-base leading-relaxed break-words font-sans">{msg.text}</p>
                            <div className="flex items-center justify-end gap-2 mt-2 opacity-60">
                              <span className="text-[10px] font-mono tracking-wider">{formatTime(msg.created_at)}</span>
                              {isMe && <CheckCheck className="w-4 h-4 text-[#53bdeb]" />}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>
                </div>

                {/* Chat Input */}
                <form onSubmit={sendMessage} className="bg-[#202C33] px-4 py-4 flex items-end gap-3 border-t border-white/5 z-20">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                    className="flex-1 bg-[#2A3942] text-[#E9EDEF] rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-1 focus:ring-[#F472B6] placeholder:text-[#8696A0] transition-all shadow-inner" />
                  <button type="submit" disabled={!newMessage.trim()} 
                    className="bg-gradient-to-tr from-[#9333EA] to-[#F472B6] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(244,114,182,0.5)] active:scale-90 flex-shrink-0">
                    <Send className="w-6 h-6 ml-1" />
                  </button>
                </form>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}