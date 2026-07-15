import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { createProjectSchema } from "@/lib/validation";
import { titleFromScript } from "@/lib/projects";

export async function GET() {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(desc(projects.updatedAt));

  return NextResponse.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  const parsed = createProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const now = Date.now();
  const id = randomUUID();

  await db.insert(projects).values({
    id,
    title: titleFromScript(parsed.data.scriptText),
    scriptText: parsed.data.scriptText,
    scenes: "[]",
    bgm: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id });
}
