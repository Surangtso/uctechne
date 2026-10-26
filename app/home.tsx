import { Suspense } from "react";
import Link from "next/link";
import { dealIntoColumns } from "@/lib/columns";
import { getFeed } from "@/lib/feed";
import { timeAgo } from "@/lib/format";
import { needsLogin, platformLabel } from "@/lib/platforms";
import { T, type Lang } from "@/lib/i18n";
import { SOURCES, regionOf } from "@/lib/sources";

const PAGE_SIZE = 60;
const sourceOf = new Map(SOURCES.map((s) => [s.id, s]));
// source_id of hand-curated posts (see lib/store.ts insertCurated)
const CURATED = "curated";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// both editions (/ in Korean, /en in English) render this page
export default function Home({ lang, searchParams }: { lang: Lang; searchParams: SearchParams }) {
  const t = T[lang];
  const base = lang === "en" ? "/en" : "/";
  return (
    <div lang={lang} className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">US &amp; China Tech Currents</h1>
          {/* the other edition; lang on the link so screen readers pronounce it in its own language */}
          <Link href={lang === "en" ? "/" : "/en"} lang={lang === "en" ? "ko" : "en"} className="shrink-0 rounded-full bg-card px-3 py-1 text-sm text-tagline hover:text-accent">
            {t.switchTo}
          </Link>
        </div>
        <p className="mt-2 text-sm text-tagline">{t.tagline}</p>
      </header>

      {/* the filter lives in the query string, which is only known per request */}
      <Suspense
        fallback={
          <>
            <Nav lang={lang} base={base} />
            <p className="py-16 text-center text-sm text-muted">{t.loading}</p>
          </>
        }
      >
        <Feed lang={lang} base={base} searchParams={searchParams} />
      </Suspense>

      <footer className="mt-12 space-y-1 text-xs leading-relaxed text-muted">
        <p>{t.disclaimer}</p>
        <p>{t.copyright}</p>
        <p>
          {/* the address only shows in a black banner on hover or focus (tap on touch screens); it is split
              into parts so a plain-text scan of the page source does not find it as one address */}
          <span className="group relative inline-block cursor-default" tabIndex={0}>
            <span className="underline decoration-dotted underline-offset-2">{t.takedown}</span>
            <span
              role="tooltip"
              className="invisible absolute bottom-full left-0 z-30 pb-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            >
              <span className="block whitespace-nowrap rounded-md bg-black px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/20">
                <span>surangne</span>
                <span>@</span>
                <span>gmail.com</span>
              </span>
            </span>
          </span>
        </p>
      </footer>
    </div>
  );
}

async function Feed({ lang, base, searchParams }: { lang: Lang; base: string; searchParams: SearchParams }) {
  const t = T[lang];
  const en = lang === "en";
  const { source } = await searchParams;
  // only known ids reach the cache, so a made-up ?source= can't create cache entries
  const active = SOURCES.find((s) => s.id === source);
  const activeId = source === CURATED ? CURATED : active?.id;
  // only articles the AI step has classified as tech are listed (see listPublic)
  const articles = await getFeed(activeId, PAGE_SIZE, lang);
  const {
    columns: [left, right],
  } = dealIntoColumns(articles, lang);
  const firstOnRight = right[0]?.article.id;

  return (
    <>
      <Nav lang={lang} base={base} activeId={activeId} />
      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{t.empty}</p>
      ) : (
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
            const outlet = a.curated ? (a.sourceLabel ? platformLabel(a.sourceLabel, lang) : t.curated) : (src?.name ?? a.sourceId);
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
                  <time dateTime={a.publishedAt ?? a.firstSeenAt}>{timeAgo(a.publishedAt ?? a.firstSeenAt, Date.now(), lang)}</time>
                  {a.paywalled && (
                    <span className="rounded bg-line px-1.5 py-0.5">{src?.paywalled ? t.paywalled : t.headlineOnly}</span>
                  )}
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
      )}
    </>
  );
}

function Nav({ lang, base, activeId }: { lang: Lang; base: string; activeId?: string }) {
  const t = T[lang];
  const href = (id: string) => `${base}?source=${id}`;
  return (
    // one row: US outlets, CN outlets, 전체, and 큐레이션 pushed to the far right (rows wrap on narrow screens)
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {(["us", "cn"] as const).map((region) => (
        <div key={region} className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted">{region === "us" ? "US" : "CN"}</span>
          {SOURCES.filter((s) => regionOf(s) === region).map((s) => (
            <Chip key={s.id} href={href(s.id)} label={s.name} on={activeId === s.id} />
          ))}
        </div>
      ))}
      {/* a little extra room between the CN outlets and 전체 */}
      <div className="ml-2 flex">
        <Chip href={base} label={t.all} on={!activeId} />
      </div>
      {/* flex, so the link is a block like the other chips and gets the same height */}
      <div className="ml-auto flex">
        <Chip href={href(CURATED)} label={t.curated} on={activeId === CURATED} curated />
      </div>
    </nav>
  );
}

function Chip({ href, label, on, curated }: { href: string; label: string; on: boolean; curated?: boolean }) {
  // every chip is white until selected; a selected 큐레이션 chip turns teal with white text, the others navy
  const tone = on
    ? curated
      ? "bg-curated text-white"
      : "bg-accent text-background"
    : "bg-card text-tagline hover:text-accent";
  return (
    <Link href={href} className={`chip${/^[\x20-\x7e]+$/.test(label) ? " chip-latin" : ""} rounded-full px-3 py-1.5 ${tone}`}>
      {label}
    </Link>
  );
}
