import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "ইমেইল বা পাসওয়ার্ড ভুল।" }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({ email: user.email });
}
