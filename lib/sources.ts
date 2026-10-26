import type { Source } from "./types";

export const regionOf = (s: Source): "us" | "cn" => s.region ?? (s.lang === "zh" ? "cn" : "us");

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
  // Wired and Ars Technica cover more than technology; the AI step keeps the technology items
  { id: "wired", name: "Wired", lang: "en", kind: "rss", url: "https://www.wired.com/feed/rss" },
  { id: "arstechnica", name: "Ars Technica", lang: "en", kind: "rss", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { id: "bloomberg-tech", name: "Bloomberg Technology", lang: "en", kind: "rss", url: "https://feeds.bloomberg.com/technology/news.rss" },
  { id: "cnbc-tech", name: "CNBC Tech", lang: "en", kind: "rss", url: "https://www.cnbc.com/id/19854910/device/rss/rss.html" },
  { id: "mit-tech-review", name: "MIT Technology Review", lang: "en", kind: "rss", url: "https://www.technologyreview.com/feed/" },
  { id: "engadget", name: "Engadget", lang: "en", kind: "rss", url: "https://www.engadget.com/rss.xml" },
  // newsletters: the feed holds the free part of each post, which is all that is read
  { id: "platformer", name: "Platformer", lang: "en", kind: "rss", url: "https://www.platformer.news/rss/" },
  { id: "big-technology", name: "Big Technology", lang: "en", kind: "rss", url: "https://www.bigtechnology.com/feed" },
  { id: "404-media", name: "404 Media", lang: "en", kind: "rss", url: "https://www.404media.co/rss/" },
  { id: "not-boring", name: "Not Boring", lang: "en", kind: "rss", url: "https://www.notboring.co/feed" },
  { id: "tmtpost", name: "钛媒体", lang: "zh", kind: "rss", url: "https://www.tmtpost.com/rss.xml" },
  // the bare 36kr.com/feed sits behind a bot check; the www host serves the public feed
  { id: "36kr", name: "36氪", lang: "zh", kind: "rss", url: "https://www.36kr.com/feed" },
  { id: "huxiu", name: "虎嗅", lang: "zh", kind: "html", url: "https://www.huxiu.com/", linkPattern: "/article/(\\d+)\\.html" },
  // LatePost is mostly subscriber-only, so titles only. Its server sends an incomplete certificate chain that ends
  // at Let's Encrypt's new Root YR (certs/isrg-root-yr.pem, from letsencrypt.org/certs/gen-y/root-yr.pem), which
  // Node does not trust yet. The front page has no dates, so only the 20 newest ids are taken.
  {
    id: "latepost",
    name: "晚点",
    lang: "zh",
    kind: "html",
    url: "https://www.latepost.com/",
    linkPattern: "/news/dj_detail\\?id=(\\d+)",
    keepLatest: 20,
    paywalled: true,
    trustCa: "certs/isrg-root-yr.pem",
  },
  // article pages are drawn by script, so there is no text to read: titles only (newest 20 ids, as there are no dates)
  {
    id: "jazzyear",
    name: "甲子光年",
    lang: "zh",
    kind: "html",
    url: "https://www.jazzyear.com/",
    linkPattern: "/article_info\\.html\\?id=(\\d+)",
    titleSelector: ".title, .article-title",
    keepLatest: 20,
    headlineOnly: true,
  },
  // Waves publishes on Tencent News (news.qq.com/omn/author/8QIf3n9a7oYauzjc5QE%3D); this is the list that page loads
  {
    id: "waves",
    name: "暗涌",
    lang: "zh",
    kind: "qq",
    url: "https://i.news.qq.com/getSubNewsMixedList?guestSuid=8QIf3n9a7oYauzjc5QE%3D&tabId=om_article&caller=1&from_scene=103&offset_info=",
  },
  // AI-focused outlets
  {
    id: "jiqizhixin",
    name: "机器之心",
    lang: "zh",
    kind: "jiqizhixin",
    url: "https://www.jiqizhixin.com/api/article_library/articles.json?sort=time&page=1&per=20",
  },
  { id: "aiera", name: "新智元", lang: "zh", kind: "rss", url: "https://aiera.com.cn/feed" },
  { id: "qbitai", name: "量子位", lang: "zh", kind: "rss", url: "https://www.qbitai.com/feed" },
  { id: "zhidx", name: "智东西", lang: "zh", kind: "rss", url: "https://zhidx.com/rss" },
  { id: "leiphone", name: "雷峰网", lang: "zh", kind: "rss", url: "https://www.leiphone.com/feed" },
  // English-language outlets covering China, listed with the Chinese ones
  // no feed: article links from the front page, the date and blurb from each article page
  {
    id: "krasia",
    name: "KrASIA",
    lang: "en",
    region: "cn",
    kind: "html",
    url: "https://kr-asia.com/",
    linkPattern: "kr-asia\\.com/([a-z0-9][a-z0-9-]{24,})$",
  },
  // the feed holds years of articles, newest first
  { id: "technode", name: "TechNode", lang: "en", region: "cn", kind: "rss", url: "https://technode.com/feed/", keepLatest: 30 },
  { id: "pandaily", name: "Pandaily", lang: "en", region: "cn", kind: "rss", url: "https://pandaily.com/feed/" },
  { id: "scmp-tech", name: "SCMP Tech", lang: "en", region: "cn", kind: "rss", url: "https://www.scmp.com/rss/36/feed" },
  { id: "rest-of-world", name: "Rest of World", lang: "en", region: "cn", kind: "rss", url: "https://restofworld.org/feed/" },
  { id: "geekpark", name: "极客公园", lang: "zh", kind: "rss", url: "https://www.geekpark.net/rss" },
  { id: "ifanr", name: "爱范儿", lang: "zh", kind: "rss", url: "https://www.ifanr.com/feed" },
  // no feed: article links from the front page, the date and text from each article page
  { id: "pingwest", name: "品玩", lang: "zh", kind: "html", url: "https://www.pingwest.com/", linkPattern: "pingwest\\.com/a/(\\d+)" },
  // many items are not technology (apps, lifestyle); the AI step keeps the technology ones
  { id: "sspai", name: "少数派", lang: "zh", kind: "rss", url: "https://sspai.com/feed" },
  { id: "ithome", name: "IT之家", lang: "zh", kind: "rss", url: "https://www.ithome.com/rss/" },
  { id: "jiemian", name: "界面新闻", lang: "zh", kind: "rss", url: "https://a.jiemian.com/index.php?m=article&a=rss" },
  { id: "cyzone", name: "创业邦", lang: "zh", kind: "rss", url: "https://www.cyzone.cn/rss/" },
  // front page only; the date and blurb come from each article page
  { id: "pedaily", name: "投资界", lang: "zh", kind: "html", url: "https://www.pedaily.cn/", linkPattern: "pedaily\\.cn/\\d{6}/(\\d+)\\.shtml" },
];
