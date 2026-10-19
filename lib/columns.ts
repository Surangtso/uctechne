import type { Article } from "./types";

// How much room a string takes in ems: a CJK or Hangul character is one em wide, any other character about half.
const em = (s: string) => [...s].reduce((n, ch) => n + (/[ᄀ-ᇿ⺀-鿿가-힯＀-￯]/.test(ch) ? 1 : 0.55), 0);
const lines = (s: string, perLine: number) => Math.max(1, Math.ceil(em(s) / perLine));

// Rough height in px of a card at rest, for a desktop-width column. The hover panel is an overlay, so it
// does not count. Only the proportions between cards matter here, not the exact number.
export function estimateHeight(a: Article): number {
  const title = a.titleKo ?? a.titleOriginal;
  const comment = a.commentManual ?? a.commentKo;
  let h = 40 + 28 + 28 * lines(title, 24); // padding, meta row, title (20px bold)
  if (a.titleKo && a.titleOriginal) h += 4 + 15 * lines(a.titleOriginal, 48); // small original title (11px)
  if (comment) h += 12 + 25 * lines(comment, 33); // comment block (15px)
  return h;
}

export type Placed = { article: Article; order: number };

const GAP = 16;

// Deals the cards, newest first, into two columns, each one onto whichever column is shorter so far.
// `order` is the card's position in the original newest-first list (used to restore that order on a phone).
export function dealIntoColumns(articles: Article[]): { columns: [Placed[], Placed[]]; heights: [number, number] } {
  const columns: [Placed[], Placed[]] = [[], []];
  const heights: [number, number] = [0, 0];
  articles.forEach((article, order) => {
    const k = heights[1] < heights[0] ? 1 : 0;
    columns[k].push({ article, order });
    heights[k] += estimateHeight(article) + GAP;
  });
  return { columns, heights };
}
