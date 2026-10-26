import type { Lang } from "./i18n";

const rtf = { ko: new Intl.RelativeTimeFormat("ko", { numeric: "auto" }), en: new Intl.RelativeTimeFormat("en", { numeric: "auto" }) };
const JUST_NOW = { ko: "방금 전", en: "just now" };

export function timeAgo(iso: string, now = Date.now(), lang: Lang = "ko"): string {
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return JUST_NOW[lang];
  if (abs < 3600) return rtf[lang].format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf[lang].format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf[lang].format(Math.round(diffSec / 86400), "day");
  return new Intl.DateTimeFormat(lang, { timeZone: "Asia/Seoul", dateStyle: "medium" }).format(new Date(iso));
}
