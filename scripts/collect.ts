import { collectAll } from "../lib/collect";
import { SOURCES } from "../lib/sources";
import { loadArticles, mergeItems } from "../lib/store";

async function main() {
  const known = new Set((await loadArticles()).map((a) => a.url));
  const { items, reports } = await collectAll(SOURCES, known);
  for (const r of reports) {
    console.log(`${r.ok ? "ok  " : "FAIL"} ${r.sourceId.padEnd(16)} ${r.ok ? r.count + " items" : r.error}`);
  }
  const { added, total } = await mergeItems(items);
  console.log(`\n${added.length} new, ${total} stored`);
  // one flaky source must not block the AI step in `npm run update`; only fail when nothing worked
  if (reports.every((r) => !r.ok)) process.exitCode = 1;
}

main();
