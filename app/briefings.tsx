import { getBriefings } from "@/lib/feed";
import { T, type Lang } from "@/lib/i18n";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-19" -> its Monday-to-Sunday range, written for the edition
function weekRange(weekStart: string, lang: Lang): string {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * 24 * 3600 * 1000);
  const day = (d: Date) => (lang === "en" ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` : `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`);
  return lang === "en" ? `${day(start)} – ${day(end)}, ${end.getUTCFullYear()}` : `${start.getUTCFullYear()}년 ${day(start)} – ${day(end)}`;
}

export async function Briefings({ lang }: { lang: Lang }) {
  const t = T[lang];
  const list = await getBriefings(lang);
  if (list.length === 0) return <p className="py-16 text-center text-sm text-muted">{t.briefingEmpty}</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <p className="text-sm text-muted">{t.briefingNote}</p>
      {list.map((b) => (
        <article key={b.weekStart} className="rounded-2xl bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">{weekRange(b.weekStart, lang)}</h2>
          <p className="mt-0.5 text-xs text-muted">{t.briefingCount.replace("{n}", String(b.articleCount))}</p>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-tagline">
            {b.body.split(/\n\s*\n/).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
