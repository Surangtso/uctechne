"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { COOKIE, MAX_AGE, passwordMatches, requireAdmin, sessionToken } from "@/lib/admin";
import { draftCuration, type Draft } from "@/lib/curate";
import { deleteCurated, insertCurated, type CuratedInput } from "@/lib/store";

export async function login(formData: FormData) {
  const candidate = String(formData.get("password") ?? "");
  // slows down guessing; the comparison itself is constant-time
  await new Promise((r) => setTimeout(r, 800));
  if (!passwordMatches(candidate)) redirect("/admin?error=1");
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
  redirect("/admin");
}

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.",
});

export async function draftAction(input: { text: string; platform: string; author: string }): Promise<ActionResult<Draft>> {
  try {
    await requireAdmin();
    return { ok: true, data: await draftCuration(input) };
  } catch (e) {
    return fail(e);
  }
}

function validUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

export async function publishAction(input: CuratedInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!validUrl(input.url)) return { ok: false, error: "원문 링크가 올바른 주소가 아닙니다." };
    if (!input.titleKo.trim()) return { ok: false, error: "한국어 제목을 입력해주세요." };
    if (!input.sourceLabel.trim()) return { ok: false, error: "출처(플랫폼)를 입력해주세요." };
    await insertCurated({ ...input, url: input.url.trim() });
    updateTag("feed"); // the feed is cached for minutes; this shows the new post right away
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteCurated(id);
    updateTag("feed");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
