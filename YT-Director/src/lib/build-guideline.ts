import type { Scene } from "@/types/scene";

export function buildGuidelineText(scenes: Scene[]): string {
  const lines: string[] = ["yt-director — Editing Guideline", ""];

  for (const scene of scenes) {
    lines.push(`${scene.index}. ${scene.title}`);
    lines.push(`   বর্ণনা: ${scene.description}`);
    lines.push(`   আনুমানিক সময়: ~${scene.estimatedDurationSeconds}s`);
    lines.push(
      `   অবস্থা: ${scene.status === "stock-match" ? "স্টক ম্যাচ পাওয়া গেছে" : "এআই প্রম্পট (কোনো স্টক ম্যাচ পাওয়া যায়নি)"}`
    );
    if (scene.status === "ai-prompt" && scene.aiPrompt) {
      lines.push(`   এআই প্রম্পট: ${scene.aiPrompt}`);
    }
    if (scene.editingNote) {
      lines.push(`   নোট: ${scene.editingNote}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
