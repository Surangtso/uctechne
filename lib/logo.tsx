import { LOGO_C, LOGO_U } from "./logo-paths";

// the gradient ramp: light indigo, then the site's #120a8f, then deep navy
export const LOGO_STOPS = [
  { offset: 0, color: "#3b30d6" },
  { offset: 0.55, color: "#120a8f" },
  { offset: 1, color: "#0a0560" },
];

// A 100 x 100 drawing: U in the second quadrant (top left), C in the fourth (bottom right).
// The letters are Verdana Bold Italic outlines (see scripts/make-logo-paths.mjs), filled with a gradient
// built on the site's main dark blue, #120a8f, which sits in the middle of the ramp.
// Without `background` the logo is transparent. Inline SVG so next/og can render it.
export function Logo({ size, background }: { size: number; background?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="uc" gradientUnits="userSpaceOnUse" x1="7" y1="7" x2="93" y2="93">
          {LOGO_STOPS.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      {background ? <rect width="100" height="100" fill={background} /> : null}
      <path d={LOGO_U} fill="url(#uc)" />
      <path d={LOGO_C} fill="url(#uc)" />
    </svg>
  );
}
