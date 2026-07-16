import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { scriptTemplates } from "@/db/schema";
import { createTemplateSchema } from "@/lib/validation";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const rows = await db.query.scriptTemplates.findMany({
    where: eq(scriptTemplates.userId, user.id),
    orderBy: desc(scriptTemplates.createdAt),
  });

  return NextResponse.json({
    templates: rows.map((r) => ({
      id: r.id,
      title: r.title,
      scriptText: r.scriptText,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const parsed = createTemplateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const id = randomUUID();
  await db.insert(scriptTemplates).values({
    id,
    userId: user.id,
    title: parsed.data.title,
    scriptText: parsed.data.scriptText,
    createdAt: Date.now(),
  });

  return NextResponse.json({ id });
}
