import { readFile } from "node:fs/promises";
import path from "node:path";

// the site's main dark blue (same as --accent in globals.css) on the light page tone
export const LOGO_COLOR = "#120a8f";
export const LOGO_BACKGROUND = "#f4f9ff";

// Arimo SemiBold Italic, Latin subset (SIL OFL; the license sits next to it in assets/).
// "use cache" makes the file read part of the build, so the icon routes are generated once, not per request.
export async function logoFont() {
  "use cache";
  const file = await readFile(path.join(process.cwd(), "assets", "Arimo-SemiBoldItalic-latin.woff"));
  const data = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  return [{ name: "Arimo", data, style: "italic" as const, weight: 600 as const }];
}

// U sits in the second quadrant (top left) and C in the fourth (bottom right) of a square tile.
// Styles are inline and flex-only because next/og (satori) does not read CSS classes.
export function Logo({ size }: { size: number }) {
  const font = size * 0.68;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${size * 0.1}px ${size * 0.12}px`,
        background: LOGO_BACKGROUND,
        borderRadius: size * 0.22,
        color: LOGO_COLOR,
        fontFamily: "Arimo",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: font,
        lineHeight: 0.7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-start" }}>U</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>C</div>
    </div>
  );
}
