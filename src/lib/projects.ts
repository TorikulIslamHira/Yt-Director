import type { BgmInfo, Project, Scene } from "@/types/scene";
import type { ProjectRow } from "@/db/schema";

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

  return {
    id: row.id,
    title: row.title,
    scriptText: row.scriptText,
    scenes,
    bgm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function titleFromScript(text: string): string {
  const oneLine = text.trim().replace(/\s+/g, " ");
  return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine || "শিরোনামহীন স্ক্রিপ্ট";
}
