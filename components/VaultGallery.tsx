"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, Loader2, Download, X, ChevronLeft,
  ChevronRight, Play, Trash2, Image as ImageIcon, Film,
  LayoutGrid, AlertCircle
} from "lucide-react";
import { supabase } from "../lib/supabase";

export type GalleryItem = {
  id: string;
  media_url: string;
  storage_path?: string | null;
  media_type: "image" | "video";
  sender: string;
  file_name?: string | null;
  source?: string | null;
  created_at: string;
  fromChatOnly?: boolean;
};

type FilterTab = "all" | "image" | "video";

const formatDisplayName = (name: string) => (name === "Kripton" ? "onegame" : name);

const formatGroupDate = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const formatFullTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};

export async function uploadMediaToVault(
  file: File,
  identity: string,
  source: "chat" | "gallery"
): Promise<{ publicUrl: string; storagePath: string; mediaType: "image" | "video"; fileName: string }> {
  const mediaType: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${source}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from("vault_media")
    .upload(storagePath, file, {
      contentType: file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
      cacheControl: "31536000",
      upsert: false
    });

  if (uploadErr) {
    throw new Error(uploadErr.message || "Upload failed");
  }

  const { data: urlData } = supabase.storage.from("vault_media").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  await supabase.from("vault_gallery").upsert(
    {
      media_url: publicUrl,
      storage_path: storagePath,
      media_type: mediaType,
      sender: formatDisplayName(identity),
      file_name: file.name,
      source
    },
    { onConflict: "media_url" }
  );

  return { publicUrl, storagePath, mediaType, fileName: file.name };
}

