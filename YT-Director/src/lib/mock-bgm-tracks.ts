export type BgmTrack = {
  id: string;
  title: string;
  mood: "উদ্দীপনামূলক" | "শান্ত" | "কর্পোরেট" | "নাটকীয়";
  durationSeconds: number;
  downloadUrl: string;
};

export const mockBgmTracks: BgmTrack[] = [
  { id: "t1", title: "Morning Rise", mood: "শান্ত", durationSeconds: 96, downloadUrl: "#" },
  { id: "t2", title: "City Pulse", mood: "উদ্দীপনামূলক", durationSeconds: 120, downloadUrl: "#" },
  { id: "t3", title: "Boardroom", mood: "কর্পোরেট", durationSeconds: 88, downloadUrl: "#" },
  { id: "t4", title: "Tension Build", mood: "নাটকীয়", durationSeconds: 104, downloadUrl: "#" },
];

export const BGM_MOODS = ["সব", "উদ্দীপনামূলক", "শান্ত", "কর্পোরেট", "নাটকীয়"] as const;
