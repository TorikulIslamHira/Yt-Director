import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { restoreVersionSchema } from "@/lib/validation";
import { rowToProject } from "@/lib/projects";
import type { ProjectVersion } from "@/types/scene";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = restoreVersionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  let previousVersions: ProjectVersion[] = [];
  try {
    previousVersions = JSON.parse(project.previousVersions || "[]") as ProjectVersion[];
  } catch {
    previousVersions = [];
  }

  const version = previousVersions[parsed.data.index];
  if (!version) {
    return NextResponse.json({ error: "এই ভার্সনটা পাওয়া যায়নি।" }, { status: 404 });
  }

  const result = await db
    .update(projects)
    .set({ scenes: JSON.stringify(version.scenes), updatedAt: Date.now() })
    .where(eq(projects.id, id))
    .returning();

  return NextResponse.json({ project: rowToProject(result[0]) });
}
