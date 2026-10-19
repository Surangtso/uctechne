import { LOGO_C, LOGO_U } from "./logo-paths";

// the gradient ramp: light indigo, then the site's #120a8f, then deep navy
export const LOGO_STOPS = [
  { offset: 0, color: "#3b30d6" },
  { offset: 0.55, color: "#120a8f" },
  { offset: 1, color: "#0a0560" },
];

// How wide the gap is where C sits on top of U, in logo units (100 = the whole logo).
const CUT = 3;

// The drawing in a 100 x 100 box: U in the second quadrant (top left), C in the fourth (bottom right), the two
// overlapping a little. Both use the same gradient, so a thin gap is cut out of U around C; without it the
// overlap would merge into one blob. The letters are Verdana Bold Italic outlines (scripts/make-logo-paths.mjs).
// Returned as plain elements, to be placed inside an <svg> (used by the tab and iOS icons).
// (An array, not a React fragment: the image renderer cannot read fragments inside an <svg>.)
export function logoShapes() {
  return [
    <defs key="defs">
      <linearGradient id="uc" gradientUnits="userSpaceOnUse" x1="5" y1="5" x2="95" y2="95">
        {LOGO_STOPS.map((s) => (
          <stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </linearGradient>
      <mask id="uc-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect width="100" height="100" fill="#ffffff" />
        <path d={LOGO_C} fill="#000000" stroke="#000000" strokeWidth={CUT} strokeLinejoin="round" />
      </mask>
    </defs>,
    <path key="u" d={LOGO_U} fill="url(#uc)" mask="url(#uc-cut)" />,
    <path key="c" d={LOGO_C} fill="url(#uc)" />,
  ];
}

// Without `background` the logo is transparent. Inline SVG so next/og can render it.
export function Logo({ size, background }: { size: number; background?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {background ? <rect width="100" height="100" fill={background} /> : null}
      {logoShapes()}
    </svg>
  );
}
