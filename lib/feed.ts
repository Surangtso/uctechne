import { cacheLife, cacheTag } from "next/cache";
import { listBriefings, listPublic } from "./store";

// the update job runs every few hours, so a few minutes of staleness is invisible to readers
export async function getFeed(sourceId: string | undefined, limit: number, lang: "ko" | "en" = "ko") {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("feed"); // curated posts call updateTag("feed") so they show up without waiting
  return listPublic({ sourceId, limit, lang });
}

// one new briefing a week, so an hour of staleness costs nothing
export async function getBriefings(lang: "ko" | "en") {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("briefings");
  return listBriefings(lang);
}
