import { Suspense } from "react";
import Link from "next/link";
import { getFeed } from "@/lib/feed";
import { timeAgo } from "@/lib/format";
import { SOURCES } from "@/lib/sources";

const PAGE_SIZE = 60;
// flag emoji render as plain "US"/"CN" letters on Windows, so regions are written out
const REGION = { en: "미국", zh: "중국" } as const;
const sourceOf = new Map(SOURCES.map((s) => [s.id, s]));

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">US &amp; China Tech News</h1>
        <p className="mt-2 text-sm text-muted">
          미국·중국 기술 미디어의 기사를 한국어 제목과 짧은 코멘트로 모았습니다. 본문은 원문 링크에서 확인하세요.
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
    </div>
  );
}

async function Feed({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { source } = await searchParams;
  // only known ids reach the cache, so a made-up ?source= can't create cache entries
  const active = SOURCES.find((s) => s.id === source);
  // articles the AI step has not looked at yet stay visible; non-tech ones are filtered out in the query
  const articles = await getFeed(active?.id, PAGE_SIZE);

  return (
    <>
      <Nav activeId={active?.id} />
      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">표시할 기사가 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.map((a) => {
            const src = sourceOf.get(a.sourceId);
            const comment = a.commentManual ?? a.commentKo;
            const title = a.titleKo ?? a.titleOriginal;
            return (
              <li key={a.id} className="flex flex-col rounded-xl border border-line bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  <span>{src ? `${src.name} · ${REGION[src.lang]}` : a.sourceId}</span>
                  <span>·</span>
                  <time dateTime={a.publishedAt ?? a.firstSeenAt}>{timeAgo(a.publishedAt ?? a.firstSeenAt)}</time>
                  {a.paywalled && <span className="rounded bg-line px-1.5 py-0.5">유료 매체 · 제목만</span>}
                </div>
                <h2 className="text-xl font-bold leading-snug">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {title}
                  </a>
                </h2>
                {a.titleKo && <p className="mt-1 text-xs text-muted">{a.titleOriginal}</p>}
                {a.summaryKo && <p className="mt-3 text-[15px] leading-relaxed">{a.summaryKo}</p>}
                {comment && (
                  <p className="mt-3 border-l-2 border-accent pl-3 text-sm leading-relaxed text-muted">{comment}</p>
                )}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-block self-start pt-4 text-sm text-accent hover:underline"
                >
                  원문 보기 ↗
                </a>
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
    <nav className="mb-6 space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-8" />
        <Chip href="/" label="전체" on={!activeId} />
      </div>
      {(["en", "zh"] as const).map((lang) => (
        <div key={lang} className="flex flex-wrap items-center gap-2">
          <span className="w-8 text-xs text-muted">{REGION[lang]}</span>
          {SOURCES.filter((s) => s.lang === lang).map((s) => (
            <Chip key={s.id} href={`/?source=${s.id}`} label={s.name} on={activeId === s.id} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function Chip({ href, label, on }: { href: string; label: string; on: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 ${
        on ? "border-accent bg-accent text-background" : "border-line text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
