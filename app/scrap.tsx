"use client";

import { useSyncExternalStore } from "react";
import { T, type Lang } from "@/lib/i18n";
import { authClient } from "@/lib/supabase-browser";

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

function writeLocal(ids: string[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    return false;
  }
  listeners.forEach((cb) => cb());
  return true;
}

// Signed in: every change is also written to the user's rows in the scraps table (row level security keeps each
// list private), so the list follows them to other devices. Signed out: the browser copy is all there is.
let userId: string | null = null;
let syncedFor: string | null = null;
let syncStarted = false;

async function pull(id: string) {
  const db = authClient();
  if (!db) return;
  const { data, error } = await db.from("scraps").select("article_id").order("created_at", { ascending: false }).limit(MAX);
  if (error || !data) return;
  const remote = data.map((r) => r.article_id as string);
  // what was saved in this browser before signing in joins the account's list
  const onlyLocal = snapshot().filter((x) => !remote.includes(x));
  if (onlyLocal.length) await db.from("scraps").insert(onlyLocal.map((article_id) => ({ article_id })));
  writeLocal([...onlyLocal, ...remote].slice(0, MAX));
  syncedFor = id;
}

export function startScrapSync() {
  const db = authClient();
  if (!db || syncStarted) return;
  syncStarted = true;
  db.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      userId = null;
      syncedFor = null;
      writeLocal([]); // the list lives in the account now; do not leave it behind on a shared computer
      return;
    }
    userId = session?.user.id ?? null;
    // supabase-js must not be called from inside its own callback, so the pull is deferred
    if (userId && syncedFor !== userId) setTimeout(() => void pull(userId!), 0);
  });
}

export function toggleScrap(id: string) {
  const ids = snapshot();
  const adding = !ids.includes(id);
  const next = adding ? [id, ...ids].slice(0, MAX) : ids.filter((x) => x !== id);
  if (!writeLocal(next)) return;
  const db = userId ? authClient() : null;
  if (!db) return;
  // a failed write leaves the browser copy ahead of the account; the next sign-in merges the two
  void (adding ? db.from("scraps").insert({ article_id: id }) : db.from("scraps").delete().eq("article_id", id));
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
