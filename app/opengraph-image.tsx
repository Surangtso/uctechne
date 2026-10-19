import { OG_DESCRIPTION, OG_SIZE, OG_TITLE, OG_VERSION, ogImage } from "@/lib/og";

// the picture shown when the link is shared (KakaoTalk, Facebook, Slack, Telegram, ...)
export function generateImageMetadata() {
  return [{ id: OG_VERSION, size: OG_SIZE, contentType: "image/png", alt: `${OG_TITLE} - ${OG_DESCRIPTION}` }];
}

export default function OpengraphImage() {
  return ogImage();
}
