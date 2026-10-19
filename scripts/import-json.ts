// One-off: copy the old local data/articles.json into Supabase. Safe to re-run (upserts by id).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { upsertArticles } from "../lib/store";
import type { Article } from "../lib/types";

async function main() {
  const file = path.join(process.cwd(), "data", "articles.json");
  const articles = JSON.parse(await readFile(file, "utf8")) as Article[];
  const n = await upsertArticles(articles);
  console.log(`imported ${n} articles from ${file}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
