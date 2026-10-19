import { ImageResponse } from "next/og";
import { LOGO_STOPS } from "./logo";
import { LOGO_C, LOGO_U } from "./logo-paths";
import { OG_DESC, OG_WORDMARK } from "./og-paths";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TITLE = "uctechne";
export const OG_DESCRIPTION = "기술의 큰 흐름에 가장 먼저 올라타기";

const BACKGROUND = "#ebf3fc"; // light sky blue
const TITLE_COLOR = "#120a8f"; // the site's main dark blue
const TEXT_COLOR = "#2a1f1a"; // same as the page tagline

// Left: the logo. Right: the wordmark and the two-line description, centered vertically as one block.
// Everything is vector outlines (see scripts/make-og-paths.mjs), so no font is loaded when this renders.
export function ogImage() {
  const LOGO = 340;
  const logoX = 100;
  const textX = 540;
  const gap = 56; // wordmark baseline to the top of the description
  const descAscent = 44; // first description baseline below that
  const lineHeight = 76;
  const blockH = OG_WORDMARK.capHeight + gap + descAscent + lineHeight + 12;
  const titleBaseline = (OG_SIZE.height - blockH) / 2 + OG_WORDMARK.capHeight;
  const firstBaseline = titleBaseline + gap + descAscent;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg width={OG_SIZE.width} height={OG_SIZE.height} viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="uc" gradientUnits="userSpaceOnUse" x1="7" y1="7" x2="93" y2="93">
              {LOGO_STOPS.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
          </defs>
          <rect width={OG_SIZE.width} height={OG_SIZE.height} fill={BACKGROUND} />
          <g transform={`translate(${logoX} ${(OG_SIZE.height - LOGO) / 2}) scale(${LOGO / 100})`}>
            <path d={LOGO_U} fill="url(#uc)" />
            <path d={LOGO_C} fill="url(#uc)" />
          </g>
          <g transform={`translate(${textX} ${titleBaseline})`}>
            <path d={OG_WORDMARK.d} fill={TITLE_COLOR} />
          </g>
          {OG_DESC.map((line, i) => (
            <g key={i} transform={`translate(${textX} ${firstBaseline + i * lineHeight})`}>
              <path d={line.d} fill={TEXT_COLOR} />
            </g>
          ))}
        </svg>
      </div>
    ),
    OG_SIZE,
  );
}
