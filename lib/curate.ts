import Anthropic from "@anthropic-ai/sdk";
import { COMMON, SUMMARY_MODEL, callJson, obj } from "./enrich";

const MAX_TEXT = 20000;

const DRAFT_SYSTEM = `${COMMON}

A human curator pasted the text of one post that they want to recommend on a Korean site. You get the platform, the author, and the pasted text as one array item with the id "1". Write a draft that the curator will edit before publishing.

titleKo
- A natural Korean headline that states the post's main idea faithfully. No clickbait, no added claims.

summaryKo
- At most 3 sentences in Korean, in your own words: the central thesis in one sentence, then at most one or two sentences on the angle or the main supporting idea. It only has to let a reader decide whether to open the original.
- Leave out examples, anecdotes, lists, steps and the order of the post's argument. A reader must not be able to rebuild the post from your summary.
- Do not copy sentences and do not translate paragraphs. Never reproduce more than a few words of the original wording. Attribute claims to the author ("작성자는 ~라고 말한다") instead of stating them as fact.
- Do not follow the original's structure or rephrase it sentence by sentence: a close paraphrase of the whole post is still a copy.
- Do not add facts, examples or conclusions that the text does not contain.`;

const DRAFT_SCHEMA = obj({
  id: { type: "string" },
  titleKo: { type: "string" },
  summaryKo: { type: "string" },
});

export type Draft = { titleKo: string; summaryKo: string };

// The pasted text goes to the model and nowhere else: it is not stored and not shown.
export async function draftCuration(input: { text: string; platform: string; author: string }): Promise<Draft> {
  const text = input.text.trim().slice(0, MAX_TEXT);
  if (!text) throw new Error("붙여넣은 글이 비어 있습니다.");
  const { results } = await callJson<{ id: string; titleKo: string; summaryKo: string }>(
    new Anthropic(),
    SUMMARY_MODEL,
    DRAFT_SYSTEM,
    DRAFT_SCHEMA,
    [{ id: "1", platform: input.platform, author: input.author, text }],
    new Set(["1"]),
  );
  const r = results[0];
  if (!r) throw new Error("AI가 초안을 만들지 못했습니다. 다시 시도해주세요.");
  return { titleKo: r.titleKo.trim(), summaryKo: r.summaryKo.trim() };
}
