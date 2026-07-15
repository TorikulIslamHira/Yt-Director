const LOUDLY_BASE = "https://soundtracks.loudly.com/api/ai";

export type LoudlyGenre = {
  id: number;
  name: string;
  bpm: { low: number; high: number };
};

function apiKey(): string {
  const key = process.env.LOUDLY_API_KEY;
  if (!key) throw new Error("LOUDLY_API_KEY সেট করা নেই।");
  return key;
}

export async function fetchLoudlyGenres(): Promise<LoudlyGenre[]> {
  const res = await fetch(`${LOUDLY_BASE}/genres`, {
    headers: { "API-KEY": apiKey(), Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Loudly genres fetch failed (${res.status})`);
  }
  const data: { id: number; name: string; bpm: { low: number; high: number } }[] =
    await res.json();
  return data.map((g) => ({ id: g.id, name: g.name, bpm: g.bpm }));
}

export async function generateLoudlyTrack(
  genre: string,
  durationSeconds: number
): Promise<{ musicFilePath: string }> {
  const form = new FormData();
  form.append("genre", genre);
  form.append("duration", String(durationSeconds));

  const res = await fetch(`${LOUDLY_BASE}/songs`, {
    method: "POST",
    headers: { "API-KEY": apiKey(), Accept: "application/json" },
    body: form,
  });

  const data = await res.json();

  if (!res.ok) {
    const message: string = data?.error_description ?? data?.error ?? `Loudly API error (${res.status})`;
    throw new Error(message);
  }

  if (!data.music_file_path) {
    throw new Error("Loudly রেসপন্সে কোনো অডিও ফাইল পাওয়া যায়নি।");
  }

  return { musicFilePath: data.music_file_path };
}
