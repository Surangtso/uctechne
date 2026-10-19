import { cacheLife } from "next/cache";
import { listPublic } from "./store";

// the update job runs every few hours, so a few minutes of staleness is invisible to readers
export async function getFeed(sourceId: string | undefined, limit: number) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return listPublic({ sourceId, limit });
}
