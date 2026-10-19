import { ImageResponse } from "next/og";
import { Logo, logoFont } from "@/lib/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon (also a good source for a larger preview of the logo)
export default async function AppleIcon() {
  return new ImageResponse(<Logo size={size.width} />, { ...size, fonts: await logoFont() });
}
