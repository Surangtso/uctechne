"use client";

import { useEffect } from "react";
import { T, type Lang } from "@/lib/i18n";
import { authClient } from "@/lib/supabase-browser";
import { startAuth, useSession } from "./auth-store";
import { startScrapSync } from "./scrap";

export function AuthButton({ lang }: { lang: Lang }) {
  const t = T[lang];
  const session = useSession();
  useEffect(() => {
    startAuth();
    startScrapSync();
  }, []);

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
