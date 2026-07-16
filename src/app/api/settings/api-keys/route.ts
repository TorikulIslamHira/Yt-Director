import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userApiKeys } from "@/db/schema";
import { apiKeysSchema } from "@/lib/validation";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { getSession } from "@/lib/auth/session";

const FIELDS = [
  ["gemini", "geminiKeyEnc"],
  ["groq", "groqKeyEnc"],
  ["pexels", "pexelsKeyEnc"],
  ["pixabay", "pixabayKeyEnc"],
  ["telegramBotToken", "telegramBotTokenEnc"],
  ["telegramChatId", "telegramChatIdEnc"],
] as const;

function maskedStatus(enc: string | null): { isSet: boolean; last4: string | null } {
  if (!enc) return { isSet: false, last4: null };
  try {
    const plaintext = decryptSecret(enc);
    return { isSet: true, last4: plaintext.slice(-4) };
  } catch {
    return { isSet: true, last4: null };
  }
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const row = await db.query.userApiKeys.findFirst({ where: eq(userApiKeys.userId, user.id) });

  const status = Object.fromEntries(
    FIELDS.map(([name, column]) => [name, maskedStatus(row?.[column] ?? null)])
  );

  return NextResponse.json({ apiKeys: status });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const parsed = apiKeysSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  for (const [name, column] of FIELDS) {
    const value = parsed.data[name];
    if (value !== undefined) {
      updates[column] = encryptSecret(value);
    }
  }

  await db
    .insert(userApiKeys)
    .values({ userId: user.id, updatedAt: Date.now(), ...updates })
    .onConflictDoUpdate({
      target: userApiKeys.userId,
      set: { updatedAt: Date.now(), ...updates },
    });

  return NextResponse.json({ ok: true });
}
