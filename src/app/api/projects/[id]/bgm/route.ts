import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, BGM_DIR } from "@/db/client";
import { projects } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!owned) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

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
