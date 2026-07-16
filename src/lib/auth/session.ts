import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { randomToken } from "@/lib/crypto";

export const SESSION_COOKIE = "session_token";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = { id: string; email: string; isAdmin: boolean };

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const now = Date.now();
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: now + SESSION_TTL_MS,
    createdAt: now,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.query.sessions.findFirst({ where: eq(sessions.token, token) });
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) return null;

  return { id: user.id, email: user.email, isAdmin: user.isAdmin === 1 };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}
