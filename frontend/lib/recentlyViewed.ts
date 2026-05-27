"use client";
/**
 * Small localStorage helper to track recently viewed products.
 * We store just the slugs; the page fetches fresh data so prices/stock are live.
 */

const KEY = "tredific-recent-views";
const MAX = 12;

export function pushRecentlyViewed(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable — ignore */
  }
}

export function getRecentlyViewed(exclude?: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return exclude ? list.filter((s) => s !== exclude) : list;
  } catch {
    return [];
  }
}
