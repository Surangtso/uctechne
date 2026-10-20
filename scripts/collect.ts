import { DETAIL_SOURCES, SHORT_EXCERPT, collectAll, refreshDetails } from "../lib/collect";
import { SOURCES } from "../lib/sources";
import { insertItems, knownUrls, needingDetail, updateDetails } from "../lib/store";

async function main() {
  const { items, reports } = await collectAll(SOURCES, await knownUrls());
  for (const r of reports) {
    console.log(`${r.ok ? "ok  " : "FAIL"} ${r.sourceId.padEnd(16)} ${r.ok ? r.count + " items" : r.error}`);
  }
  const added = await insertItems(items);
  console.log(`\n${added.length} new`);

  // Older rows whose article page failed or gave too little text get another try; a better excerpt means the
  // summary step will write their summary and comment on the next pass. A failure here must not fail the run.
  try {
    const stale = await needingDetail([...DETAIL_SOURCES], SHORT_EXCERPT);
    const better = await refreshDetails(stale);
    const n = await updateDetails(better);
    console.log(`${n} of ${stale.length} older articles got a fuller excerpt`);
  } catch (e) {
    console.warn("detail refresh skipped:", e instanceof Error ? e.message : e);
  }

  // one flaky source must not block the AI step in `npm run update`; only fail when nothing worked
  if (reports.every((r) => !r.ok)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
