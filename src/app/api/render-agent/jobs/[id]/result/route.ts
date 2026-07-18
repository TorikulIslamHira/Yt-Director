import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, RENDER_DIR } from "@/db/client";
import { projects } from "@/db/schema";
import { isAuthorizedAgent } from "@/lib/auth/agent";

type Params = { params: Promise<{ id: string }> };

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

// Agent reports a successful render here. See docs/CONTRACT.md.
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
  const file = formData.get("video");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "video ফাইল পাওয়া যায়নি।" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "ফাইলটি অনেক বড়।" }, { status: 400 });
  }

  const outputPath = path.join(RENDER_DIR, `${id}.mp4`);
  await fs.writeFile(outputPath, Buffer.from(await file.arrayBuffer()));

  await db
    .update(projects)
    .set({
      renderStatus: "done",
      renderError: null,
      finalVideoPath: outputPath,
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    })
    .where(eq(projects.id, id));

  return NextResponse.json({ ok: true });
}
