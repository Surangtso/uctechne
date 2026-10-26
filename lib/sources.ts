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
  { id: "techcrunch", name: "TechCrunch", lang: "en", kind: "rss", url: "https://techcrunch.com/feed/" },
  // subscriber-only: the feed carries the article text, but only the title and link are used
  { id: "theinformation", name: "The Information", lang: "en", kind: "rss", url: "https://www.theinformation.com/feed", paywalled: true },
  // no tech-only feed: this covers all news, and the AI step keeps the technology items
  { id: "axios", name: "Axios", lang: "en", kind: "rss", url: "https://api.axios.com/feed/" },
  // the only feed that works covers every section; the Tech category is picked out of it
  {
    id: "business-insider",
    name: "Business Insider",
    lang: "en",
    kind: "rss",
    url: "https://feeds.businessinsider.com/custom/all",
    categories: ["Tech"],
  },
  { id: "tmtpost", name: "钛媒体", lang: "zh", kind: "rss", url: "https://www.tmtpost.com/rss.xml" },
  // the bare 36kr.com/feed sits behind a bot check; the www host serves the public feed
  { id: "36kr", name: "36氪", lang: "zh", kind: "rss", url: "https://www.36kr.com/feed" },
  { id: "huxiu", name: "虎嗅", lang: "zh", kind: "html", url: "https://www.huxiu.com/" },
];
