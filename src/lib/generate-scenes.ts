import { segmentScript } from "@/lib/integrations/gemini";
import { searchStockVideo } from "@/lib/integrations/stock-search";
import type { Scene } from "@/types/scene";

export async function generateScenesForScript(scriptText: string): Promise<Scene[]> {
  const segmented = await segmentScript(scriptText);

  return Promise.all(
    segmented.map(async (s) => {
      const stockMatches = await searchStockVideo(s.searchKeywords, s.estimatedDurationSeconds);
      const hasMatch = stockMatches.length > 0;
      return {
        id: s.id,
        index: s.index,
        title: s.title,
        description: s.description,
        estimatedDurationSeconds: s.estimatedDurationSeconds,
        status: hasMatch ? "stock-match" : "ai-prompt",
        stockMatches,
        aiPrompt: hasMatch ? null : s.aiPrompt,
        editingNote: "",
      } satisfies Scene;
    })
  );
}
