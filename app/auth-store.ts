"use client";

import { useSyncExternalStore } from "react";
import { authClient, type Session } from "@/lib/supabase-browser";

// undefined = not known yet (first paint), null = signed out
let current: Session | null | undefined;
const listeners = new Set<() => void>();
let started = false;

export function startAuth() {
  const auth = authClient()?.auth;
  if (!auth || started) return;
  started = true;
  const set = (s: Session | null) => {
    current = s;
    listeners.forEach((cb) => cb());
  };
  // a session handed back by Google is picked up from the URL here, then the listener keeps it current
  auth.getSession().then(({ data }) => set(data.session));
  auth.onAuthStateChange((_event, s) => set(s));
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useSession = (): Session | null | undefined => useSyncExternalStore(subscribe, () => current, () => undefined);
