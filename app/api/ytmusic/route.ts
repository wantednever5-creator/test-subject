import { NextRequest, NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NormalizedTrack = {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number | null;
};

type HomeShelf = {
  title: string;
  items: NormalizedTrack[];
};

let ytClient: YTMusic | null = null;
let homeCache: { ts: number; shelves: HomeShelf[] } | null = null;

async function getYTMusicClient(): Promise<YTMusic> {
  if (ytClient) return ytClient;
  const client = new YTMusic();
  await client.initialize({
    GL: "IN",
    HL: "en",
    ...(process.env.YTMUSIC_COOKIES ? { cookies: process.env.YTMUSIC_COOKIES } : {})
  });
  ytClient = client;
  return client;
}

function resetYTMusicClient() {
  ytClient = null;
}

function pickThumbnail(thumbnails: any[] | undefined, videoId: string): string {
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    const best = thumbnails[thumbnails.length - 1];
    if (best?.url) return best.url;
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function extractArtist(item: any): string {
  if (Array.isArray(item?.artists) && item.artists.length > 0) {
    return item.artists.map((a: any) => a?.name).filter(Boolean).join(", ");
  }
  if (item?.artist?.name) return item.artist.name;
  if (typeof item?.artist === "string") return item.artist;
  return "YouTube Music";
}

function normalizeYTMItem(item: any): NormalizedTrack | null {
  const videoId = item?.videoId;
  if (!videoId || typeof videoId !== "string") return null;
  return {
    videoId,
    title: item?.name || item?.title || "Untitled Track",
    artist: extractArtist(item),
    thumbnail: pickThumbnail(item?.thumbnails, videoId),
    duration: typeof item?.duration === "number" ? item.duration : null
  };
}

function dedupeTracks(list: NormalizedTrack[]): NormalizedTrack[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item.videoId || seen.has(item.videoId)) return false;
    seen.add(item.videoId);
    return true;
  });
}

// Official YouTube Data API v3 Fallback (optional, activates if YOUTUBE_API_KEY is set)
async function ytDataApiSearch(query: string, maxResults = 15, embeddableOnly = false): Promise<NormalizedTrack[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    maxResults: String(maxResults),
    q: query,
    key: apiKey
  });
  if (embeddableOnly) params.set("videoEmbeddable", "true");

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
    cache: "no-store"
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.items)) return [];

  return data.items
    .map((item: any): NormalizedTrack | null => {
      const videoId = item?.id?.videoId;
      if (!videoId) return null;
      return {
        videoId,
        title: item?.snippet?.title || "Untitled Track",
        artist: item?.snippet?.channelTitle?.replace(/\s*-\s*Topic$/i, "") || "YouTube",
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: null
      };
    })
    .filter(Boolean) as NormalizedTrack[];
}

async function ytDataApiPlaylist(listId: string): Promise<NormalizedTrack[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    part: "snippet",
    maxResults: "50",
    playlistId: listId,
    key: apiKey
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`, {
    cache: "no-store"
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.items)) return [];

  return data.items
    .map((item: any): NormalizedTrack | null => {
      const videoId = item?.snippet?.resourceId?.videoId;
      const title = item?.snippet?.title;
      if (!videoId || title === "Deleted video" || title === "Private video") return null;
      return {
        videoId,
        title: title || "Untitled Track",
        artist: item?.snippet?.videoOwnerChannelTitle?.replace(/\s*-\s*Topic$/i, "") || "YouTube Music",
        thumbnail:
          item?.snippet?.thumbnails?.high?.url ||
          item?.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: null
      };
    })
    .filter(Boolean) as NormalizedTrack[];
}

async function ytDataApiTrending(): Promise<NormalizedTrack[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    videoCategoryId: "10",
    regionCode: "IN",
    maxResults: "15",
    key: apiKey
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`, {
    cache: "no-store"
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.items)) return [];

  return data.items.map((item: any) => ({
    videoId: item.id,
    title: item?.snippet?.title || "Untitled Track",
    artist: item?.snippet?.channelTitle?.replace(/\s*-\s*Topic$/i, "") || "YouTube",
    thumbnail:
      item?.snippet?.thumbnails?.high?.url ||
      item?.snippet?.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
    duration: null
  }));
}

