import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_MAX_CHARS } from "./curate-limits";
import { COMMON, callJson, obj } from "./enrich";

// The draft is written once per post by hand, so it uses the strongest model rather than the cheap one
// that summarizes the automatic feed. Override with DIGEST_DRAFT_MODEL.
export const DRAFT_MODEL = process.env.DIGEST_DRAFT_MODEL ?? "claude-opus-5-5";

const DRAFT_SYSTEM = `${COMMON}

A human curator pasted the text of one post that they want to recommend on a Korean site. You get the platform, the author, and the pasted text as one array item with the id "1". Write a draft that the curator will edit before publishing.

titleKo
- A natural Korean headline that states the post's main idea faithfully. No clickbait, no added claims.

summaryKo
- A short paragraph in Korean, in your own words: the central thesis first, then the main supporting ideas and the angle the author takes. It should give a reader a real sense of the post and let them decide whether to open the original.
- Length: 5 to 7 sentences for a long post, fewer for a short one. Never longer than about a fifth of the original; the item gives the original's length as "chars". A short post must not be retold in full.
- Mention an example or anecdote only in a few words when it carries the point. No lists or step-by-step breakdowns. Do not walk through the post paragraph by paragraph: group the ideas by theme, and if your sentences follow the post's order one for one, regroup them.
- Do not copy sentences and do not translate paragraphs. Never reproduce more than a few words of the original wording. Attribute claims to the author ("작성자는 ~라고 말한다") instead of stating them as fact.
- Do not follow the original's structure or rephrase it sentence by sentence: a close paraphrase of the whole post is still a copy, and the summary must not replace reading the post.
- Do not add facts, examples or conclusions that the text does not contain.`;

const DRAFT_SCHEMA = obj({
  id: { type: "string" },
  titleKo: { type: "string" },
  summaryKo: { type: "string" },
});

export type Draft = {
  titleKo: string;
  summaryKo: string;
  // the pasted text was longer than DRAFT_MAX_CHARS, so only its beginning was used
  truncated: boolean;
  totalChars: number;
};

// The pasted text goes to the model and nowhere else: it is not stored and not shown.
export async function draftCuration(input: { text: string; platform: string; author: string }): Promise<Draft> {
  const full = input.text.trim();
  if (!full) throw new Error("붙여넣은 글이 비어 있습니다.");
  const text = full.slice(0, DRAFT_MAX_CHARS);
  const { results } = await callJson<{ id: string; titleKo: string; summaryKo: string }>(
    new Anthropic(),
    DRAFT_MODEL,
    DRAFT_SYSTEM,
    DRAFT_SCHEMA,
    [{ id: "1", platform: input.platform, author: input.author, chars: text.length, text }],
    new Set(["1"]),
    "medium",
  );
  const r = results[0];
  if (!r) throw new Error("AI가 초안을 만들지 못했습니다. 다시 시도해주세요.");
  return {
    titleKo: r.titleKo.trim(),
    summaryKo: r.summaryKo.trim(),
    truncated: full.length > DRAFT_MAX_CHARS,
    totalChars: full.length,
  };
}
