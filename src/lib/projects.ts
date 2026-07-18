import type {
  BgmInfo,
  GenerationStatus,
  PostedLink,
  PostedPlatform,
  Project,
  ProjectStatus,
  ProjectVersion,
  RenderStatus,
  Scene,
} from "@/types/scene";
import type { ProjectRow } from "@/db/schema";

const VALID_STATUSES: ProjectStatus[] = ["draft", "editing", "completed"];
const VALID_PLATFORMS: PostedPlatform[] = ["youtube", "facebook", "other"];
const VALID_GENERATION_STATUSES: GenerationStatus[] = ["idle", "generating", "done", "error"];
const VALID_RENDER_STATUSES: RenderStatus[] = ["none", "pending", "claimed", "done", "failed"];

export function postedLinksFromRow(row: {
  postedLinks: string;
  postedUrl: string | null;
  postedPlatform: string | null;
  completedAt: number | null;
  updatedAt: number;
}): PostedLink[] {
  let postedLinks: PostedLink[] = [];
  try {
    postedLinks = JSON.parse(row.postedLinks || "[]") as PostedLink[];
  } catch {
    postedLinks = [];
  }
  // Back-compat: rows written before multi-link support (2026-07-16) only
  // have the old single-link columns — synthesize a one-item array from them.
  if (postedLinks.length === 0 && row.postedUrl) {
    const legacyPlatform: PostedPlatform = VALID_PLATFORMS.includes(
      row.postedPlatform as PostedPlatform
    )
      ? (row.postedPlatform as PostedPlatform)
      : "other";
    postedLinks = [
      { platform: legacyPlatform, url: row.postedUrl, addedAt: row.completedAt ?? row.updatedAt },
    ];
  }
  return postedLinks;
}

export function rowToProject(row: ProjectRow): Project {
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

  const status: ProjectStatus = VALID_STATUSES.includes(row.status as ProjectStatus)
    ? (row.status as ProjectStatus)
    : "draft";

  const generationStatus: GenerationStatus = VALID_GENERATION_STATUSES.includes(
    row.generationStatus as GenerationStatus
  )
    ? (row.generationStatus as GenerationStatus)
    : "idle";

  let previousVersions: ProjectVersion[] = [];
  try {
    previousVersions = JSON.parse(row.previousVersions || "[]") as ProjectVersion[];
  } catch {
    previousVersions = [];
  }

  const renderStatus: RenderStatus = VALID_RENDER_STATUSES.includes(row.renderStatus as RenderStatus)
    ? (row.renderStatus as RenderStatus)
    : "none";

  return {
    id: row.id,
    title: row.title,
    scriptText: row.scriptText,
    scenes,
    bgm,
    status,
    postedLinks: postedLinksFromRow(row),
    completedAt: row.completedAt ?? null,
    generationStatus,
    generationError: row.generationError ?? null,
    previousVersions,
    hasVoiceover: Boolean(row.voiceoverPath),
    renderStatus,
    renderError: row.renderError ?? null,
    hasFinalVideo: Boolean(row.finalVideoPath),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function titleFromScript(text: string): string {
  const oneLine = text.trim().replace(/\s+/g, " ");
  return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine || "শিরোনামহীন স্ক্রিপ্ট";
}

export type ShareView = {
  title: string;
  scenes: Scene[];
  bgm: BgmInfo | null;
  createdAt: number;
};

// Narrow, explicit view for the public (unauthenticated) share route —
// deliberately excludes scriptText and everything else on Project so the
// exclusion lives in one place rather than being trusted per-route.
export function toShareView(project: Project): ShareView {
  return {
    title: project.title,
    scenes: project.scenes,
    bgm: project.bgm,
    createdAt: project.createdAt,
  };
}
