import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { isAuthorizedAgent } from "@/lib/auth/agent";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!isAuthorizedAgent(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!row?.voiceoverPath) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(row.voiceoverPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${id}-voiceover.mp3"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
