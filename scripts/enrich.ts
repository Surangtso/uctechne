import Anthropic from "@anthropic-ai/sdk";
import {
  BATCH_SIZE,
  SUMMARY_MODEL,
  TRANSLATE_MODEL,
  applySummary,
  applyTranslation,
  needsSummary,
  summarizeBatch,
  translateBatch,
  type Usage,
} from "../lib/enrich";
import { loadArticles, saveArticles } from "../lib/store";
import type { Article } from "../lib/types";

const CONCURRENCY = 3;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is empty. Put it in .env.local and run again.");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

  const articles = await loadArticles();
  const byId = new Map(articles.map((a) => [a.id, a]));
  const client = new Anthropic();

  // batches finish out of order; serialize file writes so they never interleave
  let saving: Promise<void> = Promise.resolve();
  const save = () => (saving = saving.then(() => saveArticles(articles)));

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

    const total = { input: 0, output: 0 };
    let done = 0;
    let failed = 0;
    let next = 0;
    async function worker() {
      while (next < batches.length) {
        const batch = batches[next++];
        try {
          const { results, usage } = await run(batch);
          for (const r of results) {
            const a = byId.get(r.id);
            if (a) apply(a, r);
          }
          total.input += usage.input;
          total.output += usage.output;
          done += results.length;
          if (results.length < batch.length) console.warn(`  batch returned ${results.length}/${batch.length}; rest retried next run`);
          await save();
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
  await phase("translate", TRANSLATE_MODEL, articles.filter((a) => !a.processedAt).slice(0, limit), (b) => translateBatch(client, b), applyTranslation);
  await phase("summarize", SUMMARY_MODEL, articles.filter(needsSummary), (b) => summarizeBatch(client, b), applySummary);
  await saving;
}

main();