async function filterTrulyEmbeddable(tracks: NormalizedTrack[]): Promise<NormalizedTrack[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || tracks.length === 0) return tracks;

  const ids = tracks.map((t) => t.videoId).slice(0, 20).join(",");
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=status&id=${ids}&key=${apiKey}`,
    { cache: "no-store" }
  );
  if (!res.ok) return tracks;

  const data = await res.json();
  const embeddableSet = new Set<string>();
  for (const item of data?.items || []) {
    if (item?.status?.embeddable === true) {
      embeddableSet.add(item.id);
    }
  }

  const filtered = tracks.filter((t) => embeddableSet.has(t.videoId));
  // Prefer non-label lyric/fan uploads first (label channels often have domain restrictions)
  const labelRegex = /(t-series|vevo|sony music|zee music|tips official|saregama|yrf| - topic$)/i;
  return filtered.sort((a, b) => {
    const aIsLabel = labelRegex.test(a.artist) ? 1 : 0;
    const bIsLabel = labelRegex.test(b.artist) ? 1 : 0;
    return aIsLabel - bIsLabel;
  });
}

async function searchSongsSmart(query: string, embedFallback = false): Promise<NormalizedTrack[]> {
  if (embedFallback) {
    const candidates: NormalizedTrack[] = [];
    if (process.env.YOUTUBE_API_KEY) {
      const apiTracks = await ytDataApiSearch(`${query} lyrics audio`, 12, true);
      candidates.push(...apiTracks);
    }
    try {
      const yt = await getYTMusicClient();
      const ytVids = await yt.searchVideos(`${query} lyrics`);
      candidates.push(...((ytVids || []).map(normalizeYTMItem).filter(Boolean) as NormalizedTrack[]));
    } catch (err) {
      resetYTMusicClient();
    }
    const deduped = dedupeTracks(candidates);
    return filterTrulyEmbeddable(deduped);
  }

  try {
    const yt = await getYTMusicClient();
    const raw = await yt.searchSongs(query);
    const parsed = dedupeTracks((raw || []).map(normalizeYTMItem).filter(Boolean) as NormalizedTrack[]);
    if (parsed.length > 0) return parsed;
  } catch (err) {
    console.error("ytmusic-api search failed, trying fallback:", err);
    resetYTMusicClient();
  }

  return dedupeTracks(await ytDataApiSearch(query, 18, false));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "search";

  try {
    // 1. SEARCH ALL OF YOUTUBE MUSIC
    if (action === "search") {
      const q = (searchParams.get("q") || "").trim();
      const embedFallback = searchParams.get("embedFallback") === "1";
      if (!q) return NextResponse.json({ tracks: [] });

      const tracks = await searchSongsSmart(q, embedFallback);
      return NextResponse.json({ tracks });
    }

    // 2. DISCOVER / HOME RECOMMENDATIONS
    if (action === "home") {
      if (homeCache && Date.now() - homeCache.ts < 15 * 60 * 1000 && homeCache.shelves.length > 0) {
        return NextResponse.json({ shelves: homeCache.shelves });
      }

      const shelves: HomeShelf[] = [];

      try {
        const yt = await getYTMusicClient();
        const sections = await yt.getHomeSections();
        if (Array.isArray(sections)) {
          for (const sec of sections) {
            const playable = dedupeTracks(
              (sec?.contents || [])
                .map(normalizeYTMItem)
                .filter(Boolean) as NormalizedTrack[]
            );
            if (playable.length >= 3) {
              shelves.push({
                title: sec.title || "Recommended",
                items: playable.slice(0, 12)
              });
            }
          }
        }
      } catch (err) {
        console.error("getHomeSections fallback triggered:", err);
        resetYTMusicClient();
      }

      // If anonymous cloud IP returned empty Home sections, build real trending/vibe shelves
      if (shelves.length === 0) {
        const [trending, romance, chill] = await Promise.all([
          process.env.YOUTUBE_API_KEY
            ? ytDataApiTrending()
            : searchSongsSmart("Top Trending Hindi English Songs"),
          searchSongsSmart("Romantic Hindi Bollywood Songs Arijit"),
          searchSongsSmart("Late Night Chill Indie Pop Songs")
        ]);

        if (trending.length > 0) shelves.push({ title: "Trending Now", items: trending.slice(0, 12) });
        if (romance.length > 0) shelves.push({ title: "Late Night Romance", items: romance.slice(0, 12) });
        if (chill.length > 0) shelves.push({ title: "Chill & Vibes", items: chill.slice(0, 12) });
      }

      if (shelves.length > 0) {
        homeCache = { ts: Date.now(), shelves };
      }

      return NextResponse.json({ shelves });
    }

    // 3. UP NEXT / AUTO-RECOMMENDATIONS RADIO
    if (action === "upnext") {
      const videoId = (searchParams.get("videoId") || "").trim();
      const title = (searchParams.get("title") || "").trim();
      const artist = (searchParams.get("artist") || "").trim();
      if (!videoId) return NextResponse.json({ tracks: [] });

      let tracks: NormalizedTrack[] = [];

      try {
        const yt = await getYTMusicClient();
        const upNexts = await yt.getUpNexts(videoId);
        tracks = dedupeTracks(
          (upNexts || [])
            .map(normalizeYTMItem)
            .filter((t): t is NormalizedTrack => Boolean(t && t.videoId !== videoId))
        );
      } catch (err) {
        console.error("getUpNexts fallback triggered:", err);
        resetYTMusicClient();
      }

      // Fallback if cloud IP blocked getUpNexts
      if (tracks.length === 0 && (artist || title)) {
        const fallbackQuery = artist && artist !== "YouTube Music" ? `${artist} top songs` : `${title} similar songs`;
        const similar = await searchSongsSmart(fallbackQuery, false);
        tracks = similar.filter((t) => t.videoId !== videoId).slice(0, 15);
      }

      return NextResponse.json({ tracks });
    }

    // 4. IMPORT UNLISTED / PUBLIC YOUTUBE MUSIC PLAYLIST
    if (action === "playlist") {
      const listId = (searchParams.get("listId") || "").trim();
      if (!listId) return NextResponse.json({ tracks: [] });

      let tracks: NormalizedTrack[] = [];

      try {
        const yt = await getYTMusicClient();
        const items = await yt.getPlaylistVideos(listId);
        tracks = dedupeTracks(
          (items || []).map(normalizeYTMItem).filter(Boolean) as NormalizedTrack[]
        );
      } catch (err) {
        console.error("getPlaylistVideos fallback triggered:", err);
        resetYTMusicClient();
      }

      if (tracks.length === 0) {
        tracks = dedupeTracks(await ytDataApiPlaylist(listId));
      }

      return NextResponse.json({ tracks });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("YT Music route error:", err);
    return NextResponse.json({ error: "Failed to fetch music data", tracks: [], shelves: [] }, { status: 500 });
  }
}