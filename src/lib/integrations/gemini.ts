import { fetchWithRetry } from "./fetch-retry";
import type { UserApiKeys } from "@/lib/user-keys";

const GEMINI_MODEL = "gemini-2.5-flash";
// Fallback when Gemini's free-tier quota (20 req/day) runs out — same JSON-mode
// contract, OpenAI-compatible endpoint, no separate SDK needed.
const GROQ_MODEL = "llama-3.3-70b-versatile";

type GenerationKeys = Pick<UserApiKeys, "geminiKey" | "groqKey">;

async function callGroqJson(prompt: string, groqKey: string): Promise<string> {
  const res = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errBody}`);
  }
  const data = await res.json();
  const text: string | undefined = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq থেকে কোনো রেসপন্স পাওয়া যায়নি।");
  }
  return text;
}

// Rough words-per-minute for spoken narration, used only to size stock clip
// length per scene — no TTS audio is ever generated (locked decision, see
// docs/PIPELINE_PLAN.md). Tunable at runtime via the /settings page
// (src/lib/settings.ts) rather than hardcoded, per the "tune with real
// script samples" open item in docs/PIPELINE_PLAN.md.
const DEFAULT_READING_SPEED_WPM = { bn: 120, en: 150 } as const;

export type ReadingSpeedWpm = { bn: number; en: number };

function detectLanguage(text: string): "bn" | "en" {
  return /[ঀ-৿]/.test(text) ? "bn" : "en";
}

export function estimateDurationSeconds(
  text: string,
  wpmOverride: ReadingSpeedWpm = DEFAULT_READING_SPEED_WPM
): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = wpmOverride[detectLanguage(text)];
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

function buildSegmentPrompt(scriptText: string): string {
  return `You are a video production assistant. Split the following script into scenes for a short video, at SENTENCE-LEVEL granularity: treat each sentence (or independent clause, if a sentence contains multiple distinct visual ideas) as its OWN separate scene. Do not merge multiple sentences into a single scene, even if they describe related or continuous action — each scene's narration must correspond to exactly one sentence (or clause) from the original script, and every sentence in the script must produce at least one scene, in order.

For each scene, provide:
- "title": a short scene title, in the same language as the script
- "narration": the exact sentence/clause from the script that belongs to this scene (do not translate, paraphrase, or combine it with other sentences)
- "searchKeywords": 2-4 English keywords best suited for searching free stock video footage (Pexels/Pixabay) matching this specific scene — make these as visually specific as possible (subject, action, setting) so consecutive scenes search for visibly different footage rather than near-duplicates
- "aiPrompt": a detailed English text-to-video AI generation prompt describing this scene visually, to use as a fallback if no stock footage is found

Script:
"""
${scriptText}
"""`;
}

async function segmentScriptViaGemini(scriptText: string, geminiKey: string): Promise<GeminiRawScene[]> {
  const prompt = `${buildSegmentPrompt(scriptText)}

Return ONLY a JSON array, no prose, no markdown fences.`;

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
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

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini থেকে সঠিক ফরম্যাটে ডেটা পাওয়া যায়নি, আবার চেষ্টা করুন।");
  }
}

async function segmentScriptViaGroq(scriptText: string, groqKey: string): Promise<GeminiRawScene[]> {
  const prompt = `${buildSegmentPrompt(scriptText)}

