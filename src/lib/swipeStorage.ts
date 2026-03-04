"use client";
import { SwipeAd, Ad } from "./types";

const STORAGE_KEY = "advault_swipe";

export function getSwipeFile(): SwipeAd[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAd(ad: Ad): void {
  const current = getSwipeFile();
  if (current.some((a) => a.id === ad.id)) return;
  const updated: SwipeAd[] = [
    { ...ad, savedAt: new Date().toISOString() },
    ...current,
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeAd(id: string): void {
  const updated = getSwipeFile().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function isSaved(id: string): boolean {
  return getSwipeFile().some((a) => a.id === id);
}
