import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

// Serves the finished render once the render agent has completed the job
// (project.renderStatus === "done"). See docs/CONTRACT.md.
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  const row = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!row?.finalVideoPath) {
    return NextResponse.json({ error: "রেন্ডার করা ভিডিও পাওয়া যায়নি।" }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(row.finalVideoPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${id}.mp4"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "রেন্ডার করা ভিডিও পাওয়া যায়নি।" }, { status: 404 });
  }
}
