import { createHash } from "node:crypto";
import { db } from "./supabase";
import type { Article, CollectedItem } from "./types";

type Row = {
  id: string;
  source_id: string;
  url: string;
  title_original: string;
  published_at: string | null;
  first_seen_at: string;
  sort_at: string;
  excerpt: string;
  paywalled: boolean;
  processed_at: string | null;
  summarized_at: string | null;
  is_tech: boolean | null;
  importance: number | null;
  title_ko: string | null;
  summary_ko: string | null;
  comment_ko: string | null;
  comment_manual: string | null;
  title_en?: string | null;
  summary_en?: string | null;
  comment_en?: string | null;
  en_at?: string | null;
  comment_manual_en?: string | null;
  quote_en?: string | null;
  author_en?: string | null;
  curated?: boolean;
  author?: string | null;
  source_label?: string | null;
  quote?: string | null;
};

const TABLE = "articles";
const PAGE = 1000; // PostgREST returns at most 1000 rows per request
const CHUNK = 500;
// everything the page needs; excerpt (the original's text) is deliberately left out
const PUBLIC_COLS =
  "id,source_id,url,title_original,published_at,first_seen_at,paywalled,is_tech,importance,title_ko,summary_ko,comment_ko,comment_manual,curated,author,source_label,quote,title_en,summary_en,comment_en,comment_manual_en,quote_en,author_en";

export function articleId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

const nul = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

function toRow(a: Article): Row {
  return {
    id: a.id,
    source_id: a.sourceId,
    url: a.url,
    title_original: a.titleOriginal,
    published_at: nul(a.publishedAt),
    first_seen_at: a.firstSeenAt,
    sort_at: a.publishedAt ?? a.firstSeenAt,
    excerpt: a.excerpt,
    paywalled: a.paywalled,
    processed_at: nul(a.processedAt),
    summarized_at: nul(a.summarizedAt),
    is_tech: nul(a.isTech),
    importance: nul(a.importance),
    title_ko: nul(a.titleKo),
    summary_ko: nul(a.summaryKo),
    comment_ko: nul(a.commentKo),
    comment_manual: nul(a.commentManual),
    // collected articles never send the curation columns, so collecting works before they exist in the database
    ...(a.curated
      ? { curated: true, author: nul(a.author), source_label: nul(a.sourceLabel), quote: nul(a.quote) }
      : {}),
  };
}

const opt = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

function fromRow(r: Partial<Row> & Pick<Row, "id" | "source_id" | "url" | "title_original" | "first_seen_at">): Article {
  return {
    id: r.id,
    sourceId: r.source_id,
    url: r.url,
    titleOriginal: r.title_original,
    publishedAt: opt(r.published_at),
    firstSeenAt: r.first_seen_at,
    excerpt: r.excerpt ?? "",
    paywalled: r.paywalled ?? false,
    processedAt: opt(r.processed_at),
    summarizedAt: opt(r.summarized_at),
    isTech: opt(r.is_tech),
    importance: opt(r.importance),
    titleKo: opt(r.title_ko),
    summaryKo: opt(r.summary_ko),
    commentKo: opt(r.comment_ko),
    commentManual: opt(r.comment_manual),
    titleEn: opt(r.title_en),
    summaryEn: opt(r.summary_en),
    commentEn: opt(r.comment_en),
    enAt: opt(r.en_at),
    commentManualEn: opt(r.comment_manual_en),
    quoteEn: opt(r.quote_en),
    authorEn: opt(r.author_en),
    curated: r.curated || undefined,
    author: opt(r.author),
    sourceLabel: opt(r.source_label),
    quote: opt(r.quote),
  };
}

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

// every url already stored, so html sources only fetch detail pages for new articles
export async function knownUrls(): Promise<Set<string>> {
  const urls = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const rows = check(
      await db().from(TABLE).select("url").order("id").range(from, from + PAGE - 1),
      "read urls",
    ) as { url: string }[];
    for (const r of rows) urls.add(r.url);
    if (rows.length < PAGE) return urls;
  }
}

