import type { Scene } from "@/types/scene";

export const mockScenes: Scene[] = [
  {
    id: "scene-1",
    index: 1,
    title: "নদীর ধারে সূর্যাস্ত",
    description: "ধীর ক্যামেরা প্যান, সূর্যাস্তের আলোয় নদীর দৃশ্য।",
    estimatedDurationSeconds: 8,
    status: "stock-match",
    stockMatches: [
      {
        id: "m1",
        source: "pexels",
        thumbnailUrl: "https://images.pexels.com/videos/857195/free-video-857195.jpg",
        downloadUrl: "#",
        durationSeconds: 9,
      },
      {
        id: "m2",
        source: "pixabay",
        thumbnailUrl: "https://cdn.pixabay.com/photo/2016/11/29/09/13/sunset-1867689_1280.jpg",
        downloadUrl: "#",
        durationSeconds: 7,
      },
    ],
    aiPrompt: null,
    editingNote: "স্লো ফেড-ইন দিয়ে শুরু করুন।",
  },
  {
    id: "scene-2",
    index: 2,
    title: "শহরের ব্যস্ত রাস্তা, রাতের বেলা",
    description: "নিয়ন লাইট, দ্রুতগতির ট্রাফিক, উপর থেকে ড্রোন শট।",
    estimatedDurationSeconds: 6,
    status: "ai-prompt",
    stockMatches: [],
    aiPrompt:
      "Aerial drone shot of a busy city street at night, neon lights reflecting on wet asphalt, fast-moving traffic light trails, cinematic, 6 seconds.",
    editingNote: "ট্রানজিশনে দ্রুত কাট ব্যবহার করুন।",
  },
  {
    id: "scene-3",
    index: 3,
    title: "ল্যাপটপে কাজ করছেন এক ব্যক্তি",
    description: "ক্লোজ-আপ শট, হাত কীবোর্ডে টাইপ করছে, ঘরোয়া পরিবেশ।",
    estimatedDurationSeconds: 5,
    status: "stock-match",
    stockMatches: [
      {
        id: "m3",
        source: "pexels",
        thumbnailUrl: "https://images.pexels.com/videos/3196103/free-video-3196103.jpg",
        downloadUrl: "#",
        durationSeconds: 6,
      },
    ],
    aiPrompt: null,
    editingNote: "",
  },
  {
    id: "scene-4",
    index: 4,
    title: "পাহাড়ের চূড়া থেকে দৃশ্য",
    description: "ওয়াইড শট, মেঘের উপর দিয়ে পাহাড়ের সারি দেখা যাচ্ছে।",
    estimatedDurationSeconds: 7,
    status: "ai-prompt",
    stockMatches: [],
    aiPrompt:
      "Wide cinematic shot from a mountain peak above the clouds, sweeping mountain range, golden hour lighting, 7 seconds.",
    editingNote: "",
  },
];
