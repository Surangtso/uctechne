import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import type { CollectReport, CollectedItem, Source } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const EXCERPT_MAX = 600;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  if (body.includes("__waf_verification_challenge")) throw new Error("blocked by bot check");
  return body;
}

// feed fields come back as strings, {#text}, or arrays depending on the markup
function text(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === "object") return text((v as Record<string, unknown>)["#text"]);
  return String(v).trim();
}

function plain(html: string): string {
  return cheerio.load(html).text().replace(/\s+/g, " ").trim().slice(0, EXCERPT_MAX);
}

// some feeds double-escape titles ("It&#8217;s"), which the XML parser decodes only once
function decode(s: string): string {
  return cheerio.load(s).text().replace(/\s+/g, " ").trim();
}

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    for (const k of [...u.searchParams.keys()]) {
      if (k.startsWith("utm_") || k === "f" || k === "ref") u.searchParams.delete(k);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return raw;
  }
}

function atomLink(link: unknown): string {
  const links = Array.isArray(link) ? link : [link];
  const alt = links.find((l) => l && typeof l === "object" && (l["@_rel"] ?? "alternate") === "alternate");
  const pick = alt ?? links[0];
  if (pick && typeof pick === "object") return pick["@_href"] ?? text(pick);
  return text(pick);
}

function categories(raw: unknown): string[] {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((c) => (typeof c === "object" ? (c["@_term"] ?? text(c)) : String(c)).trim());
}

function toIso(v: string): string | undefined {
  if (!v) return undefined;
  // 36kr writes "2026-10-19 08:10:05  +0800"
  const d = new Date(v.replace(/\s+/, "T").replace(/\s+/g, "").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  const d2 = new Date(v);
  return Number.isNaN(d2.getTime()) ? undefined : d2.toISOString();
}

function parseFeed(xml: string, source: Source): CollectedItem[] {
  const doc = parser.parse(xml);
  const rawItems: Record<string, unknown>[] = doc.rss
    ? [doc.rss.channel?.item ?? []].flat()
    : [doc.feed?.entry ?? []].flat();

  const items: CollectedItem[] = [];
  for (const it of rawItems) {
    const title = decode(text(it.title));
    const url = doc.rss ? text(it.link) : atomLink(it.link);
    if (!title || !url) continue;
    if (source.categories) {
      const cats = categories(it.category);
      if (!cats.some((c) => source.categories!.includes(c))) continue;
    }
    const body = text(it.description) || text(it.summary) || text(it.content) || text(it["content:encoded"]);
    items.push({
      sourceId: source.id,
      url: normalizeUrl(url),
      titleOriginal: title,
      publishedAt: toIso(text(it.pubDate) || text(it.published) || text(it.updated)),
      excerpt: source.paywalled ? "" : plain(body),
      paywalled: !!source.paywalled,
    });
  }
  return items;
}

// huxiu has no feed: article cards on the front page carry /article/<id>.html links
function parseHuxiu(html: string, source: Source): CollectedItem[] {
  const $ = cheerio.load(html);
  const byId = new Map<string, CollectedItem>();
  $('a[href*="/article/"]').each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/\/article\/(\d+)\.html/);
    if (!m) return;
    const title = ($(a).find("h1,h2,h3").first().text() || $(a).attr("title") || "").trim();
    if (title.length < 4) return;
    if (byId.has(m[1])) return;
    byId.set(m[1], {
      sourceId: source.id,
      url: `https://www.huxiu.com/article/${m[1]}.html`,
      titleOriginal: title,
      excerpt: "",
      paywalled: false,
    });
  });
  return [...byId.values()];
}

async function mapLimit<T, R>(list: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i]);
      }
    }),
  );
  return out;
}

// Some lists give too little to summarize: the huxiu front page has no dates or blurbs, and the tmtpost feed
// carries only a one-line subtitle. Their article pages hold more, so those are read for sources listed here.
const DETAIL_SOURCES = new Set(["huxiu", "tmtpost"]);
const SHORT_EXCERPT = 60; // fewer characters than this is not enough for the AI to work with

