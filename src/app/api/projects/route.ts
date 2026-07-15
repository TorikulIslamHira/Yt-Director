import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { createProjectSchema } from "@/lib/validation";
import { titleFromScript, postedLinksFromRow } from "@/lib/projects";

export async function GET() {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      postedUrl: projects.postedUrl,
      postedPlatform: projects.postedPlatform,
      postedLinks: projects.postedLinks,
      completedAt: projects.completedAt,
      generationStatus: projects.generationStatus,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(desc(projects.updatedAt));

  const summaries = rows.map(({ postedUrl, postedPlatform, ...row }) => ({
    ...row,
    postedLinks: postedLinksFromRow({ ...row, postedUrl, postedPlatform }),
  }));

  return NextResponse.json({ projects: summaries });
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
    title: parsed.data.title || titleFromScript(parsed.data.scriptText),
    scriptText: parsed.data.scriptText,
    scenes: "[]",
    bgm: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id });
}
