import type {
  BgmInfo,
  GenerationStatus,
  PostedLink,
  PostedPlatform,
  Project,
  ProjectStatus,
  Scene,
} from "@/types/scene";
import type { ProjectRow } from "@/db/schema";

const VALID_STATUSES: ProjectStatus[] = ["draft", "editing", "completed"];
const VALID_PLATFORMS: PostedPlatform[] = ["youtube", "facebook", "other"];
const VALID_GENERATION_STATUSES: GenerationStatus[] = ["idle", "generating", "done", "error"];

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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function titleFromScript(text: string): string {
  const oneLine = text.trim().replace(/\s+/g, " ");
  return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine || "শিরোনামহীন স্ক্রিপ্ট";
}
