export type Lang = "en" | "zh";

export type Article = {
  id: string;
  sourceId: string;
  url: string;
  titleOriginal: string;
  publishedAt?: string;
  firstSeenAt: string;
  // short plain-text snippet of the original, used only as AI input, never shown
  excerpt: string;
  paywalled: boolean;
  // filled by the AI steps; processedAt = translated/classified, summarizedAt = summary + comment done
  processedAt?: string;
  summarizedAt?: string;
  titleKo?: string;
  summaryKo?: string;
  commentKo?: string;
  isTech?: boolean;
  importance?: number;
  // written by hand, wins over commentKo when present
  commentManual?: string;
  // hand-curated posts: shown with the author and where they appeared; never collected or AI-filtered
  curated?: boolean;
  author?: string;
  sourceLabel?: string;
  quote?: string;
};

export type CollectedItem = Omit<Article, "id" | "firstSeenAt">;

export type Source = {
  id: string;
  name: string;
  lang: Lang;
  // qq: the article list of a Tencent News author page (JSON)
  kind: "rss" | "html" | "qq";
  url: string;
  // headline-only sources: only title + link are usable
  paywalled?: boolean;
  // keep only feed items whose categories match
  categories?: string[];
  // html sources: regex for article links on the front page; group 1 identifies the article
  linkPattern?: string;
  // html sources: CSS selector, inside the link, of the element holding the headline
  titleSelector?: string;
  // html sources without dates: keep only this many articles, the ones with the highest numeric id
  keepLatest?: number;
  // free to read, but the page gives no text a reader or the AI can use: shown as a title only
  headlineOnly?: boolean;
  // PEM file of an extra root certificate to trust for this site, whose server sends an incomplete chain
  trustCa?: string;
};

export type CollectReport = {
  sourceId: string;
  ok: boolean;
  count: number;
  error?: string;
};