// inserts items not seen before; existing rows (with their translations) are left untouched
export async function insertItems(items: CollectedItem[]): Promise<Article[]> {
  const now = new Date().toISOString();
  const byId = new Map<string, Article>();
  for (const item of items) {
    const id = articleId(item.url);
    if (!byId.has(id)) byId.set(id, { ...item, id, firstSeenAt: now });
  }
  const all = [...byId.values()];
  const added: Article[] = [];
  for (let i = 0; i < all.length; i += CHUNK) {
    const rows = all.slice(i, i + CHUNK).map(toRow);
    const inserted = check(
      await db().from(TABLE).upsert(rows, { onConflict: "id", ignoreDuplicates: true }).select("id"),
      "insert articles",
    ) as { id: string }[];
    const ids = new Set(inserted.map((r) => r.id));
    added.push(...all.slice(i, i + CHUNK).filter((a) => ids.has(a.id)));
  }
  return added;
}

export async function pendingTranslation(limit: number): Promise<Article[]> {
  const rows = check(
    await db()
      .from(TABLE)
      .select("*")
      .is("processed_at", null)
      .order("sort_at", { ascending: false })
      .limit(Math.min(limit, 5000)),
    "read pending translations",
  ) as Row[];
  return rows.map(fromRow);
}

// tech articles whose excerpt gives something to summarize
export async function pendingSummary(): Promise<Article[]> {
  const rows = check(
    await db()
      .from(TABLE)
      .select("*")
      .eq("is_tech", true)
      .not("title_ko", "is", null)
      .neq("excerpt", "")
      .is("summarized_at", null)
      .order("sort_at", { ascending: false })
      .limit(5000),
    "read pending summaries",
  ) as Row[];
  return rows.map(fromRow);
}

// writes only what the AI steps produce; comment_manual is never touched here
export async function saveEnrichment(a: Article): Promise<void> {
  const r = toRow(a);
  check(
    await db()
      .from(TABLE)
      .update({
        processed_at: r.processed_at,
        summarized_at: r.summarized_at,
        is_tech: r.is_tech,
        importance: r.importance,
        title_ko: r.title_ko,
        summary_ko: r.summary_ko,
        comment_ko: r.comment_ko,
      })
      .eq("id", a.id),
    `save ${a.id}`,
  );
}

// Rows that still need their English text: tech articles from the last `days` days (the English edition starts
// there) and every curated post. An article whose summary is still to come waits for it.
export async function pendingEnglish(days = 14): Promise<Article[]> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const rows = check(
    await db()
      .from(TABLE)
      .select("*")
      .eq("is_tech", true)
      .not("title_ko", "is", null)
      .is("en_at", null)
      .or(`curated.eq.true,sort_at.gte.${since}`)
      .order("sort_at", { ascending: false })
      .limit(5000),
    "read pending English",
  ) as Row[];
  return rows.map(fromRow).filter((a) => a.curated || a.summarizedAt || !a.excerpt);
}

export async function saveEnglish(a: Article): Promise<void> {
  check(
    await db()
      .from(TABLE)
      .update(
        a.curated
          ? { title_en: nul(a.titleEn), summary_en: nul(a.summaryEn), comment_manual_en: nul(a.commentManualEn), quote_en: nul(a.quoteEn), author_en: nul(a.authorEn), en_at: nul(a.enAt) }
          : { title_en: nul(a.titleEn), summary_en: nul(a.summaryEn), comment_en: nul(a.commentEn), en_at: nul(a.enAt) },
      )
      .eq("id", a.id),
    `save English ${a.id}`,
  );
}

// Recent rows from these sources whose excerpt is empty or shorter than `shortBelow`: their article page is worth
// another try. The length test is done here because the database cannot filter on text length.
export async function needingDetail(
  sourceIds: string[],
  shortBelow: number,
  days = 7,
  limit = 40,
): Promise<{ url: string; sourceId: string; excerptLength: number }[]> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const rows = check(
    await db()
      .from(TABLE)
      .select("url,source_id,excerpt")
      .in("source_id", sourceIds)
      .eq("curated", false)
      .eq("paywalled", false)
      .gte("first_seen_at", since)
      .order("sort_at", { ascending: false })
      .limit(300),
    "read rows needing detail",
  ) as { url: string; source_id: string; excerpt: string }[];
  return rows
    .filter((r) => r.excerpt.length < shortBelow)
    .slice(0, limit)
    .map((r) => ({ url: r.url, sourceId: r.source_id, excerptLength: r.excerpt.length }));
}

