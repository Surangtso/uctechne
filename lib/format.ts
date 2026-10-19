const rtf = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

export function timeAgo(iso: string, now = Date.now()): string {
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return "방금 전";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  return new Intl.DateTimeFormat("ko", { timeZone: "Asia/Seoul", dateStyle: "medium" }).format(new Date(iso));
}
