import { segmentScript } from "@/lib/integrations/gemini";
import { searchStockVideo } from "@/lib/integrations/stock-search";
import { getSettings } from "@/lib/settings";
import type { UserApiKeys } from "@/lib/user-keys";
import type { Scene } from "@/types/scene";

export async function generateScenesForScript(
  scriptText: string,
  userId: string,
  keys: UserApiKeys
): Promise<Scene[]> {
  const { readingSpeedBn, readingSpeedEn } = await getSettings(userId);
  const segmented = await segmentScript(scriptText, { bn: readingSpeedBn, en: readingSpeedEn }, keys);

  return Promise.all(
    segmented.map(async (s) => {
      const stockMatches = await searchStockVideo(s.searchKeywords, s.estimatedDurationSeconds, keys);
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
