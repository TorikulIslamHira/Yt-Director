import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { scriptTemplates } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const { id } = await params;
  await db
    .delete(scriptTemplates)
    .where(and(eq(scriptTemplates.id, id), eq(scriptTemplates.userId, user.id)));

  return NextResponse.json({ ok: true });
}
