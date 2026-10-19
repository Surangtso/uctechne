import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "admin_session";
export const MAX_AGE = 60 * 60 * 24 * 7;

// The only credential is ADMIN_PASSWORD. With it unset, nobody can log in.
const password = () => process.env.ADMIN_PASSWORD ?? "";

// What the cookie holds: an HMAC keyed by the password, so changing the password logs everyone out.
export const sessionToken = () => createHmac("sha256", password()).update("admin-session-v1").digest("hex");

// compares fixed-length digests, so the check takes the same time wherever the strings differ
function same(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const passwordMatches = (candidate: string) => password() !== "" && same(candidate, password());

export async function isAdmin(): Promise<boolean> {
  if (!password()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && same(value, sessionToken());
}

// every server action is a public endpoint, so each one must check this itself
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("로그인이 필요합니다.");
}
