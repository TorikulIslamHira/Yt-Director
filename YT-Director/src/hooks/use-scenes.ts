"use client";

import { useSyncExternalStore } from "react";
import type { Scene } from "@/types/scene";
import { mockScenes } from "@/lib/mock-scenes";
import { SCENES_STORAGE_KEY } from "@/lib/scene-storage";

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
