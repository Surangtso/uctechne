import { ImageResponse } from "next/og";
import { OG_MARK, OG_TAGLINE } from "./og-paths";

export const OG_SIZE = { width: 1200, height: 630 };
// Part of the image URL (/opengraph-image/<version>). KakaoTalk, Facebook and others remember a preview by its URL,
// so raise this every time the picture changes, or they keep showing the old one.
export const OG_VERSION = "v3";
export const OG_TITLE = "uctechne";
export const OG_DESCRIPTION = "Ride the wave first.";

const BACKGROUND = "#f4f9ff"; // the page background
const INK = "#1c2430";

// "UC" in bold Arial with "Ride the wave first." under it, both centered, on the page background.
// Everything is vector outlines (see scripts/make-og-paths.mjs), so no font is loaded when this renders.
export function ogImage() {
  const gap = 70; // space between the baseline of UC and the top of the tagline
  const blockH = OG_MARK.capHeight + gap + OG_TAGLINE.capHeight;
  const markBaseline = (OG_SIZE.height - blockH) / 2 + OG_MARK.capHeight;
  const tagBaseline = markBaseline + gap + OG_TAGLINE.capHeight;
  // center each line by its visible ink, not by the font's side spacing
  const centerX = (ink: { x1: number; x2: number }) => (OG_SIZE.width - (ink.x2 - ink.x1)) / 2 - ink.x1;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg width={OG_SIZE.width} height={OG_SIZE.height} viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`} xmlns="http://www.w3.org/2000/svg">
          <rect width={OG_SIZE.width} height={OG_SIZE.height} fill={BACKGROUND} />
          <g transform={`translate(${centerX(OG_MARK)} ${markBaseline})`}>
            <path d={OG_MARK.d} fill={INK} />
          </g>
          <g transform={`translate(${centerX(OG_TAGLINE)} ${tagBaseline})`}>
            <path d={OG_TAGLINE.d} fill={INK} />
          </g>
        </svg>
      </div>
    ),
    OG_SIZE,
  );
}
