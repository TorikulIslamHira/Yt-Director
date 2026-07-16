import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, projectShareLinks } from "@/db/schema";
import { randomToken } from "@/lib/crypto";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.query.projectShareLinks.findFirst({
    where: and(eq(projectShareLinks.projectId, id), eq(projectShareLinks.userId, user.id)),
  });

  return NextResponse.json({ token: existing?.token ?? null });
}

export async function POST(_req: NextRequest, { params }: Params) {
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

  const existing = await db.query.projectShareLinks.findFirst({
    where: eq(projectShareLinks.projectId, id),
  });
  if (existing) {
    return NextResponse.json({ token: existing.token });
  }

  const token = randomToken();
  await db.insert(projectShareLinks).values({
    token,
    projectId: id,
    userId: user.id,
    createdAt: Date.now(),
  });

  return NextResponse.json({ token });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  await db
    .delete(projectShareLinks)
    .where(and(eq(projectShareLinks.projectId, id), eq(projectShareLinks.userId, user.id)));

  return NextResponse.json({ ok: true });
}
