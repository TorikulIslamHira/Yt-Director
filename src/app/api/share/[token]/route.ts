import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, projectShareLinks } from "@/db/schema";
import { rowToProject, toShareView } from "@/lib/projects";

type Params = { params: Promise<{ token: string }> };

// Intentionally the one public, unauthenticated route in the app — no
// getSession() check. Only ever returns toShareView()'s narrow field set.
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const link = await db.query.projectShareLinks.findFirst({
    where: eq(projectShareLinks.token, token),
  });
  if (!link) {
    return NextResponse.json({ error: "এই লিংকটা আর কার্যকর নেই।" }, { status: 404 });
  }

  const row = await db.query.projects.findFirst({ where: eq(projects.id, link.projectId) });
  if (!row) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  return NextResponse.json({ project: toShareView(rowToProject(row)) });
}
