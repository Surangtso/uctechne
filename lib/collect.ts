import { readFileSync } from "node:fs";
import https from "node:https";
import tls from "node:tls";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import type { CollectReport, CollectedItem, Source } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const EXCERPT_MAX = 600;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

const HEADERS = { "user-agent": UA, "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8" };

// fetch() cannot take an extra root certificate, so a site that needs one is read through https directly
function httpsGetText(url: string, caFile: string, redirects = 3): Promise<string> {
  const ca = [...tls.rootCertificates, readFileSync(caFile, "utf8")];
  return new Promise((resolve, reject) => {
    const req = https.get(url, { ca, headers: HEADERS, timeout: 20000 }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(httpsGetText(new URL(res.headers.location, url).href, caFile, redirects - 1));
        return;
      }
      if (status !== 200) {
        res.resume();
        reject(new Error(`HTTP ${status}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function fetchText(url: string, caFile?: string): Promise<string> {
  let body: string;
  if (caFile) {
    body = await httpsGetText(url, caFile);
  } else {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.text();
  }
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

// stored in the paywalled column: such an article is listed by its title alone
const titleOnly = (source: Source) => !!(source.paywalled || source.headlineOnly);

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
    // newsletters put only a subtitle in description and the post itself in content:encoded: take the fuller one
    const blurb = text(it.description) || text(it.summary) || text(it.content);
    const full = text(it["content:encoded"]);
    const body = plain(full).length > plain(blurb).length ? full : blurb;
    items.push({
      sourceId: source.id,
      url: normalizeUrl(url),
      titleOriginal: title,
      publishedAt: toIso(text(it.pubDate) || text(it.published) || text(it.updated)),
      excerpt: titleOnly(source) ? "" : plain(body),
      paywalled: titleOnly(source),
    });
  }
  return items;
}

// The list a Tencent News author page loads: { newslist: [{ title, url, time, abstract }] }, newest first
function parseQq(json: string, source: Source): CollectedItem[] {
  const list: { title?: string; url?: string; time?: string; abstract?: string }[] = JSON.parse(json).newslist ?? [];
  const items: CollectedItem[] = [];
  for (const n of list) {
    const title = decode(n.title ?? "");
    if (!title || !n.url) continue;
    items.push({
      sourceId: source.id,
      url: normalizeUrl(n.url),
      titleOriginal: title,
      publishedAt: n.time ? toIso(`${n.time} +0800`) : undefined,
      excerpt: plain(n.abstract ?? ""),
      paywalled: titleOnly(source),
    });
  }
  return items;
}

// Sites without a feed: article cards on the front page are links matching source.linkPattern
function parseLinks(html: string, source: Source): CollectedItem[] {
  const $ = cheerio.load(html);
  const pattern = new RegExp(source.linkPattern ?? "");
  const byId = new Map<string, CollectedItem>();
  const ids = new Map<string, number>();
  $("a[href]").each((_, a) => {
    let link: URL;
    try {
      link = new URL($(a).attr("href") ?? "", source.url);
    } catch {
      return;
    }
    const m = link.href.match(pattern);
    if (!m) return;
    // a heading or title attribute names the article; otherwise the link text does, if it reads like a headline
    const own = $(a).text().replace(/\s+/g, " ").trim();
    const named = source.titleSelector ? $(a).find(source.titleSelector).first().text() : "";
    const title = (
      named.replace(/\s+/g, " ") ||
      $(a).find("h1,h2,h3").first().text() ||
      $(a).attr("title") ||
      (own.length <= 80 ? own : "")
    )
      .replace(/\s*(今天|昨天|前天|\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2})$/, "") // a date written after the headline
      .trim();
    if (title.length < 4) return;
    const key = m[1] ?? m[0];
    // the same article is linked more than once (image, label, headline): keep the fullest title
    const seen = byId.get(key);
    if (seen && seen.titleOriginal.length >= title.length) return;
    byId.set(key, {
      sourceId: source.id,
      // the query is dropped (tracking noise), unless the id lives in it
      url: `${link.origin}${link.pathname}${source.linkPattern?.includes("\\?") ? link.search : ""}`,
      titleOriginal: title,
      excerpt: "",
      paywalled: titleOnly(source),
    });
    ids.set(key, Number(m[1]));
  });
  let out = [...byId.entries()];
  if (source.keepLatest) {
    out = out.sort((x, y) => (ids.get(y[0]) ?? 0) - (ids.get(x[0]) ?? 0)).slice(0, source.keepLatest);
  }
  return out.map(([, item]) => item);
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
const DETAIL_SOURCES = new Set(["huxiu", "pedaily", "pingwest", "tmtpost"]);
const SHORT_EXCERPT = 60; // fewer characters than this is not enough for the AI to work with

type Detail = { excerpt: string; publishedAt?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// One failed request (bot check, dropped connection) is common, so a page is tried a few times with a growing
// pause; an empty result counts as a failure too.
async function fetchDetail(sourceId: string, url: string): Promise<Detail | null> {
  if (!DETAIL_SOURCES.has(sourceId)) return null;
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
    if (sourceId === "huxiu" || sourceId === "pedaily") {
      // the page's meta tags carry a two-sentence blurb and the publish time
      const blurb = $('meta[name="description"]').attr("content") ?? "";
      const time = $('meta[property="article:published_time"]').attr("content") ?? "";
      return { excerpt: plain(blurb), publishedAt: toIso(time) };
    }
    if (sourceId === "pingwest") {
      // the publish time sits in the page's ld+json block, the text in the article body
      let time = "";
      try {
        time = String(JSON.parse($('script[type="application/ld+json"]').first().text()).pubDate ?? "");
      } catch {
        // no usable block: the article is stored without a date
      }
      const body = $("article.article-style p")
        .map((_, p) => $(p).text().trim())
        .get()
        .filter((t) => t.length > 20)
        .join(" ");
      return { excerpt: plain(body), publishedAt: toIso(time) };
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
    const body = await fetchText(source.url, source.trustCa);
    let items =
      source.kind === "rss" ? parseFeed(body, source) : source.kind === "qq" ? parseQq(body, source) : parseLinks(body, source);
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
