import type { Scene } from "@/types/scene";

const FPS = 30;

function extensionFromUrl(url: string): string {
  const clean = url.split("?")[0];
  const ext = clean.split(".").pop();
  return ext && ext.length <= 4 ? ext : "mp4";
}

function toFrames(seconds: number): number {
  return Math.max(1, Math.round(seconds * FPS));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Only "stock-match" scenes get a real clip file in the zip (from
// download-zip/route.ts, named scene-{index}.{ext}) — "ai-prompt" scenes have
// no downloadable footage yet, so they're left out of the timeline rather
// than referencing a file that won't exist.
export function buildFcpxml(scenes: Scene[]): string {
  const clipScenes = scenes.filter((s) => s.status === "stock-match" && s.stockMatches[0]);

  let offsetFrames = 0;
  const assets: string[] = [];
  const clips: string[] = [];

  clipScenes.forEach((scene, i) => {
    const match = scene.stockMatches[0];
    const ext = extensionFromUrl(match.downloadUrl);
    const fileName = `scene-${scene.index}.${ext}`;
    const assetId = `a${i + 1}`;
    const durationFrames = toFrames(match.durationSeconds || scene.estimatedDurationSeconds);
    const name = escapeXml(`${scene.index}. ${scene.title}`);

    assets.push(
      `    <asset id="${assetId}" name="${name}" src="./${fileName}" hasVideo="1" duration="${durationFrames}/${FPS}s"/>`
    );
    clips.push(
      `        <asset-clip ref="${assetId}" name="${name}" offset="${offsetFrames}/${FPS}s" duration="${durationFrames}/${FPS}s" start="0/${FPS}s"/>`
    );
    offsetFrames += durationFrames;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="1/${FPS}s" width="1920" height="1080"/>
${assets.join("\n")}
  </resources>
  <library>
    <event name="yt-director">
      <project name="yt-director-timeline">
        <sequence format="r1" duration="${offsetFrames}/${FPS}s" tcStart="0s">
          <spine>
${clips.join("\n")}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
