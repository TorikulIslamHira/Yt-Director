import type { Scene } from "@/types/scene";

// Flags scenes whose primary (index-0) stock clip is reused by another scene
// — the same footage appearing twice in one video is a real editing problem,
// unlike "similar" clips which is too fuzzy to detect reliably without a
// perceptual-hash pipeline this app doesn't have.
export function findDuplicateClipSceneIds(scenes: Scene[]): Set<string> {
  const byClip = new Map<string, string[]>();

  for (const scene of scenes) {
    const clip = scene.stockMatches[0];
    if (!clip) continue;
    const key = clip.downloadUrl;
    const ids = byClip.get(key) ?? [];
    ids.push(scene.id);
    byClip.set(key, ids);
  }

  const duplicates = new Set<string>();
  for (const ids of byClip.values()) {
    if (ids.length > 1) ids.forEach((id) => duplicates.add(id));
  }
  return duplicates;
}
