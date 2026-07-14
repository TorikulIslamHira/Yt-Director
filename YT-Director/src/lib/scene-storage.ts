import type { Scene } from "@/types/scene";

const SCRIPT_TEXT_KEY = "yt-director:script-text";
export const SCENES_STORAGE_KEY = "yt-director:scenes";
const SCENES_KEY = SCENES_STORAGE_KEY;

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