export async function downloadVaultMedia(url: string, type: "image" | "video", fileName?: string | null) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const ext = type === "video" ? "mp4" : "jpg";
    const downloadName = fileName && /\.[a-z0-9]{2,5}$/i.test(fileName) ? fileName : `Vault_${Date.now()}.${ext}`;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (_) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function VaultGallery({ identity, onClose }: { identity: string; onClose: () => void }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGallery = useCallback(async () => {
    const [{ data: galleryRows }, { data: chatMediaRows }] = await Promise.all([
      supabase.from("vault_gallery").select("*").order("created_at", { ascending: false }),
      supabase
        .from("secret_chat")
        .select("id, sender, media_url, media_type, created_at")
        .not("media_url", "is", null)
        .in("media_type", ["image", "video"])
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .limit(120)
    ]);

    const mergedMap = new Map<string, GalleryItem>();

    if (galleryRows) {
      for (const row of galleryRows as GalleryItem[]) {
        if (!row.media_url) continue;
        mergedMap.set(row.media_url, row);
      }
    }

    if (chatMediaRows) {
      for (const row of chatMediaRows as any[]) {
        if (!row.media_url || mergedMap.has(row.media_url)) continue;
        if (row.media_type !== "image" && row.media_type !== "video") continue;
        mergedMap.set(row.media_url, {
          id: `chat-${row.id}`,
          media_url: row.media_url,
          storage_path: null,
          media_type: row.media_type,
          sender: row.sender || "Vault",
          file_name: null,
          source: "chat",
          created_at: row.created_at,
          fromChatOnly: true
        });
      }
    }

    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setItems(sorted);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGallery();

    const channel = supabase
      .channel("vault_gallery_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vault_gallery" }, () => {
        fetchGallery();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGallery]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.media_type === filter);
  }, [items, filter]);

  const groupedSections = useMemo(() => {
    const groups: { label: string; items: { item: GalleryItem; flatIndex: number }[] }[] = [];
    const indexMap = new Map<string, number>();

    filteredItems.forEach((item, flatIndex) => {
      const label = formatGroupDate(item.created_at);
      if (!indexMap.has(label)) {
        indexMap.set(label, groups.length);
        groups.push({ label, items: [] });
      }
      groups[indexMap.get(label)!].items.push({ item, flatIndex });
    });

    return groups;
  }, [filteredItems]);

  const activeItem = viewerIndex !== null ? filteredItems[viewerIndex] ?? null : null;

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      else if (e.key === "ArrowRight") {
        setViewerIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setViewerIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewerIndex, filteredItems.length]);

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setErrorMsg(null);
    setUploadProgress({ current: 0, total: files.length });

    let failedCount = 0;
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        await uploadMediaToVault(files[i], identity, "gallery");
      } catch (err: any) {
        failedCount++;
        setErrorMsg(
          err?.message?.includes("maximum allowed size")
            ? "One or more files exceeded the 50 MB limit."
            : "Upload failed. Make sure the 'vault_media' bucket and 'vault_gallery' table exist in Supabase."
        );
      }
    }

    setUploadProgress(null);
    if (failedCount < files.length) {
      await fetchGallery();
    }
  };

  const handleDownloadActive = async (item: GalleryItem) => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadVaultMedia(item.media_url, item.media_type, item.file_name);
    setIsDownloading(false);
  };

  const handleDeleteActive = async (item: GalleryItem) => {
    if (item.fromChatOnly) {
      setErrorMsg("This item lives in an older chat message—delete it from chat.");
      return;
    }
    if (!window.confirm("Remove this item from the shared gallery?")) return;

    setIsDeleting(true);
    try {
      await supabase.from("vault_gallery").delete().eq("id", item.id);
      if (item.storage_path) {
        await supabase.storage.from("vault_media").remove([item.storage_path]);
      }
      setViewerIndex(null);
      await fetchGallery();
    } finally {
      setIsDeleting(false);
    }
  };

  const photoCount = items.filter((i) => i.media_type === "image").length;
  const videoCount = items.filter((i) => i.media_type === "video").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-[999995] bg-[#06090e] text-white flex flex-col w-screen h-[100dvh] overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-[300px] bg-gradient-to-b from-[#9333EA]/20 via-[#F472B6]/10 to-transparent blur-3xl" />

      {/* Top Glass Header */}
      <div className="relative z-10 flex items-center justify-between px-3.5 sm:px-6 py-3.5 border-b border-white/[0.07] bg-[#0b1017]/90 backdrop-blur-xl flex-shrink-0 gap-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-2 rounded-full text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Chat</span>
        </button>

        <div className="text-center min-w-0">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-white">Our Gallery</h2>
          <p className="text-[10px] text-white/45 font-mono">
            {photoCount} Photos • {videoCount} Videos
          </p>
        </div>

        <label className="flex items-center gap-1.5 bg-gradient-to-r from-[#9333EA] to-[#F472B6] hover:opacity-95 text-white text-xs font-semibold px-3.5 py-2 rounded-full cursor-pointer shadow-lg shadow-pink-500/20 transition-all flex-shrink-0">
          {uploadProgress ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                {uploadProgress.current}/{uploadProgress.total}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={Boolean(uploadProgress)}
            onChange={handleMultiUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Filter Pills Bar */}
      <div className="relative z-10 px-4 sm:px-6 py-2.5 border-b border-white/[0.06] bg-[#090e15]/80 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {[
            { id: "all" as FilterTab, label: `All (${items.length})`, icon: LayoutGrid },
            { id: "image" as FilterTab, label: `Photos (${photoCount})`, icon: ImageIcon },
            { id: "video" as FilterTab, label: `Videos (${videoCount})`, icon: Film }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-white text-black font-semibold shadow"
                    : "bg-white/[0.05] text-white/65 hover:text-white hover:bg-white/[0.1]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline text-[11px] text-white/40 font-mono">
          Cloud-only • Tap Download to save to device
        </span>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 px-4 py-2 bg-red-950/70 border-b border-red-500/30 text-red-200 text-xs flex items-center justify-between gap-2 flex-shrink-0"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-white/10 rounded-full">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date-Grouped Photo & Video Grid */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-5 pb-12">
        <div className="max-w-6xl mx-auto space-y-7">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3 text-white/45">
              <Loader2 className="w-7 h-7 text-[#F472B6] animate-spin" />
              <span className="text-xs font-mono">Opening Vault Gallery...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-[#F472B6]/80" />
              </div>
              <div>
                <p className="text-base font-medium text-white/90">No memories here yet</p>
                <p className="text-xs text-white/45 mt-1 max-w-xs">
                  Upload photos or videos directly here, or send them in chat—everything shared between you two saves here automatically.
                </p>
              </div>
            </div>
          ) : (
            groupedSections.map((group) => (
              <section key={group.label} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-white/60">
                    {group.label}
                  </h3>
                  <span className="text-[10px] font-mono text-white/35">
                    {group.items.length} {group.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2.5">
                  {group.items.map(({ item, flatIndex }) => (
                    <div
                      key={item.id}
                      onClick={() => setViewerIndex(flatIndex)}
                      className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#101722] border border-white/[0.06] cursor-pointer shadow-md"
                    >
                      {item.media_type === "video" ? (
                        <>
                          <video
                            src={`${item.media_url}#t=0.1`}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-white/90 border border-white/10">
                            Video
                          </span>
                        </>
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.file_name || "Photo"}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadVaultMedia(item.media_url, item.media_type, item.file_name);
                        }}
                        title="Download to device"
                        className="hidden sm:flex absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/15 p-1.5 rounded-full text-white"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-md text-white/85 truncate max-w-[80%]">
                          {formatDisplayName(item.sender)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* FULL-SCREEN CINEMA LIGHTBOX VIEWER */}
      <AnimatePresence>
        {activeItem && viewerIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/96 backdrop-blur-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent z-20 flex-shrink-0">
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate">{formatDisplayName(activeItem.sender)}</p>
                <p className="text-[11px] text-white/55 font-mono">
                  {formatFullTimestamp(activeItem.created_at)} • {viewerIndex + 1} / {filteredItems.length}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownloadActive(activeItem)}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-colors disabled:opacity-50"
                  title="Download to device"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-[#00c896]" />
                  )}
                  <span className="hidden sm:inline">Download</span>
                </button>

                {!activeItem.fromChatOnly && (
                  <button
                    onClick={() => handleDeleteActive(activeItem)}
                    disabled={isDeleting}
                    className="p-2.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 transition-colors disabled:opacity-50"
                    title="Delete from Gallery"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => setViewerIndex(null)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              onClick={() => setViewerIndex(null)}
              className="relative flex-1 min-h-0 flex items-center justify-center p-3 sm:p-8 select-none"
            >
              {viewerIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerIndex(viewerIndex - 1);
                  }}
                  className="absolute left-2 sm:left-5 z-20 p-3 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-white backdrop-blur-md transition-all"
                  title="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                {activeItem.media_type === "video" ? (
                  <video
                    key={activeItem.id}
                    src={activeItem.media_url}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="max-w-full max-h-[82dvh] rounded-2xl shadow-2xl bg-black"
                  />
                ) : (
                  <img
                    key={activeItem.id}
                    src={activeItem.media_url}
                    alt={activeItem.file_name || "Full screen"}
                    className="max-w-full max-h-[82dvh] object-contain rounded-2xl shadow-2xl"
                  />
                )}
              </div>

              {viewerIndex < filteredItems.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerIndex(viewerIndex + 1);
                  }}
                  className="absolute right-2 sm:right-5 z-20 p-3 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-white backdrop-blur-md transition-all"
                  title="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}