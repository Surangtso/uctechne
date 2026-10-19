import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { SOURCES } from "@/lib/sources";
import { listPublic } from "@/lib/store";

const PAGE_SIZE = 60;
const FLAG = { en: "🇺🇸", zh: "🇨🇳" } as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { source } = await searchParams;
  const active = SOURCES.find((s) => s.id === source);

  // articles the AI step has not looked at yet stay visible; non-tech ones are filtered out in the query
  const articles = await listPublic({ sourceId: active?.id, limit: PAGE_SIZE });
  const sourceOf = new Map(SOURCES.map((s) => [s.id, s]));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">글로벌 테크 다이제스트</h1>
        <p className="mt-2 text-sm text-muted">
          미국·중국 기술 미디어의 기사를 한국어 제목과 짧은 코멘트로 모았습니다. 본문은 원문 링크에서 확인하세요.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <Chip href="/" label="전체" on={!active} />
        {SOURCES.map((s) => (
          <Chip key={s.id} href={`/?source=${s.id}`} label={`${FLAG[s.lang]} ${s.name}`} on={active?.id === s.id} />
        ))}
      </nav>

      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          표시할 기사가 없습니다. <code>npm run collect</code>로 기사를 수집하세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => {
            const src = sourceOf.get(a.sourceId);
            const comment = a.commentManual ?? a.commentKo;
            const title = a.titleKo ?? a.titleOriginal;
            return (
              <li key={a.id} className="rounded-xl border border-line bg-card p-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
                  <span>{src ? `${FLAG[src.lang]} ${src.name}` : a.sourceId}</span>
                  <span>·</span>
                  <time dateTime={a.publishedAt ?? a.firstSeenAt}>{timeAgo(a.publishedAt ?? a.firstSeenAt)}</time>
                  {a.paywalled && <span className="rounded bg-line px-1.5 py-0.5">유료 매체 · 제목만</span>}
                </div>
                <h2 className="text-base font-medium leading-snug">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {title}
                  </a>
                </h2>
                {a.titleKo && <p className="mt-1 text-xs text-muted">{a.titleOriginal}</p>}
                {a.summaryKo && <p className="mt-2 text-sm leading-relaxed">{a.summaryKo}</p>}
                {comment && (
                  <p className="mt-2 border-l-2 border-accent pl-3 text-sm leading-relaxed text-muted">{comment}</p>
                )}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-accent hover:underline"
                >
                  원문 보기 ↗
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
