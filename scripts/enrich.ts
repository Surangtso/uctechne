import Anthropic from "@anthropic-ai/sdk";
import { BATCH_SIZE, MODEL, applyResult, enrichBatch } from "../lib/enrich";
import { loadArticles, saveArticles } from "../lib/store";

const CONCURRENCY = 3;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is empty. Put it in .env.local and run again.");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

  const articles = await loadArticles();
  // newest first, so a limited run covers what readers see first
  const todo = articles.filter((a) => !a.processedAt).slice(0, limit);
  if (todo.length === 0) {
    console.log("nothing to process");
    return;
  }

  const batches: (typeof todo)[] = [];
  for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push(todo.slice(i, i + BATCH_SIZE));
  console.log(`${todo.length} articles in ${batches.length} batches, model ${MODEL}`);

  const client = new Anthropic();
  const byId = new Map(articles.map((a) => [a.id, a]));
  const total = { input: 0, output: 0 };
  let done = 0;
  let failed = 0;
  // batches finish out of order; serialize file writes so they never interleave
  let saving: Promise<void> = Promise.resolve();
  const save = () => (saving = saving.then(() => saveArticles(articles)));

  let next = 0;
  async function worker() {
    while (next < batches.length) {
      const batch = batches[next++];
      try {
        const { results, usage } = await enrichBatch(client, batch);
        for (const r of results) {
          const a = byId.get(r.id);
          if (a) applyResult(a, r);
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
  await saving;

  console.log(`\n${done} processed, ${failed} failed`);
  console.log(`tokens: ${total.input} in / ${total.output} out`);
}

main();
