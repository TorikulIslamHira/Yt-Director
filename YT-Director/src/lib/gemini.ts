const GEMINI_MODEL = "gemini-2.5-flash";

// Rough words-per-minute for spoken narration, used only to size stock clip
// length per scene — no TTS audio is ever generated (locked decision, see
// PIPELINE_PLAN.md).
const READING_SPEED_WPM = { bn: 120, en: 150 } as const;

function detectLanguage(text: string): "bn" | "en" {
  return /[ঀ-৿]/.test(text) ? "bn" : "en";
}

export function estimateDurationSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = READING_SPEED_WPM[detectLanguage(text)];
  return Math.max(2, Math.round((words / wpm) * 60));
}

type GeminiRawScene = {
  title: string;
  narration: string;
  searchKeywords: string;
  aiPrompt: string;
};

export type SegmentedScene = {
  id: string;
  index: number;
  title: string;
  description: string;
  estimatedDurationSeconds: number;
  searchKeywords: string;
  aiPrompt: string;
};

export async function segmentScript(scriptText: string): Promise<SegmentedScene[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY সেট করা নেই।");
  }

  const prompt = `You are a video production assistant. Split the following script into scenes for a short video, at SENTENCE-LEVEL granularity: treat each sentence (or independent clause, if a sentence contains multiple distinct visual ideas) as its OWN separate scene. Do not merge multiple sentences into a single scene, even if they describe related or continuous action — each scene's narration must correspond to exactly one sentence (or clause) from the original script, and every sentence in the script must produce at least one scene, in order.

For each scene, provide:
- "title": a short scene title, in the same language as the script
- "narration": the exact sentence/clause from the script that belongs to this scene (do not translate, paraphrase, or combine it with other sentences)
- "searchKeywords": 2-4 English keywords best suited for searching free stock video footage (Pexels/Pixabay) matching this specific scene — make these as visually specific as possible (subject, action, setting) so consecutive scenes search for visibly different footage rather than near-duplicates
- "aiPrompt": a detailed English text-to-video AI generation prompt describing this scene visually, to use as a fallback if no stock footage is found

Return ONLY a JSON array, no prose, no markdown fences.

Script:
"""
${scriptText}
"""`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                narration: { type: "STRING" },
                searchKeywords: { type: "STRING" },
                aiPrompt: { type: "STRING" },
              },
              required: ["title", "narration", "searchKeywords", "aiPrompt"],
            },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini থেকে কোনো রেসপন্স পাওয়া যায়নি।");
  }

  const rawScenes: GeminiRawScene[] = JSON.parse(text);

  return rawScenes.map((s, i) => ({
    id: `scene-${i + 1}`,
    index: i + 1,
    title: s.title,
    description: s.narration,
    estimatedDurationSeconds: estimateDurationSeconds(s.narration),
    searchKeywords: s.searchKeywords,
    aiPrompt: s.aiPrompt,
  }));
}
