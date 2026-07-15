import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { BGM_DIR } from "@/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const buffer = await fs.readFile(path.join(BGM_DIR, `${id}.mp3`));
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="background-music.mp3"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "কোনো BGM ফাইল পাওয়া যায়নি।" }, { status: 404 });
  }
}
