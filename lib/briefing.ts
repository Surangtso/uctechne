import Anthropic from "@anthropic-ai/sdk";
import { COMMON, SUMMARY_MODEL, hasHan } from "./enrich";
import { SOURCES, nameOf, regionOf } from "./sources";

const DAY = 24 * 3600 * 1000;
const sourceOf = new Map(SOURCES.map((s) => [s.id, s]));

// weeks run Monday to Sunday (UTC); a week is identified by its Monday as "YYYY-MM-DD"
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function mondayOf(d: Date): Date {
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY);
}

// the Mondays of the last `count` finished weeks, newest first
export function finishedWeeks(now: Date, count: number): string[] {
  const thisMonday = mondayOf(now).getTime();
  return Array.from({ length: count }, (_, i) => isoDay(new Date(thisMonday - (i + 1) * 7 * DAY)));
}

export const weekEnd = (weekStart: string) => isoDay(new Date(new Date(`${weekStart}T00:00:00Z`).getTime() + 7 * DAY));

export type WeekArticle = {
  sourceId: string;
  titleKo: string;
  titleEn?: string;
  summaryKo?: string;
  importance: number;
};

const BRIEFING_SYSTEM = `${COMMON}

You write the weekly trend briefing of the digest. You receive the most important technology articles of one finished week, from US and Chinese media, each with its outlet, region (us or cn), a Korean title, an English title when there is one, a short Korean summary and an importance score from 1 to 5.

Write the briefing twice, once in Korean (ko) and once in English (en). Both say the same thing.
- One or two paragraphs, separated by a blank line. About 400-700 characters in Korean and 90-150 words in English in total.
- Name the two to four main themes of the week and the concrete events behind them: companies, products, deals, policies. Group related items instead of listing articles one by one. Put the heaviest items (importance 4-5) first.
- Mention how US and Chinese coverage differ only when the articles themselves show it.
- Plain, neutral news style (Korean: ~했다, ~이다). Refer to "the week" or "that week", never "this week", because readers open it later. Use only what the articles say: no numbers, names or causes of your own, and no opinions, predictions, advice or praise. Do not relate it to Korea or Korean readers.
- The English text uses established English names (Tencent, ByteDance, CATL) or Hanyu Pinyin. No Chinese characters in either text, not even in parentheses.`;

const BRIEFING_SCHEMA = {
  type: "object",
  properties: { ko: { type: "string" }, en: { type: "string" } },
  required: ["ko", "en"],
  additionalProperties: false,
} as const;

export type Briefing = { ko: string; en: string };

async function once(client: Anthropic, articles: WeekArticle[]): Promise<Briefing> {
  const payload = articles.map((a) => {
    const src = sourceOf.get(a.sourceId);
    return {
      outlet: src ? nameOf(src, "en") : a.sourceId,
      region: src ? regionOf(src) : "us",
      titleKo: a.titleKo,
      titleEn: a.titleEn ?? "",
      summaryKo: a.summaryKo ?? "",
      importance: a.importance,
    };
  });
  const res = await client.beta.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default" as const,
    system: BRIEFING_SYSTEM,
    output_config: { effort: "medium", format: { type: "json_schema", schema: BRIEFING_SCHEMA as unknown as Record<string, unknown> } },
    messages: [{ role: "user", content: JSON.stringify(payload) }],
  });
  if (res.stop_reason === "refusal") throw new Error(`refused (${res.stop_details?.category ?? "unknown"})`);
  if (res.stop_reason === "max_tokens") throw new Error("output cut off at max_tokens");
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text in response");
  const parsed = JSON.parse(block.text) as Briefing;
  return { ko: parsed.ko.trim(), en: parsed.en.trim() };
}

// A name left in Chinese characters means the model skipped a rule: ask once more and keep the second answer as it is.
export async function writeBriefing(client: Anthropic, articles: WeekArticle[]): Promise<Briefing> {
  const first = await once(client, articles);
  if (first.ko && first.en && !hasHan(first.ko) && !hasHan(first.en)) return first;
  console.log("  Chinese characters or an empty text, asking again");
  return once(client, articles);
}
