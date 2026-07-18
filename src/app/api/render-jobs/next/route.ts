import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { isAuthorizedAgent } from "@/lib/auth/agent";
import type { BgmInfo, Scene } from "@/types/scene";

// Polled by the render agent (runs on the editor's own PC — see
// docs/CONTRACT.md). Pull-based rather than push because this server has
// no public IP the agent could be pushed to.
export async function GET(req: NextRequest) {
  if (!isAuthorizedAgent(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const candidate = await db.query.projects.findFirst({
    where: eq(projects.renderStatus, "pending"),
    orderBy: asc(projects.updatedAt),
  });
  if (!candidate) {
    return NextResponse.json({ job: null });
  }

  const now = Date.now();
  const claimed = await db
    .update(projects)
    .set({ renderStatus: "claimed", renderClaimedAt: now, updatedAt: now })
    .where(and(eq(projects.id, candidate.id), eq(projects.renderStatus, "pending")))
    .returning();

  // Someone else (or a second poll) claimed it between the read and the
  // write above — tell the agent to just poll again rather than erroring.
  const row = claimed[0];
  if (!row) {
    return NextResponse.json({ job: null });
  }

  let scenes: Scene[] = [];
  try {
    scenes = JSON.parse(row.scenes) as Scene[];
  } catch {
    scenes = [];
  }

  let bgm: BgmInfo | null = null;
  if (row.bgm) {
    try {
      bgm = JSON.parse(row.bgm) as BgmInfo;
    } catch {
      bgm = null;
    }
  }

  const unresolvedScene = scenes.find((s) => resolveClipUrl(s) === null);
  if (unresolvedScene) {
    await db
      .update(projects)
      .set({
        renderStatus: "failed",
        renderError: `দৃশ্য "${unresolvedScene.title}"-এর জন্য কোনো স্টক ক্লিপ বা AI ভিডিও যুক্ত করা নেই — render agent এই স্কিপ ধাপগুলো অটোমেট করে না।`,
        updatedAt: Date.now(),
      })
      .where(eq(projects.id, row.id));

    return NextResponse.json({ job: null });
  }

  const voiceoverExists = row.voiceoverPath
    ? await fs
        .access(row.voiceoverPath)
        .then(() => true)
        .catch(() => false)
    : false;
  if (!voiceoverExists) {
    await db
      .update(projects)
      .set({
        renderStatus: "failed",
        renderError: "ভয়েসওভার ফাইল সার্ভারে পাওয়া যায়নি।",
        updatedAt: Date.now(),
      })
      .where(eq(projects.id, row.id));

    return NextResponse.json({ job: null });
  }

  return NextResponse.json({
    job: {
      projectId: row.id,
      title: row.title,
      scenes: scenes.map((s) => ({
        id: s.id,
        index: s.index,
        estimatedDurationSeconds: s.estimatedDurationSeconds,
        clipUrl: resolveClipUrl(s),
      })),
      bgm,
      voiceoverUrl: `/api/render-jobs/${row.id}/voiceover`,
      completeUrl: `/api/render-jobs/${row.id}/complete`,
    },
  });
}

function resolveClipUrl(scene: Scene): string | null {
  if (scene.stockMatches.length === 0) return null;
  const selected = scene.selectedMatchId
    ? scene.stockMatches.find((m) => m.id === scene.selectedMatchId)
    : undefined;
  return (selected ?? scene.stockMatches[0]).downloadUrl;
}
