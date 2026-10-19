import { ImageResponse } from "next/og";
import { Logo, logoFont } from "@/lib/logo";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// browser tab icon
export default async function Icon() {
  return new ImageResponse(<Logo size={size.width} />, { ...size, fonts: await logoFont() });
}
