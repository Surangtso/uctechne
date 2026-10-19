import { OG_DESCRIPTION, OG_SIZE, OG_TITLE, OG_VERSION, ogImage } from "@/lib/og";

// same picture for X (Twitter) cards
export function generateImageMetadata() {
  return [{ id: OG_VERSION, size: OG_SIZE, contentType: "image/png", alt: `${OG_TITLE} - ${OG_DESCRIPTION}` }];
}

export default function TwitterImage() {
  return ogImage();
}
