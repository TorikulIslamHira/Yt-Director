import type { Scene } from "@/types/scene";

function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

// Timing is estimated from word-count/reading-speed (same basis as
// estimatedDurationSeconds elsewhere in the app) — not derived from real
// narration audio, since no TTS is generated (see docs/PIPELINE_PLAN.md).
export function buildSrt(scenes: Scene[]): string {
  let cursor = 0;
  const blocks: string[] = [];

  scenes.forEach((scene, i) => {
    const start = cursor;
    const end = cursor + scene.estimatedDurationSeconds;
    cursor = end;
    blocks.push(
      `${i + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${scene.description}\n`
    );
  });

  return blocks.join("\n");
}
