"use client";

import { useEffect, useState } from "react";
import { T, type Lang } from "@/lib/i18n";
import type { Article } from "@/lib/types";
import { ArticleList } from "./article-list";
import { loadSaved } from "./saved-actions";
import { useScraps } from "./scrap";

export function SavedList({ lang }: { lang: Lang }) {
  const t = T[lang];
  const ids = useScraps();
  const [loaded, setLoaded] = useState<Map<string, Article> | null>(null);

  const missing = ids?.some((id) => !loaded?.has(id)) ?? false;
  useEffect(() => {
    if (!ids || !missing) return;
    let stale = false;
    loadSaved(ids).then((list) => {
      if (!stale) setLoaded(new Map(list.map((a) => [a.id, a])));
    });
    return () => {
      stale = true;
    };
  }, [ids, missing]);

  if (!ids || (missing && !loaded)) return <p className="py-16 text-center text-sm text-muted">{t.loading}</p>;
  // newest saved first; an id whose article no longer exists is simply left out
  const articles = ids.map((id) => loaded?.get(id)).filter((a): a is Article => !!a);
  return (
    <>
      <p className="mb-4 text-sm text-muted">{t.savedNote}</p>
      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{t.savedEmpty}</p>
      ) : (
        <ArticleList articles={articles} lang={lang} />
      )}
    </>
  );
}
