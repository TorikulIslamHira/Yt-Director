import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, isNull, or } from "drizzle-orm";
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

  const agentId = req.nextUrl.searchParams.get("agentId") || "";
  // Only jobs unassigned or pinned to this agent — an unrecognized/missing
  // agentId still only ever sees unassigned jobs, never someone else's pin.
  const assignmentFilter = agentId
    ? or(isNull(projects.assignedAgentId), eq(projects.assignedAgentId, agentId))
    : isNull(projects.assignedAgentId);

  const candidate = await db.query.projects.findFirst({
    where: and(eq(projects.renderStatus, "pending"), assignmentFilter),
    orderBy: asc(projects.updatedAt),
  });
  if (!candidate) {
    return NextResponse.json({ job: null });
  }

  const now = Date.now();
  const claimed = await db
    .update(projects)
    .set({ renderStatus: "claimed", renderClaimedAt: now, updatedAt: now })
    .where(and(eq(projects.id, candidate.id), eq(projects.renderStatus, "pending"), assignmentFilter))
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
      scenes: scenes
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((s) => ({
          id: s.id,
          index: s.index,
          // The exact script sentence for this scene (guaranteed by the
          // Gemini segmentation prompt, see lib/integrations/gemini.ts) —
          // the agent sequentially matches this against the whisper
          // transcript to derive this scene's real {startSec, endSec}.
          text: s.description,
          estimatedDurationSeconds: s.estimatedDurationSeconds,
          // Null for ai-prompt scenes with no stock match — the agent
          // renders a placeholder card for those instead of failing the job.
          clipUrl: resolveClipUrl(s),
        })),
      bgm,
      voiceoverUrl: `/api/render-agent/audio/${row.id}`,
      resultUrl: `/api/render-agent/jobs/${row.id}/result`,
      failUrl: `/api/render-agent/jobs/${row.id}/fail`,
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
