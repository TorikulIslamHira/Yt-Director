import type { BgmInfo, Scene } from "@/types/scene";
import { fetchJson } from "@/lib/client/fetch-json";

const SCRIPT_TEXT_KEY = "yt-director:script-text";
export const SCENES_STORAGE_KEY = "yt-director:scenes";
const SCENES_KEY = SCENES_STORAGE_KEY;
export const PROJECT_ID_KEY = "yt-director:project-id";
const BGM_KEY = "yt-director:bgm";

type Listener = () => void;
const sceneListeners = new Set<Listener>();

export function subscribeScenes(listener: Listener): () => void {
  sceneListeners.add(listener);
  return () => sceneListeners.delete(listener);
}

function notifySceneListeners() {
  sceneListeners.forEach((listener) => listener());
}

export function saveScriptText(text: string) {
  sessionStorage.setItem(SCRIPT_TEXT_KEY, text);
}

export function loadScriptText(): string | null {
  return sessionStorage.getItem(SCRIPT_TEXT_KEY);
}

export function saveScenes(scenes: Scene[]) {
  sessionStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
  notifySceneListeners();
}

// Applies `updater` to the current real (non-demo) scenes, reindexes them,
// persists to sessionStorage, and best-effort syncs to the DB when a
// project is active. Returns null when there's nothing real to mutate
// (e.g. the screen is showing demo data).
export async function mutateScenes(updater: (scenes: Scene[]) => Scene[]): Promise<Scene[] | null> {
  const current = loadScenes();
  if (!current) return null;

  const updated = updater(current).map((scene, i) => ({ ...scene, index: i + 1 }));
  saveScenes(updated);

  const projectId = loadProjectId();
  if (projectId) {
    fetchJson(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: updated }),
    }).catch(() => {
      // persistence is best-effort — the in-tab flow still works without it
    });
  }

  return updated;
}

export function loadScenes(): Scene[] | null {
  const raw = sessionStorage.getItem(SCENES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Scene[];
  } catch {
    return null;
  }
}

export function saveProjectId(id: string) {
  sessionStorage.setItem(PROJECT_ID_KEY, id);
}

export function loadProjectId(): string | null {
  return sessionStorage.getItem(PROJECT_ID_KEY);
}

export function saveBgm(bgm: BgmInfo) {
  sessionStorage.setItem(BGM_KEY, JSON.stringify(bgm));
}

export function loadBgm(): BgmInfo | null {
  const raw = sessionStorage.getItem(BGM_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BgmInfo;
  } catch {
    return null;
  }
}

export function clearProject() {
  sessionStorage.removeItem(SCRIPT_TEXT_KEY);
  sessionStorage.removeItem(SCENES_KEY);
  sessionStorage.removeItem(PROJECT_ID_KEY);
  sessionStorage.removeItem(BGM_KEY);
}