// Stores a fuller excerpt (and the publish time when it is now known). The row's summary and comment were
// written from the old, thin text, so they are cleared and the summary step writes them again.
export async function updateDetails(details: { url: string; excerpt: string; publishedAt?: string }[]): Promise<number> {
  let n = 0;
  for (const d of details) {
    const patch = {
      excerpt: d.excerpt,
      ...(d.publishedAt ? { published_at: d.publishedAt, sort_at: d.publishedAt } : {}),
      summarized_at: null,
      summary_ko: null,
      comment_ko: null,
      en_at: null,
    };
    check(await db().from(TABLE).update(patch).eq("url", d.url).eq("curated", false), `update details ${d.url}`);
    n++;
  }
  return n;
}

// articles for the feed: only ones the AI step has classified as tech, newest first.
// Unprocessed rows stay out, so an untranslated title never shows while it waits for the next update.
// Without a sourceId (the 전체 view) only outlet articles are listed; hand-curated posts appear only when
// asked for with sourceId "curated" (the 큐레이션 button).
// Search words: what is typed is split on spaces and every word must appear somewhere in the titles, summary or
// comment. Characters that mean something inside a PostgREST filter are dropped first.
export const searchWords = (query: string): string[] =>
  query
    .replace(/["\%*_,()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((w) => w.slice(0, 40));

export async function listPublic(opts: { sourceId?: string; limit: number; lang?: "ko" | "en"; query?: string }): Promise<Article[]> {
  const en = opts.lang === "en";
  let q = db()
    .from(TABLE)
    .select(PUBLIC_COLS)
    .eq("is_tech", true)
    .order("sort_at", { ascending: false })
    .limit(opts.limit);
  const words = searchWords(opts.query ?? "");
  // a search covers curated posts too; the plain 전체 view does not
  if (opts.sourceId) q = q.eq("source_id", opts.sourceId);
  else if (words.length === 0) q = q.eq("curated", false);
  const fields = en
    ? ["title_original", "title_en", "summary_en", "comment_en", "comment_manual_en"]
    : ["title_original", "title_ko", "summary_ko", "comment_ko", "comment_manual"];
  for (const w of words) q = q.or(fields.map((f) => `${f}.ilike."*${w}*"`).join(","));
  // An outlet article waits for its summary, so a card never shows with only a title. Paywalled outlets are
  // title-only by design and curated posts are written by hand, so neither needs one.
  const summaryCol = en ? "summary_en" : "summary_ko";
  if (opts.sourceId !== "curated") q = q.or(`paywalled.eq.true,and(${summaryCol}.not.is.null,${summaryCol}.neq.)`);
  // the English edition lists only what has been written in English (the last two weeks and the curated posts)
  if (en) q = q.not("title_en", "is", null);
  const rows = check(await q, "read feed") as unknown as Parameters<typeof fromRow>[0][];
  return rows.map(fromRow);
}

// articles by id, for a reader's saved list; only ones that are still public tech articles
export async function listByIds(ids: string[]): Promise<Article[]> {
  const rows = check(
    await db().from(TABLE).select(PUBLIC_COLS).in("id", ids).eq("is_tech", true),
    "read saved articles",
  ) as unknown as Parameters<typeof fromRow>[0][];
  return rows.map(fromRow);
}

export type CuratedInput = {
  url: string;
  sourceLabel: string;
  author?: string;
  titleOriginal?: string;
  titleKo: string;
  summaryKo?: string;
  comment?: string;
  quote?: string;
};

const blank = (s?: string) => (s && s.trim() ? s.trim() : undefined);

// A hand-picked post. The pasted original text is never stored: excerpt stays empty and the AI
// steps skip these rows (processedAt/summarizedAt are set), so only what the curator wrote is kept.
export async function insertCurated(input: CuratedInput): Promise<Article> {
  const now = new Date().toISOString();
  const article: Article = {
    id: articleId(input.url),
    sourceId: "curated",
    url: input.url,
    titleOriginal: blank(input.titleOriginal) ?? "",
    firstSeenAt: now,
    excerpt: "",
    paywalled: false,
    processedAt: now,
    summarizedAt: now,
    isTech: true,
    titleKo: input.titleKo.trim(),
    summaryKo: blank(input.summaryKo),
    commentManual: blank(input.comment),
    curated: true,
    author: blank(input.author),
    sourceLabel: input.sourceLabel.trim(),
    quote: blank(input.quote),
  };
  const res = await db().from(TABLE).insert(toRow(article));
  if (res.error) {
    // url is unique: the same link may already be stored, collected or curated
    throw new Error(res.error.code === "23505" ? "이미 등록된 링크입니다." : `save curated post: ${res.error.message}`);
  }
  return article;
}

export async function listCurated(): Promise<Article[]> {
  const rows = check(
    await db().from(TABLE).select(PUBLIC_COLS).eq("curated", true).order("sort_at", { ascending: false }).limit(200),
    "read curated posts",
  ) as unknown as Parameters<typeof fromRow>[0][];
  return rows.map(fromRow);
}

export async function deleteCurated(id: string): Promise<void> {
  check(await db().from(TABLE).delete().eq("id", id).eq("curated", true), `delete curated ${id}`);
}

// full rows including excerpt; used by the one-off import
export async function upsertArticles(articles: Article[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < articles.length; i += CHUNK) {
    const rows = articles.slice(i, i + CHUNK).map(toRow);
    check(await db().from(TABLE).upsert(rows, { onConflict: "id" }), "import articles");
    n += rows.length;
  }
  return n;
}

// ---- weekly briefings (see supabase/migrations/20261031_briefings.sql) ----

export type WeeklyBriefing = { weekStart: string; body: string; articleCount: number };

type WeekArticleRow = { source_id: string; title_ko: string; title_en: string | null; summary_ko: string | null; importance: number | null };

// the week's most important tech articles; `total` counts all of the week's tech articles
export async function articlesForWeek(weekStart: string, weekEnd: string, limit: number) {
  const res = await db()
    .from(TABLE)
    .select("source_id,title_ko,title_en,summary_ko,importance", { count: "exact" })
    .eq("is_tech", true)
    .eq("curated", false)
    .not("title_ko", "is", null)
    .gte("sort_at", `${weekStart}T00:00:00Z`)
    .lt("sort_at", `${weekEnd}T00:00:00Z`)
    .order("importance", { ascending: false })
    .order("sort_at", { ascending: false })
    .limit(limit);
  const rows = check(res, "read week articles") as WeekArticleRow[];
  return {
    total: res.count ?? rows.length,
    articles: rows.map((r) => ({
      sourceId: r.source_id,
      titleKo: r.title_ko,
      titleEn: r.title_en ?? undefined,
      summaryKo: r.summary_ko ?? undefined,
      importance: r.importance ?? 1,
    })),
  };
}

// weeks (Mondays) that already have a briefing in both languages
export async function briefedWeeks(): Promise<Set<string>> {
  const rows = check(await db().from("briefings").select("week_start,lang"), "read briefings") as { week_start: string; lang: string }[];
  const langs = new Map<string, number>();
  for (const r of rows) langs.set(r.week_start, (langs.get(r.week_start) ?? 0) + 1);
  return new Set([...langs].filter(([, n]) => n >= 2).map(([w]) => w));
}

export async function saveBriefing(weekStart: string, ko: string, en: string, articleCount: number): Promise<void> {
  const rows = [
    { week_start: weekStart, lang: "ko", body: ko, article_count: articleCount },
    { week_start: weekStart, lang: "en", body: en, article_count: articleCount },
  ];
  check(await db().from("briefings").upsert(rows, { onConflict: "week_start,lang" }), `save briefing ${weekStart}`);
}

// newest week first; an empty list (also before the table exists) just shows the empty state
export async function listBriefings(lang: "ko" | "en", limit = 12): Promise<WeeklyBriefing[]> {
  const res = await db()
    .from("briefings")
    .select("week_start,body,article_count")
    .eq("lang", lang)
    .order("week_start", { ascending: false })
    .limit(limit);
  if (res.error) return [];
  return (res.data as { week_start: string; body: string; article_count: number }[]).map((r) => ({
    weekStart: r.week_start,
    body: r.body,
    articleCount: r.article_count,
  }));
}
