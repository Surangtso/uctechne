import Anthropic from "@anthropic-ai/sdk";
import {
  BATCH_SIZE,
  SUMMARY_MODEL,
  TRANSLATE_MODEL,
  applySummary,
  applyTranslation,
  summarizeBatch,
  translateBatch,
  untranslated,
  type TranslateResult,
  type Usage,
} from "../lib/enrich";
import { pendingSummary, pendingTranslation, saveEnrichment } from "../lib/store";
import type { Article } from "../lib/types";

const CONCURRENCY = 3;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is empty. Put it in .env.local and run again.");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
  const client = new Anthropic();

  async function phase<R extends { id: string }>(
    label: string,
    model: string,
    todo: Article[],
    run: (batch: Article[]) => Promise<{ results: R[]; usage: Usage }>,
    apply: (a: Article, r: R) => void,
  ) {
    if (todo.length === 0) {
      console.log(`${label}: nothing to do`);
      return;
    }
    const batches: Article[][] = [];
    for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push(todo.slice(i, i + BATCH_SIZE));
    console.log(`${label}: ${todo.length} articles in ${batches.length} batches, model ${model}`);

    const byId = new Map(todo.map((a) => [a.id, a]));
    const total = { input: 0, output: 0 };
    let done = 0;
    let failed = 0;
    let next = 0;
    async function worker() {
      while (next < batches.length) {
        const batch = batches[next++];
        try {
          const { results, usage } = await run(batch);
          // saved per batch, so a crash later loses nothing that was already paid for
          await Promise.all(
            results.map(async (r) => {
              const a = byId.get(r.id);
              if (!a) return;
              apply(a, r);
              await saveEnrichment(a);
            }),
          );
          total.input += usage.input;
          total.output += usage.output;
          done += results.length;
          if (results.length < batch.length) console.warn(`  batch returned ${results.length}/${batch.length}; rest retried next run`);
        } catch (e) {
          failed += batch.length;
          console.error(`  batch failed: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`  ${done} done, ${failed} failed, tokens ${total.input} in / ${total.output} out`);
  }

  // newest first, so a limited run covers what readers see first
  const applyTitle = (isRetry: boolean) => (a: Article, r: TranslateResult) => {
    // A "translation" without Hangul is the original title copied back. Leave the article pending so the
    // stronger model gets it next; on that retry the result is kept as is, so nothing loops forever.
    if (!isRetry && untranslated(r)) {
      console.log(`  not translated, retrying: [${a.sourceId}] ${a.titleOriginal}`);
      return;
    }
    applyTranslation(a, r);
    if (r.propaganda) console.log(`  left out as party/state messaging: [${a.sourceId}] ${a.titleOriginal}`);
  };
  await phase("translate", TRANSLATE_MODEL, await pendingTranslation(limit), (b) => translateBatch(client, b), applyTitle(false));
  await phase(
    "translate (retry)",
    SUMMARY_MODEL,
    await pendingTranslation(limit),
    (b) => translateBatch(client, b, SUMMARY_MODEL),
    applyTitle(true),
  );
  await phase("summarize", SUMMARY_MODEL, await pendingSummary(), (b) => summarizeBatch(client, b), applySummary);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
