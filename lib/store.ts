import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Article, CollectedItem } from "./types";

const FILE = path.join(process.cwd(), "data", "articles.json");
const MAX_ARTICLES = 2000;

export function articleId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

export async function loadArticles(): Promise<Article[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Article[];
  } catch {
    return [];
  }
}

export async function saveArticles(articles: Article[]): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(articles, null, 2), "utf8");
}

// adds items not seen before; existing articles keep their translations/comments
export async function mergeItems(items: CollectedItem[]): Promise<{ added: Article[]; total: number }> {
  const existing = await loadArticles();
  const seen = new Set(existing.map((a) => a.id));
  const now = new Date().toISOString();
  const added: Article[] = [];
  for (const item of items) {
    const id = articleId(item.url);
    if (seen.has(id)) continue;
    seen.add(id);
    added.push({ ...item, id, firstSeenAt: now });
  }
  const all = [...added, ...existing]
    .sort((a, b) => (b.publishedAt ?? b.firstSeenAt).localeCompare(a.publishedAt ?? a.firstSeenAt))
    .slice(0, MAX_ARTICLES);
  await saveArticles(all);
  return { added, total: all.length };
}
