import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { isAuthorizedAgent } from "@/lib/auth/agent";

type Params = { params: Promise<{ id: string }> };

// Agent reports a failed render here — a claimed job never stays "stuck"
// silently, it always ends in "done" or "failed" with a reason. See
// docs/CONTRACT.md.
export async function POST(req: NextRequest, { params }: Params) {
  if (!isAuthorizedAgent(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const error = formData.get("error");
  const message = typeof error === "string" && error.trim() !== "" ? error.slice(0, 2000) : "অজানা এরর।";

  await db
    .update(projects)
    .set({ renderStatus: "failed", renderError: message, updatedAt: Date.now() })
    .where(eq(projects.id, id));

  return NextResponse.json({ ok: true });
}
