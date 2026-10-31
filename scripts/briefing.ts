import Anthropic from "@anthropic-ai/sdk";
import { finishedWeeks, weekEnd, writeBriefing } from "../lib/briefing";
import { articlesForWeek, briefedWeeks, saveBriefing } from "../lib/store";

// how many finished weeks back to fill in, how many articles feed one briefing, and the fewest worth a briefing
const WEEKS_BACK = 4;
const TOP = 80;
const MIN_ARTICLES = 60;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is empty. Put it in .env.local and run again.");
    process.exit(1);
  }
  const client = new Anthropic();
  const done = await briefedWeeks();
  const todo = finishedWeeks(new Date(), WEEKS_BACK).filter((w) => !done.has(w));
  if (todo.length === 0) {
    console.log("briefing: nothing to do");
    return;
  }
  // oldest first, so a failure never leaves a gap behind newer weeks
  for (const week of todo.reverse()) {
    const { total, articles } = await articlesForWeek(week, weekEnd(week), TOP);
    if (total < MIN_ARTICLES) {
      console.log(`${week}: only ${total} articles, skipped`);
      continue;
    }
    const b = await writeBriefing(client, articles);
    if (!b.ko || !b.en) throw new Error(`${week}: empty briefing`);
    await saveBriefing(week, b.ko, b.en, total);
    console.log(`${week}: briefing saved from ${total} articles (top ${articles.length} used)`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
