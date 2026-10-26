"use server";

import { listByIds } from "@/lib/store";

// Scraps are kept in the reader's browser, so the page sends their ids here to get the articles back
export async function loadSaved(ids: string[]) {
  const clean = ids.filter((x) => /^[0-9a-f]{16}$/.test(x)).slice(0, 200);
  return clean.length ? listByIds(clean) : [];
}
