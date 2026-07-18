import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, VOICEOVER_DIR } from "@/db/client";
import { projects } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

function voiceoverPathFor(id: string): string {
  return path.join(VOICEOVER_DIR, `${id}.mp3`);
}

// Editor uploads the voiceover once script + scenes are locked in. This is
// what queues the project for the render agent (renderStatus -> "pending");
// see GET /api/render-agent/next-job for the agent-side claim.
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("voiceover");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ভয়েসওভার ফাইল পাওয়া যায়নি।" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: "ফাইলটি খালি।" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "ফাইলটি অনেক বড় (সর্বোচ্চ ২০০ MB)।" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(voiceoverPathFor(id), buffer);

  const now = Date.now();
  const result = await db
    .update(projects)
    .set({
      voiceoverPath: voiceoverPathFor(id),
      renderStatus: "pending",
      renderError: null,
      finalVideoPath: null,
      updatedAt: now,
    })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .returning();

  return NextResponse.json({ project: result[0], renderStatus: "pending" });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  await fs.rm(voiceoverPathFor(id), { force: true });
  await db
    .update(projects)
    .set({ voiceoverPath: null, renderStatus: "none", renderError: null, updatedAt: Date.now() })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

  return NextResponse.json({ ok: true });
}
