export type RawStockMatch = {
  id: string;
  source: "pexels" | "pixabay";
  thumbnailUrl: string;
  downloadUrl: string;
  durationSeconds: number;
};

type PexelsVideoFile = { quality: string; link: string };
type PexelsVideo = {
  id: number;
  image: string;
  duration: number;
  video_files: PexelsVideoFile[];
};

type PixabayVideo = {
  id: number;
  duration: number;
  videos: {
    medium: { url: string; thumbnail?: string };
  };
  userImageURL: string;
};

async function searchPexelsVideo(query: string): Promise<RawStockMatch[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=4`,
    { headers: { Authorization: apiKey } }
  );
  if (!res.ok) return [];

  const data: { videos: PexelsVideo[] } = await res.json();
  return (data.videos ?? []).map((v) => {
    const file =
      v.video_files.find((f) => f.quality === "sd") ?? v.video_files[0];
    return {
      id: `pexels-${v.id}`,
      source: "pexels" as const,
      thumbnailUrl: v.image,
      downloadUrl: file?.link ?? "",
      durationSeconds: v.duration,
    };
  });
}

async function searchPixabayVideo(query: string): Promise<RawStockMatch[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=4`
  );
  if (!res.ok) return [];

  const data: { hits: PixabayVideo[] } = await res.json();
  return (data.hits ?? []).map((v) => ({
    id: `pixabay-${v.id}`,
    source: "pixabay" as const,
    thumbnailUrl: v.videos.medium.thumbnail ?? v.userImageURL,
    downloadUrl: v.videos.medium.url,
    durationSeconds: v.duration,
  }));
}

export async function searchStockVideo(
  keywords: string,
  targetDurationSeconds: number
): Promise<RawStockMatch[]> {
  const [pexels, pixabay] = await Promise.all([
    searchPexelsVideo(keywords).catch(() => []),
    searchPixabayVideo(keywords).catch(() => []),
  ]);

  const all = [...pexels, ...pixabay].filter((m) => m.downloadUrl);
  all.sort(
    (a, b) =>
      Math.abs(a.durationSeconds - targetDurationSeconds) -
      Math.abs(b.durationSeconds - targetDurationSeconds)
  );
  return all.slice(0, 4);
}