type Detail = { excerpt: string; publishedAt?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// One failed request (bot check, dropped connection) is common, so a page is tried a few times with a growing
// pause; an empty result counts as a failure too.
async function fetchDetail(sourceId: string, url: string): Promise<Detail | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const d = await fetchDetailOnce(sourceId, url);
    if (d && d.excerpt) return d;
    if (attempt < 3) await sleep(1500 * attempt);
  }
  return null;
}

async function fetchDetailOnce(sourceId: string, url: string): Promise<Detail | null> {
  try {
    const $ = cheerio.load(await fetchText(url));
    if (sourceId === "huxiu") {
      // the page's meta tags carry a two-sentence blurb and the publish time
      const blurb = $('meta[name="description"]').attr("content") ?? "";
      const time = $('meta[property="article:published_time"]').attr("content") ?? "";
      return { excerpt: plain(blurb), publishedAt: toIso(time) };
    }
    if (sourceId === "tmtpost") {
      // the first paragraphs of the article body
      $("script,style,noscript").remove();
      const body = $("article p")
        .map((_, p) => $(p).text().trim())
        .get()
        .filter((t) => t.length > 20)
        .join(" ");
      return { excerpt: plain(body) };
    }
    return null;
  } catch {
    return null;
  }
}

async function withDetail(item: CollectedItem): Promise<CollectedItem> {
  const d = await fetchDetail(item.sourceId, item.url);
  return d ? { ...item, excerpt: d.excerpt || item.excerpt, publishedAt: d.publishedAt ?? item.publishedAt } : item;
}

export type StaleRow = { url: string; sourceId: string; excerptLength: number };
export type RefreshedDetail = { url: string; excerpt: string; publishedAt?: string };

// Retries the article page of stored rows whose excerpt came out empty or too short (a first attempt can fail,
// and a failed huxiu page is never listed as new again). Only a longer excerpt than before counts.
export async function refreshDetails(rows: StaleRow[]): Promise<RefreshedDetail[]> {
  const out = await mapLimit<StaleRow, RefreshedDetail | null>(rows, 2, async (r) => {
    const d = await fetchDetail(r.sourceId, r.url);
    return d && d.excerpt.length > r.excerptLength ? { url: r.url, excerpt: d.excerpt, publishedAt: d.publishedAt } : null;
  });
  return out.filter((x): x is RefreshedDetail => x !== null);
}

// known: urls already stored, so html sources only fetch detail pages for new articles
export async function collectSource(
  source: Source,
  known: Set<string> = new Set(),
): Promise<{ items: CollectedItem[]; report: CollectReport }> {
  try {
    const body = await fetchText(source.url);
    let items = source.kind === "rss" ? parseFeed(body, source) : parseHuxiu(body, source);
    if (items.length === 0) throw new Error("parsed 0 items");
    if (source.kind === "html") {
      items = await mapLimit(
        items.filter((i) => !known.has(i.url)),
        2,
        withDetail,
      );
    } else if (DETAIL_SOURCES.has(source.id)) {
      // a feed item whose text is only a subtitle gets the start of its article page instead
      const filled = await mapLimit(
        items.filter((i) => !known.has(i.url) && i.excerpt.length < SHORT_EXCERPT),
        2,
        withDetail,
      );
      const byUrl = new Map(filled.map((i) => [i.url, i]));
      items = items.map((i) => byUrl.get(i.url) ?? i);
    }
    return { items, report: { sourceId: source.id, ok: true, count: items.length } };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { items: [], report: { sourceId: source.id, ok: false, count: 0, error } };
  }
}

export { DETAIL_SOURCES, SHORT_EXCERPT };

export async function collectAll(sources: Source[], known: Set<string> = new Set()) {
  const results = await Promise.all(sources.map((s) => collectSource(s, known)));
  return { items: results.flatMap((r) => r.items), reports: results.map((r) => r.report) };
}
