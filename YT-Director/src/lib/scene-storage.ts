import type { BgmInfo, Scene } from "@/types/scene";

const SCRIPT_TEXT_KEY = "yt-director:script-text";
export const SCENES_STORAGE_KEY = "yt-director:scenes";
const SCENES_KEY = SCENES_STORAGE_KEY;
export const PROJECT_ID_KEY = "yt-director:project-id";
const BGM_KEY = "yt-director:bgm";

export function saveScriptText(text: string) {
  sessionStorage.setItem(SCRIPT_TEXT_KEY, text);
}

export function loadScriptText(): string | null {
  return sessionStorage.getItem(SCRIPT_TEXT_KEY);
}

export function saveScenes(scenes: Scene[]) {
  sessionStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
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
