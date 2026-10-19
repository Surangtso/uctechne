import type { Source } from "./types";

export const SOURCES: Source[] = [
  { id: "techmeme", name: "Techmeme", lang: "en", kind: "rss", url: "https://www.techmeme.com/feed.xml" },
  { id: "verge", name: "The Verge", lang: "en", kind: "rss", url: "https://www.theverge.com/rss/index.xml" },
  { id: "benedict-evans", name: "Benedict Evans", lang: "en", kind: "rss", url: "https://www.ben-evans.com/benedictevans?format=rss" },
  {
    id: "stratechery",
    name: "Stratechery",
    lang: "en",
    kind: "rss",
    url: "https://stratechery.com/feed/",
    // Daily Updates and Interviews are subscriber-only
    categories: ["Articles", "This Week in Stratechery"],
  },
  { id: "the-information", name: "The Information", lang: "en", kind: "rss", url: "https://www.theinformation.com/feed", paywalled: true },
  { id: "tmtpost", name: "钛媒体", lang: "zh", kind: "rss", url: "https://www.tmtpost.com/rss.xml" },
  // the bare 36kr.com/feed sits behind a bot check; the www host serves the public feed
  { id: "36kr", name: "36氪", lang: "zh", kind: "rss", url: "https://www.36kr.com/feed" },
  { id: "huxiu", name: "虎嗅", lang: "zh", kind: "html", url: "https://www.huxiu.com/" },
];
