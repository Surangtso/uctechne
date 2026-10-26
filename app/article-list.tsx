import { dealIntoColumns } from "@/lib/columns";
import { timeAgo } from "@/lib/format";
import { needsLogin, platformLabel } from "@/lib/platforms";
import { T, type Lang } from "@/lib/i18n";
import { SOURCES, nameOf, regionOf } from "@/lib/sources";
import type { Article } from "@/lib/types";
import { ScrapButton } from "./scrap";

const sourceOf = new Map(SOURCES.map((s) => [s.id, s]));

// The cards, shared by the feed (server) and the saved list (client)
export function ArticleList({ articles, lang }: { articles: Article[]; lang: Lang }) {
  const t = T[lang];
  const en = lang === "en";
  const {
    columns: [left, right],
  } = dealIntoColumns(articles, lang);
  const firstOnRight = right[0]?.article.id;
  return (
      // One column on a phone (flex, restored to newest-first with `order`). From md up, two newspaper-style
      // columns (CSS columns): cards keep their own height, so a short card leaves no blank space. The DOM holds
      // the left column then the right one, and the first card of the right one forces the column break.
      <ul className="flex flex-col gap-4 md:block md:columns-2 md:gap-4">
        {[...left, ...right].map(({ article: a, order }) => {
          const src = sourceOf.get(a.sourceId);
          const comment = en ? (a.commentManualEn ?? a.commentEn) : (a.commentManual ?? a.commentKo);
          const title = (en ? a.titleEn : a.titleKo) ?? a.titleOriginal;
          const summary = en ? a.summaryEn : a.summaryKo;
          const quote = en ? a.quoteEn : a.quote;
          const author = en ? a.authorEn : a.author;
          // outlet name (darker) and what follows it (region or author, kept gray)
          const outlet = a.curated ? (a.sourceLabel ? platformLabel(a.sourceLabel, lang) : t.curated) : (src ? nameOf(src, lang) : a.sourceId);
          const outletNote = a.curated ? author : src ? t[regionOf(src)] : undefined;
          return (
            <li
              key={a.id}
              style={{ order }}
              className={`news-card rounded-xl bg-card p-5 md:mb-4 md:break-inside-avoid ${
                a.id === firstOnRight ? "md:[break-before:column]" : ""
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                {a.curated && <span className="rounded bg-accent px-1.5 py-0.5 text-background">{t.curated}</span>}
                <span>
                  <span className="text-tagline">{outlet}</span>
                  {outletNote ? ` · ${outletNote}` : ""}
                </span>
                <span>·</span>
                <time dateTime={a.publishedAt ?? a.firstSeenAt}>{timeAgo(a.publishedAt ?? a.firstSeenAt, undefined, lang)}</time>
                {a.paywalled && (
                  <span className="rounded bg-line px-1.5 py-0.5">{src?.paywalled ? t.paywalled : t.headlineOnly}</span>
                )}
                <ScrapButton id={a.id} lang={lang} />
              </div>
              <h2 className="text-xl font-bold leading-snug">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  {title}
                </a>
              </h2>
              {/* the English edition shows one headline only */}
              {!en && a.titleKo && a.titleOriginal && (
                <p className="mt-1 text-[11px] leading-snug text-muted">{a.titleOriginal}</p>
              )}
              {comment && (
                <p className="mt-3 border-l-2 border-accent pl-3 text-[15px] leading-relaxed text-foreground">
                  {comment}
                </p>
              )}
              {/* hidden until the card is hovered or focused; always visible on touch screens (see globals.css) */}
              <div className="news-more">
                <div className="news-more-inner">
                  {summary && <p className="text-[15px] leading-relaxed text-muted">{summary}</p>}
                  {quote && <p className="mt-3 text-sm italic leading-relaxed text-muted">“{quote}”</p>}
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-2">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      {t.readOriginal}
                    </a>
                    {a.curated && needsLogin(a.sourceLabel) && (
                      <span className="text-xs text-muted">{t.loginNote}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
  );
}
