import { ImageResponse } from "next/og";
import { Logo } from "@/lib/logo";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// browser tab icon: transparent background
export default function Icon() {
  return new ImageResponse(<Logo size={size.width} />, size);
}
