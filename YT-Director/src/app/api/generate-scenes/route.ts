import { NextRequest, NextResponse } from "next/server";
import { segmentScript } from "@/lib/gemini";
import { searchStockVideo } from "@/lib/stock-search";
import { generateScenesSchema } from "@/lib/validation";
import type { Scene } from "@/types/scene";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const parsed = generateScenesSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "স্ক্রিপ্ট টেক্সট পাওয়া যায়নি বা খুব ছোট।" },
      { status: 400 }
    );
  }
  const scriptText = parsed.data.text;

  let segmented;
  try {
    segmented = await segmentScript(scriptText);
  } catch (err) {
    return NextResponse.json(
      { error: `স্ক্রিপ্ট বিশ্লেষণ ব্যর্থ হয়েছে: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  const scenes: Scene[] = await Promise.all(
    segmented.map(async (s) => {
      const stockMatches = await searchStockVideo(
        s.searchKeywords,
        s.estimatedDurationSeconds
      );

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

  return NextResponse.json({ scenes });
}
