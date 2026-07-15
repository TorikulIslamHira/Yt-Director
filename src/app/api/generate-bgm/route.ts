import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { generateLoudlyTrack } from "@/lib/integrations/loudly";
import { generateBgmSchema } from "@/lib/validation";
import { db, BGM_DIR } from "@/db/client";
import { projects } from "@/db/schema";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const parsed = generateBgmSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { genre, durationSeconds, projectId } = parsed.data;

  let musicFilePath: string;
  try {
    const result = await generateLoudlyTrack(genre, durationSeconds);
    musicFilePath = result.musicFilePath;
  } catch (err) {
    const message = (err as Error).message;
    const isCredits = /credit/i.test(message);
    return NextResponse.json({ error: message }, { status: isCredits ? 402 : 502 });
  }

  const audioRes = await fetch(musicFilePath);
  if (!audioRes.ok || !audioRes.body) {
    return NextResponse.json(
      { error: "তৈরি হওয়া অডিও ফাইল আনা যায়নি।" },
      { status: 502 }
    );
  }

  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

  if (projectId) {
    try {
      await fs.writeFile(path.join(BGM_DIR, `${projectId}.mp3`), audioBuffer);
      await db
        .update(projects)
        .set({ bgm: JSON.stringify({ genre, durationSeconds }), updatedAt: Date.now() })
        .where(eq(projects.id, projectId));
    } catch {
      // persistence is best-effort — the download still succeeds without it
    }
  }

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": audioRes.headers.get("content-type") ?? "audio/mpeg",
      "Content-Disposition": `attachment; filename="${genre.toLowerCase().replace(/\s+/g, "-")}.mp3"`,
    },
  });
}
