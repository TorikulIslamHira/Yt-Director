import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { buildGuidelineText } from "@/lib/build-guideline";
import { isAllowedMediaUrl } from "@/lib/allowed-media-hosts";
import type { Scene } from "@/types/scene";

export const maxDuration = 120;

function extensionFromUrl(url: string): string {
  const clean = url.split("?")[0];
  const ext = clean.split(".").pop();
  return ext && ext.length <= 4 ? ext : "mp4";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const scenes: Scene[] | undefined = body?.scenes;

  if (!Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: "কোনো দৃশ্য পাওয়া যায়নি।" }, { status: 400 });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.append(buildGuidelineText(scenes), { name: "editing-guideline.txt" });

  for (const scene of scenes) {
    const match = scene.stockMatches[0];
    if (!match || !isAllowedMediaUrl(match.downloadUrl)) continue;

    try {
      const res = await fetch(match.downloadUrl);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = extensionFromUrl(match.downloadUrl);
      archive.append(buffer, { name: `scene-${scene.index}.${ext}` });
    } catch {
      // skip clips that fail to fetch rather than failing the whole zip
    }
  }

  archive.finalize();

  const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="yt-director-export.zip"`,
    },
  });
}
