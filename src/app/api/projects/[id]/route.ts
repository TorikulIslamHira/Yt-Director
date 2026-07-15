import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, BGM_DIR } from "@/db/client";
import { projects } from "@/db/schema";
import { updateProjectSchema } from "@/lib/validation";
import { rowToProject } from "@/lib/projects";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!row) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }
  return NextResponse.json({ project: rowToProject(row) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = updateProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updates: Partial<typeof projects.$inferInsert> = { updatedAt: Date.now() };
  if (parsed.data.scenes) updates.scenes = JSON.stringify(parsed.data.scenes);
  if (parsed.data.bgm) updates.bgm = JSON.stringify(parsed.data.bgm);

  const result = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
  if (result.length === 0) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  return NextResponse.json({ project: rowToProject(result[0]) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.delete(projects).where(eq(projects.id, id));
  await fs.rm(path.join(BGM_DIR, `${id}.mp3`), { force: true });
  return NextResponse.json({ ok: true });
}
