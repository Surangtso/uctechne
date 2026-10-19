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

export async function collectSource(source: Source): Promise<{ items: CollectedItem[]; report: CollectReport }> {
  try {
    const body = await fetchText(source.url);
    const items = source.kind === "rss" ? parseFeed(body, source) : parseHuxiu(body, source);
    if (items.length === 0) throw new Error("parsed 0 items");
    return { items, report: { sourceId: source.id, ok: true, count: items.length } };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { items: [], report: { sourceId: source.id, ok: false, count: 0, error } };
  }
}

export async function collectAll(sources: Source[]) {
  const results = await Promise.all(sources.map(collectSource));
  return { items: results.flatMap((r) => r.items), reports: results.map((r) => r.report) };
}
