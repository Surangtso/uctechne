import { OG_DESCRIPTION, OG_TITLE, ogImage } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${OG_TITLE} - ${OG_DESCRIPTION}`;

// the picture shown when the link is shared (KakaoTalk, Facebook, Slack, Telegram, ...)
export default function OpengraphImage() {
  return ogImage();
}
