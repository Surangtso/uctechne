import { Suspense } from "react";
import Link from "next/link";
import { getFeed } from "@/lib/feed";
import { timeAgo } from "@/lib/format";
import { SOURCES } from "@/lib/sources";

const PAGE_SIZE = 60;
// flag emoji render as plain "US"/"CN" letters on Windows, so regions are written out
const REGION = { en: "미국", zh: "중국" } as const;
const sourceOf = new Map(SOURCES.map((s) => [s.id, s]));
// source_id of hand-curated posts (see lib/store.ts insertCurated)
const CURATED = "curated";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">US &amp; China Tech News</h1>
        <p className="mt-2 text-sm text-tagline">
          미국·중국 테크 미디어 기사를 한 곳에서 확인할 수 있습니다. 본문은 원문 링크에서 확인할 수 있습니다.
        </p>
      </header>

      {/* the filter lives in the query string, which is only known per request */}
      <Suspense
        fallback={
          <>
            <Nav />
            <p className="py-16 text-center text-sm text-muted">불러오는 중…</p>
          </>
        }
      >
        <Feed searchParams={searchParams} />
      </Suspense>

      <footer className="mt-12 space-y-1 text-xs leading-relaxed text-muted">
        <p>번역과 요약은 AI가 작성하며 오류가 있을 수 있습니다. 정확한 내용은 원문 링크에서 확인하세요.</p>
        <p>각 글의 저작권은 해당 매체와 작성자에게 있습니다.</p>
        <p>
          {/* the address only shows in a black banner on hover or focus (tap on touch screens); it is split
              into parts so a plain-text scan of the page source does not find it as one address */}
          <span className="group relative inline-block cursor-default" tabIndex={0}>
            <span className="underline decoration-dotted underline-offset-2">삭제·정정 요청</span>
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

async function Feed({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { source } = await searchParams;
  // only known ids reach the cache, so a made-up ?source= can't create cache entries
  const active = SOURCES.find((s) => s.id === source);
  const activeId = source === CURATED ? CURATED : active?.id;
  // only articles the AI step has classified as tech are listed (see listPublic)
  const articles = await getFeed(activeId, PAGE_SIZE);

  return (
    <>
      <Nav activeId={activeId} />
      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">표시할 기사가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.map((a) => {
            const src = sourceOf.get(a.sourceId);
            const comment = a.commentManual ?? a.commentKo;
            const title = a.titleKo ?? a.titleOriginal;
            // outlet name (darker) and what follows it (region or author, kept gray)
            const outlet = a.curated ? (a.sourceLabel ?? "큐레이션") : (src?.name ?? a.sourceId);
            const outletNote = a.curated ? a.author : src ? REGION[src.lang] : undefined;
            return (
              <li key={a.id} className="news-card rounded-xl bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  {a.curated && <span className="rounded bg-accent px-1.5 py-0.5 text-background">큐레이션</span>}
                  <span>
                    <span className="text-tagline">{outlet}</span>
                    {outletNote ? ` · ${outletNote}` : ""}
                  </span>
                  <span>·</span>
                  <time dateTime={a.publishedAt ?? a.firstSeenAt}>{timeAgo(a.publishedAt ?? a.firstSeenAt)}</time>
                  {a.paywalled && <span className="rounded bg-line px-1.5 py-0.5">유료 매체 · 제목만</span>}
                </div>
                <h2 className="text-xl font-bold leading-snug">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {title}
                  </a>
                </h2>
                {a.titleKo && a.titleOriginal && (
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
                    {a.summaryKo && <p className="text-[15px] leading-relaxed text-muted">{a.summaryKo}</p>}
                    {a.quote && <p className="mt-3 text-sm italic leading-relaxed text-muted">“{a.quote}”</p>}
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm text-accent hover:underline"
                    >
                      원문 보기 ↗
                    </a>
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

function Nav({ activeId }: { activeId?: string }) {
  return (
    // one row: US outlets, CN outlets, 전체, and 큐레이션 pushed to the far right (rows wrap on narrow screens)
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {(["en", "zh"] as const).map((lang) => (
        <div key={lang} className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted">{lang === "en" ? "US" : "CN"}</span>
          {SOURCES.filter((s) => s.lang === lang).map((s) => (
            <Chip key={s.id} href={`/?source=${s.id}`} label={s.name} on={activeId === s.id} />
          ))}
        </div>
      ))}
      {/* a little extra room between the CN outlets and 전체 */}
      <div className="ml-2 flex">
        <Chip href="/" label="전체" on={!activeId} />
      </div>
      {/* flex, so the link is a block like the other chips and gets the same height */}
      <div className="ml-auto flex">
        <Chip href={`/?source=${CURATED}`} label="큐레이션" on={activeId === CURATED} curated />
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
