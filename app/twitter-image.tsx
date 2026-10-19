import { OG_DESCRIPTION, OG_TITLE, ogImage } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${OG_TITLE} - ${OG_DESCRIPTION}`;

// same picture for X (Twitter) cards
export default function TwitterImage() {
  return ogImage();
}
