import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { generateScenesForScript } from "@/lib/generate-scenes";
import { sendTelegramMessage } from "@/lib/integrations/telegram";
import type { ProjectVersion, Scene } from "@/types/scene";

export const maxDuration = 60;

const STALE_JOB_MS = 3 * 60 * 1000;
const MAX_VERSIONS = 5;

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) {
    return NextResponse.json({ error: "প্রজেক্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  const isFreshlyGenerating =
    project.generationStatus === "generating" && Date.now() - project.updatedAt < STALE_JOB_MS;

  if (isFreshlyGenerating) {
    return NextResponse.json({ generationStatus: "generating" }, { status: 202 });
  }

  await db
    .update(projects)
    .set({ generationStatus: "generating", generationError: null, updatedAt: Date.now() })
    .where(eq(projects.id, id));

  // Fire-and-forget: the response returns immediately so the client isn't
  // holding a connection open for the whole Gemini + stock-search pipeline.
  // Progress is tracked entirely in the DB (shared across the PM2 cluster
  // instances), not in process memory, so any instance can serve the poll.
  (async () => {
    try {
      const scenes = await generateScenesForScript(project.scriptText);

      // Regenerating on the same script can produce a different scene
      // breakdown (Gemini isn't deterministic, stock availability shifts) —
      // snapshot whatever scenes existed before this run so it isn't
      // silently lost, capped to the most recent few.
      let oldScenes: Scene[] = [];
      try {
        oldScenes = JSON.parse(project.scenes) as Scene[];
      } catch {
        oldScenes = [];
      }
      let previousVersions: ProjectVersion[] = [];
      try {
        previousVersions = JSON.parse(project.previousVersions || "[]") as ProjectVersion[];
      } catch {
        previousVersions = [];
      }
      if (oldScenes.length > 0) {
        previousVersions = [{ scenes: oldScenes, savedAt: Date.now() }, ...previousVersions].slice(
          0,
          MAX_VERSIONS
        );
      }

      await db
        .update(projects)
        .set({
          scenes: JSON.stringify(scenes),
          generationStatus: "done",
          generationError: null,
          previousVersions: JSON.stringify(previousVersions),
          updatedAt: Date.now(),
        })
        .where(eq(projects.id, id));

      sendTelegramMessage(`✅ "${project.title}" — ${scenes.length}টা দৃশ্য তৈরি হয়েছে, রিভিউর জন্য প্রস্তুত।`);
    } catch (err) {
      await db
        .update(projects)
        .set({
          generationStatus: "error",
          generationError: (err as Error).message,
          updatedAt: Date.now(),
        })
        .where(eq(projects.id, id));

      sendTelegramMessage(`❌ "${project.title}" — প্রসেসিং ব্যর্থ হয়েছে: ${(err as Error).message}`);
    }
  })();

  return NextResponse.json({ generationStatus: "generating" }, { status: 202 });
}
