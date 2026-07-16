import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userApiKeys } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto";

export type UserApiKeys = {
  geminiKey: string | null;
  groqKey: string | null;
  pexelsKey: string | null;
  pixabayKey: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
};

function decryptOrNull(enc: string | null): string | null {
  if (!enc) return null;
  try {
    return decryptSecret(enc);
  } catch {
    return null;
  }
}

// No fallback to process.env here by design — each user's usage must only
// ever touch their own API key/quota, never another user's or a shared one.
export async function getUserApiKeys(userId: string): Promise<UserApiKeys> {
  const row = await db.query.userApiKeys.findFirst({ where: eq(userApiKeys.userId, userId) });
  return {
    geminiKey: decryptOrNull(row?.geminiKeyEnc ?? null),
    groqKey: decryptOrNull(row?.groqKeyEnc ?? null),
    pexelsKey: decryptOrNull(row?.pexelsKeyEnc ?? null),
    pixabayKey: decryptOrNull(row?.pixabayKeyEnc ?? null),
    telegramBotToken: decryptOrNull(row?.telegramBotTokenEnc ?? null),
    telegramChatId: decryptOrNull(row?.telegramChatIdEnc ?? null),
  };
}
