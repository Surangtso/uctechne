"use client";

import { useEffect, useSyncExternalStore } from "react";
import { T, type Lang } from "@/lib/i18n";
import { authClient, type Session } from "@/lib/supabase-browser";

// undefined = not known yet (first paint), null = signed out
let current: Session | null | undefined;
const listeners = new Set<() => void>();
let started = false;

function start() {
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

export function AuthButton({ lang }: { lang: Lang }) {
  const t = T[lang];
  const session = useSyncExternalStore(subscribe, () => current, () => undefined);
  useEffect(start, []);

  const auth = authClient()?.auth;
  if (!auth || session === undefined) return null;

  const cls = "shrink-0 rounded-full bg-card px-3 py-1 text-sm text-tagline hover:text-accent";
  if (session) {
    const name = (session.user.user_metadata?.name as string | undefined) ?? session.user.email ?? "";
    return (
      <button type="button" onClick={() => auth.signOut()} title={name} className={cls}>
        {t.signOut}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}${location.pathname}` } })}
      className={cls}
    >
      {t.signIn}
    </button>
  );
}
