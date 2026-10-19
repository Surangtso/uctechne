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
  "id,source_id,url,title_original,published_at,first_seen_at,paywalled,is_tech,importance,title_ko,summary_ko,comment_ko,comment_manual,curated,author,source_label,quote";

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

// articles for the feed: tech (or not yet classified), newest first
export async function listPublic(opts: { sourceId?: string; limit: number }): Promise<Article[]> {
  let q = db()
    .from(TABLE)
    .select(PUBLIC_COLS)
    .or("is_tech.is.null,is_tech.eq.true")
    .order("sort_at", { ascending: false })
    .limit(opts.limit);
  if (opts.sourceId) q = q.eq("source_id", opts.sourceId);
  const rows = check(await q, "read feed") as unknown as Parameters<typeof fromRow>[0][];
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
