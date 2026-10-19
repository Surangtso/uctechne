import { collectAll } from "../lib/collect";
import { SOURCES } from "../lib/sources";
import { insertItems, knownUrls } from "../lib/store";

async function main() {
  const { items, reports } = await collectAll(SOURCES, await knownUrls());
  for (const r of reports) {
    console.log(`${r.ok ? "ok  " : "FAIL"} ${r.sourceId.padEnd(16)} ${r.ok ? r.count + " items" : r.error}`);
  }
  const added = await insertItems(items);
  console.log(`\n${added.length} new`);
  // one flaky source must not block the AI step in `npm run update`; only fail when nothing worked
  if (reports.every((r) => !r.ok)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
