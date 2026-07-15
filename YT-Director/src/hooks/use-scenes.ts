"use client";

import { useSyncExternalStore } from "react";
import type { BgmInfo, Scene } from "@/types/scene";
import { mockScenes } from "@/lib/mock-scenes";
import { SCENES_STORAGE_KEY, PROJECT_ID_KEY, loadBgm } from "@/lib/scene-storage";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return sessionStorage.getItem(SCENES_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useScenes(): { scenes: Scene[]; isDemo: boolean } {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!raw) {
    return { scenes: mockScenes, isDemo: true };
  }

  try {
    const parsed = JSON.parse(raw) as Scene[];
    if (parsed.length === 0) return { scenes: mockScenes, isDemo: true };
    return { scenes: parsed, isDemo: false };
  } catch {
    return { scenes: mockScenes, isDemo: true };
  }
}

function getBgmSnapshot() {
  return sessionStorage.getItem("yt-director:bgm");
}

export function useBgm(): BgmInfo | null {
  const raw = useSyncExternalStore(subscribe, getBgmSnapshot, getServerSnapshot);
  if (!raw) return null;
  return loadBgm();
}

function getProjectIdSnapshot() {
  return sessionStorage.getItem(PROJECT_ID_KEY);
}

export function useProjectId(): string | null {
  return useSyncExternalStore(subscribe, getProjectIdSnapshot, getServerSnapshot);
}
