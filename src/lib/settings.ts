import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import type { AppSettings } from "@/types/scene";

const GLOBAL_ID = "global";

export async function getSettings(): Promise<AppSettings> {
  const row = await db.query.settings.findFirst({ where: eq(settings.id, GLOBAL_ID) });
  return {
    readingSpeedBn: row?.readingSpeedBn ?? 120,
    readingSpeedEn: row?.readingSpeedEn ?? 150,
  };
}

export async function updateSettings(update: AppSettings): Promise<AppSettings> {
  await db
    .update(settings)
    .set({ readingSpeedBn: update.readingSpeedBn, readingSpeedEn: update.readingSpeedEn })
    .where(eq(settings.id, GLOBAL_ID));
  return update;
}
