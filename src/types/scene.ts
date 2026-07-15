export type StockMatch = {
  id: string;
  source: "pexels" | "pixabay";
  thumbnailUrl: string;
  downloadUrl: string;
  durationSeconds: number;
};

export type Scene = {
  id: string;
  index: number;
  title: string;
  description: string;
  estimatedDurationSeconds: number;
  status: "stock-match" | "ai-prompt";
  stockMatches: StockMatch[];
  aiPrompt: string | null;
  editingNote: string;
};

export type BgmInfo = {
  genre: string;
  durationSeconds: number;
};

export type ProjectStatus = "draft" | "editing" | "completed";

export type PostedPlatform = "youtube" | "facebook" | "other";

export type PostedLink = {
  platform: PostedPlatform;
  url: string;
  addedAt: number;
};

export type GenerationStatus = "idle" | "generating" | "done" | "error";

export type ProjectVersion = {
  scenes: Scene[];
  savedAt: number;
};

export type Project = {
  id: string;
  title: string;
  scriptText: string;
  scenes: Scene[];
  bgm: BgmInfo | null;
  status: ProjectStatus;
  postedLinks: PostedLink[];
  completedAt: number | null;
  generationStatus: GenerationStatus;
  generationError: string | null;
  previousVersions: ProjectVersion[];
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  readingSpeedBn: number;
  readingSpeedEn: number;
};
