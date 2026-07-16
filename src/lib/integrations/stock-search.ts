import { fetchWithRetry } from "./fetch-retry";
import type { UserApiKeys } from "@/lib/user-keys";

export type RawStockMatch = {
  id: string;
  source: "pexels" | "pixabay";
  thumbnailUrl: string;
  downloadUrl: string;
  durationSeconds: number;
};

type PexelsVideoFile = { quality: string; link: string; width?: number; height?: number };
type PexelsVideo = {
  id: number;
  image: string;
  duration: number;
  video_files: PexelsVideoFile[];
};

type PixabayVideoRendition = { url: string; width: number; height: number; thumbnail?: string };
type PixabayVideo = {
  id: number;
  duration: number;
  videos: {
    large?: PixabayVideoRendition;
    medium?: PixabayVideoRendition;
    small?: PixabayVideoRendition;
    tiny?: PixabayVideoRendition;
  };
  userImageURL: string;
};

const MIN_TARGET_HEIGHT = 720;
const MAX_TARGET_HEIGHT = 1080;

// Prefer a rendition in the 720p-1080p range (highest within it) — below
// 720p looks noticeably soft in a finished video, and above 1080p is wasted
// bandwidth/storage for this app's output. Falls back to whatever's closest
// when nothing in-range is available (e.g. an old low-res clip).
function pickBestRendition<T extends { width?: number; height?: number }>(
  files: T[]
): T | undefined {
  const withHeight = files.filter((f) => f.height && f.height > 0);
  if (withHeight.length === 0) return files[0];

  const inRange = withHeight.filter(
    (f) => f.height! >= MIN_TARGET_HEIGHT && f.height! <= MAX_TARGET_HEIGHT
  );
  if (inRange.length > 0) {
    return inRange.sort((a, b) => b.height! - a.height!)[0];
  }

  const midpoint = (MIN_TARGET_HEIGHT + MAX_TARGET_HEIGHT) / 2;
  return withHeight.sort(
    (a, b) => Math.abs(a.height! - midpoint) - Math.abs(b.height! - midpoint)
  )[0];
}

async function searchPexelsVideo(query: string, apiKey: string | null): Promise<RawStockMatch[]> {
  if (!apiKey) {
    return [];
  }

  const res = await fetchWithRetry(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=4`,
    { headers: { Authorization: apiKey } }
  );
  if (!res.ok) return [];

  const data: { videos: PexelsVideo[] } = await res.json();
  return (data.videos ?? []).map((v) => {
    const file = pickBestRendition(v.video_files);
    return {
      id: `pexels-${v.id}`,
      source: "pexels" as const,
      thumbnailUrl: v.image,
      downloadUrl: file?.link ?? "",
      durationSeconds: v.duration,
    };
  });
}

async function searchPixabayVideo(query: string, apiKey: string | null): Promise<RawStockMatch[]> {
  if (!apiKey) {
    return [];
  }

  const res = await fetchWithRetry(
    `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=4`
  );
  if (!res.ok) return [];

  const data: { hits: PixabayVideo[] } = await res.json();
  return (data.hits ?? []).map((v) => {
    const renditions = [v.videos.large, v.videos.medium, v.videos.small, v.videos.tiny].filter(
      (r): r is PixabayVideoRendition => !!r
    );
    const best = pickBestRendition(renditions);
    return {
      id: `pixabay-${v.id}`,
      source: "pixabay" as const,
      thumbnailUrl: best?.thumbnail ?? v.userImageURL,
      downloadUrl: best?.url ?? "",
      durationSeconds: v.duration,
    };
  });
}

export async function searchStockVideo(
  keywords: string,
  targetDurationSeconds: number,
  keys: Pick<UserApiKeys, "pexelsKey" | "pixabayKey">
): Promise<RawStockMatch[]> {
  const [pexels, pixabay] = await Promise.all([
    searchPexelsVideo(keywords, keys.pexelsKey).catch(() => []),
    searchPixabayVideo(keywords, keys.pixabayKey).catch(() => []),
  ]);

  const all = [...pexels, ...pixabay].filter((m) => m.downloadUrl);
  all.sort(
    (a, b) =>
      Math.abs(a.durationSeconds - targetDurationSeconds) -
      Math.abs(b.durationSeconds - targetDurationSeconds)
  );
  return all.slice(0, 4);
}