Return ONLY a JSON object, no prose, no markdown fences, matching EXACTLY this shape (each field is a single string, "searchKeywords" is ONE comma-separated string, not a list):
{"scenes": [{"title": "...", "narration": "...", "searchKeywords": "keyword one, keyword two, keyword three", "aiPrompt": "..."}]}`;

  const text = await callGroqJson(prompt, groqKey);
  let parsed: { scenes?: GeminiRawScene[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Groq থেকে সঠিক ফরম্যাটে ডেটা পাওয়া যায়নি, আবার চেষ্টা করুন।");
  }
  if (!Array.isArray(parsed.scenes)) {
    throw new Error("Groq থেকে সঠিক ফরম্যাটে ডেটা পাওয়া যায়নি, আবার চেষ্টা করুন।");
  }
  return parsed.scenes;
}

export async function segmentScript(
  scriptText: string,
  wpmOverride: ReadingSpeedWpm | undefined,
  keys: GenerationKeys
): Promise<SegmentedScene[]> {
  if (!keys.geminiKey && !keys.groqKey) {
    throw new Error("আপনার Settings-এ Gemini অথবা Groq API key যোগ করুন।");
  }

  let rawScenes: GeminiRawScene[];
  if (keys.geminiKey) {
    try {
      rawScenes = await segmentScriptViaGemini(scriptText, keys.geminiKey);
    } catch (geminiErr) {
      if (!keys.groqKey) throw geminiErr;
      rawScenes = await segmentScriptViaGroq(scriptText, keys.groqKey);
    }
  } else {
    rawScenes = await segmentScriptViaGroq(scriptText, keys.groqKey!);
  }

  return rawScenes.map((s, i) => ({
    id: `scene-${i + 1}`,
    index: i + 1,
    title: s.title,
    description: s.narration,
    estimatedDurationSeconds: estimateDurationSeconds(s.narration, wpmOverride),
    searchKeywords: s.searchKeywords,
    aiPrompt: s.aiPrompt,
  }));
}

export type VideoMetadata = {
  titles: string[];
  description: string;
  tags: string[];
};

function buildMetadataPrompt(scriptText: string): string {
  return `You are a YouTube SEO assistant. Based on the following video script, write publish-ready metadata, in the same language as the script:
- "titles": exactly 3 distinct compelling, click-worthy YouTube title options (max ~70 characters each) — vary the angle/hook between them so they're genuinely different choices, not near-duplicates
- "description": a 2-4 sentence YouTube description summarizing the video and inviting engagement
- "tags": 8-15 relevant search tags/keywords as an array of short strings

Script:
"""
${scriptText}
"""`;
}

async function generateVideoMetadataViaGemini(scriptText: string, geminiKey: string): Promise<VideoMetadata> {
  const prompt = `${buildMetadataPrompt(scriptText)}

Return ONLY a JSON object, no prose, no markdown fences.`;

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              titles: { type: "ARRAY", items: { type: "STRING" } },
              description: { type: "STRING" },
              tags: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["titles", "description", "tags"],
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

  try {
    return JSON.parse(text) as VideoMetadata;
  } catch {
    throw new Error("Gemini থেকে সঠিক ফরম্যাটে ডেটা পাওয়া যায়নি, আবার চেষ্টা করুন।");
  }
}

async function generateVideoMetadataViaGroq(scriptText: string, groqKey: string): Promise<VideoMetadata> {
  const prompt = `${buildMetadataPrompt(scriptText)}

Return ONLY a JSON object, no prose, no markdown fences, matching EXACTLY this shape ("titles" and "tags" are arrays of strings):
{"titles": ["...", "...", "..."], "description": "...", "tags": ["...", "..."]}`;

  const text = await callGroqJson(prompt, groqKey);
  try {
    return JSON.parse(text) as VideoMetadata;
  } catch {
    throw new Error("Groq থেকে সঠিক ফরম্যাটে ডেটা পাওয়া যায়নি, আবার চেষ্টা করুন।");
  }
}

export async function generateVideoMetadata(scriptText: string, keys: GenerationKeys): Promise<VideoMetadata> {
  if (!keys.geminiKey && !keys.groqKey) {
    throw new Error("আপনার Settings-এ Gemini অথবা Groq API key যোগ করুন।");
  }

  if (keys.geminiKey) {
    try {
      return await generateVideoMetadataViaGemini(scriptText, keys.geminiKey);
    } catch (geminiErr) {
      if (!keys.groqKey) throw geminiErr;
      return generateVideoMetadataViaGroq(scriptText, keys.groqKey);
    }
  }
  return generateVideoMetadataViaGroq(scriptText, keys.groqKey!);
}
