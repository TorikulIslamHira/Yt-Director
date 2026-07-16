import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import type { AppSettings } from "@/types/scene";

export async function getSettings(userId: string): Promise<AppSettings> {
  const row = await db.query.settings.findFirst({ where: eq(settings.id, userId) });
  return {
    readingSpeedBn: row?.readingSpeedBn ?? 120,
    readingSpeedEn: row?.readingSpeedEn ?? 150,
  };
}

export async function updateSettings(userId: string, update: AppSettings): Promise<AppSettings> {
  await db
    .insert(settings)
    .values({ id: userId, readingSpeedBn: update.readingSpeedBn, readingSpeedEn: update.readingSpeedEn })
    .onConflictDoUpdate({
      target: settings.id,
      set: { readingSpeedBn: update.readingSpeedBn, readingSpeedEn: update.readingSpeedEn },
    });
  return update;
}
