import { Suspense } from "react";
import Link from "next/link";
import { getFeed } from "@/lib/feed";
import { listPublic, searchWords } from "@/lib/store";
import { T, type Lang } from "@/lib/i18n";
import { AuthButton } from "./auth-button";
import { ContactEmail } from "./contact-email";
import { ArticleList } from "./article-list";
import { SavedList } from "./saved-list";
import { Briefings } from "./briefings";
import { SOURCES, nameOf, regionOf } from "@/lib/sources";

const PAGE_SIZE = 60;
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
          <div className="flex shrink-0 items-center gap-2">
            <AuthButton lang={lang} />
            {/* the other edition; lang on the link so screen readers pronounce it in its own language */}
            <Link href={lang === "en" ? "/" : "/en"} lang={lang === "en" ? "ko" : "en"} className="shrink-0 rounded-full bg-card px-3 py-1 text-sm text-tagline hover:text-accent">
              {t.switchTo}
            </Link>
          </div>
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
          <ContactEmail label={t.takedown} />
          <span aria-hidden className="mx-2">
            ·
          </span>
          <Link href={lang === "en" ? "/en/privacy" : "/privacy"} className="underline decoration-dotted underline-offset-2 hover:text-accent">
            {t.privacy}
          </Link>
          <span aria-hidden className="mx-2">
            ·
          </span>
          <Link href={lang === "en" ? "/en/terms" : "/terms"} className="underline decoration-dotted underline-offset-2 hover:text-accent">
            {t.terms}
          </Link>
        </p>
      </footer>
    </div>
  );
}

async function Feed({ lang, base, searchParams }: { lang: Lang; base: string; searchParams: SearchParams }) {
  const t = T[lang];
  const { source, q: rawQ, view } = await searchParams;
  const query = (typeof rawQ === "string" ? rawQ : "").trim().slice(0, 100);
  const searching = searchWords(query).length > 0;
  if (view === "briefing") {
    return (
      <>
        <Nav lang={lang} base={base} briefing />
        <Briefings lang={lang} />
      </>
    );
  }
  if (view === "saved") {
    return (
      <>
        <Nav lang={lang} base={base} saved />
        <SavedList lang={lang} />
      </>
    );
  }
  // only known ids reach the cache, so a made-up ?source= can't create cache entries
  const active = SOURCES.find((s) => s.id === source);
  const activeId = source === CURATED ? CURATED : active?.id;
  // only articles the AI step has classified as tech are listed (see listPublic)
  // searches are not cached: there is no limit to the words people can type
  const articles = searching
    ? await listPublic({ sourceId: activeId, limit: PAGE_SIZE, lang, query })
    : await getFeed(activeId, PAGE_SIZE, lang);
  return (
    <>
      <Nav lang={lang} base={base} activeId={activeId} query={searching ? query : undefined} />
      {searching && (
        <p className="mb-4 text-sm text-tagline">
          {t.resultsFor} “{query}” · {articles.length}
          <Link href={base} className="ml-3 text-accent hover:underline">
            {t.clearSearch}
          </Link>
        </p>
      )}
      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{t.empty}</p>
      ) : (
        <ArticleList articles={articles} lang={lang} />
      )}
    </>
  );
}

function Nav({ lang, base, activeId, query, saved, briefing }: { lang: Lang; base: string; activeId?: string; query?: string; saved?: boolean; briefing?: boolean }) {
  const t = T[lang];
  const href = (id: string) => `${base}?source=${id}`;
  return (
    <>
    <form action={base} role="search" className="mb-4 flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={query}
        maxLength={100}
        placeholder={t.searchPlaceholder}
        aria-label={t.search}
        className="min-w-0 flex-1 rounded-full bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted"
      />
      <button type="submit" className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm text-background">
        {t.search}
      </button>
    </form>
    {/* one row: US outlets, CN outlets, 전체, and 큐레이션 pushed to the far right (rows wrap on narrow screens) */}
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {(["us", "cn"] as const).map((region) => (
        <div key={region} className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted">{region === "us" ? "US" : "CN"}</span>
          {SOURCES.filter((s) => regionOf(s) === region).map((s) => (
            <Chip key={s.id} href={href(s.id)} label={nameOf(s, lang)} on={activeId === s.id} />
          ))}
        </div>
      ))}
      {/* a little extra room between the CN outlets and 전체 */}
      <div className="ml-2 flex">
        <Chip href={base} label={t.all} on={!activeId && !saved && !briefing} />
      </div>
      {/* flex, so the link is a block like the other chips and gets the same height */}
      <div className="ml-auto flex gap-2">
        <Chip href={`${base}?view=briefing`} label={t.briefingView} on={!!briefing} />
        <Chip href={`${base}?view=saved`} label={t.savedView} on={!!saved} />
        <Chip href={href(CURATED)} label={t.curated} on={activeId === CURATED} curated />
      </div>
    </nav>
    </>
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
