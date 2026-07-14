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
