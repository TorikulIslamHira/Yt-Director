import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { addPostedLinkSchema } from "@/lib/validation";
import { rowToProject, postedLinksFromRow } from "@/lib/projects";
import { sendTelegramMessage } from "@/lib/integrations/telegram";
import { getUserApiKeys } from "@/lib/user-keys";
import { getSession } from "@/lib/auth/session";
import type { PostedLink } from "@/types/scene";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = addPostedLinkSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const current = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!current) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  const existingLinks = postedLinksFromRow(current);
  const isFirstCompletion = current.completedAt === null;

  const now = Date.now();
  const newLink: PostedLink = { platform: parsed.data.platform, url: parsed.data.url, addedAt: now };
  const postedLinks = [...existingLinks, newLink];

  const result = await db
    .update(projects)
    .set({
      postedLinks: JSON.stringify(postedLinks),
      status: "completed",
      completedAt: current.completedAt ?? now,
      updatedAt: now,
    })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .returning();

  if (isFirstCompletion) {
    const keys = await getUserApiKeys(user.id);
    sendTelegramMessage(
      `🎉 "${current.title}" — সম্পন্ন হিসেবে চিহ্নিত হয়েছে (${parsed.data.platform}): ${parsed.data.url}`,
      keys
    );
  }

  return NextResponse.json({ project: rowToProject(result[0]) });
}
