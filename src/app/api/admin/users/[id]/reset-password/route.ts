import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, sessions } from "@/db/schema";
import { adminResetPasswordSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/crypto";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }
  if (!admin.isAdmin) {
    return NextResponse.json({ error: "শুধু admin পাসওয়ার্ড রিসেট করতে পারবে।" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = adminResetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) {
    return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));

  return NextResponse.json({ ok: true });
}
