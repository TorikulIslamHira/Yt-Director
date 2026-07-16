import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, userApiKeys } from "@/db/schema";
import { signupSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/crypto";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const parsed = signupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (existing) {
    return NextResponse.json({ error: "এই ইমেইল দিয়ে অ্যাকাউন্ট আগে থেকেই আছে।" }, { status: 409 });
  }

  const now = Date.now();
  const id = randomUUID();

  await db.insert(users).values({
    id,
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
    createdAt: now,
  });
  await db.insert(userApiKeys).values({ userId: id, updatedAt: now });

  await createSession(id);

  return NextResponse.json({ email: parsed.data.email });
}
