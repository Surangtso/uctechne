import { ImageResponse } from "next/og";
import { Logo } from "@/lib/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS fills a transparent home-screen icon with black, so this one keeps a light background
export default function AppleIcon() {
  return new ImageResponse(<Logo size={size.width} background="#f4f9ff" />, size);
}
