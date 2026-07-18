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
  // Which stockMatches[].id the editor picked. Null = not decided yet; the
  // render agent falls back to stockMatches[0] in that case (see
  // docs/CONTRACT.md). Not yet settable from the UI — a future Scene Review
  // action should write this.
  selectedMatchId: string | null;
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

export type RenderStatus = "none" | "pending" | "claimed" | "done" | "failed";

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
  hasVoiceover: boolean;
  renderStatus: RenderStatus;
  renderError: string | null;
  hasFinalVideo: boolean;
  assignedAgentId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  readingSpeedBn: number;
  readingSpeedEn: number;
};
