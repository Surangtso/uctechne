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
  // English edition (/en); enAt = written, so an empty summaryEn then means "nothing to add"
  titleEn?: string;
  summaryEn?: string;
  commentEn?: string;
  enAt?: string;
  isTech?: boolean;
  importance?: number;
  // written by hand, wins over commentKo when present
  commentManual?: string;
  // hand-curated posts: shown with the author and where they appeared; never collected or AI-filtered
  curated?: boolean;
  author?: string;
  sourceLabel?: string;
  quote?: string;
  commentManualEn?: string;
  quoteEn?: string;
  authorEn?: string;
};

export type CollectedItem = Omit<Article, "id" | "firstSeenAt">;

export type Source = {
  id: string;
  name: string;
  lang: Lang;
  // qq: the article list of a Tencent News author page (JSON); jiqizhixin: that site's article library (JSON)
  kind: "rss" | "html" | "qq" | "jiqizhixin";
  // which button group the outlet sits in; by default Chinese-language outlets are CN and the rest US
  region?: "us" | "cn";
  url: string;
  // headline-only sources: only title + link are usable
  paywalled?: boolean;
  // keep only feed items whose categories match
  categories?: string[];
  // html sources: regex for article links on the front page; group 1 identifies the article
  linkPattern?: string;
  // html sources: CSS selector, inside the link, of the element holding the headline
  titleSelector?: string;
  // keep only this many articles: for html sources without dates the ones with the highest numeric id,
  // for feeds the first listed (a few feeds carry years of history)
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
