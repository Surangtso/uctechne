"use client";

import { useSyncExternalStore } from "react";
import { T, type Lang } from "@/lib/i18n";

// Saved articles live in this browser only (localStorage): a list of article ids, newest first
const KEY = "uctechne:scraps";
const MAX = 200;

let cache: { raw: string | null; ids: string[] } = { raw: null, ids: [] };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null; // storage can be blocked (private window, site data off)
  }
}

// the same array object is returned until the stored text changes, as useSyncExternalStore requires
function snapshot(): string[] {
  const raw = readRaw();
  if (raw !== cache.raw) {
    let ids: string[] = [];
    try {
      const v = JSON.parse(raw ?? "[]");
      if (Array.isArray(v)) ids = v.filter((x): x is string => typeof x === "string");
    } catch {}
    cache = { raw, ids };
  }
  return cache.ids;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // another tab saved something
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// null on the server and during hydration, when the saved ids are not known yet
export const useScraps = (): string[] | null => useSyncExternalStore(subscribe, snapshot, () => null);

export function toggleScrap(id: string) {
  const ids = snapshot();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  listeners.forEach((cb) => cb());
}

export function ScrapButton({ id, lang }: { id: string; lang: Lang }) {
  const t = T[lang];
  const ids = useScraps();
  const saved = !!ids?.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggleScrap(id)}
      aria-pressed={saved}
      className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 hover:text-accent ${saved ? "text-accent" : ""}`}
    >
      <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <path d="M1.5 1.5h9v11l-4.5-3.2-4.5 3.2z" strokeLinejoin="round" />
      </svg>
      {saved ? t.saved : t.save}
    </button>
  );
}
