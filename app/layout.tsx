import type { Metadata } from "next";
// Self-hosted from npm (unicode-range slices), so the build never fetches fonts from Google.
// Hangul comes from the KR font; Chinese characters from the SC font. Verdana (Latin) is set in globals.css.
import "@fontsource-variable/noto-sans-kr";
import "@fontsource-variable/noto-sans-sc";
// Arial-compatible with a variable weight, for the English filter chips (Arial itself has no medium weight)
import "@fontsource-variable/arimo";
import "./globals.css";

const PREVIEW_TITLE = "uctechne";
const PREVIEW_DESCRIPTION = "기술의 큰 흐름에 가장 먼저 올라타기";

export const metadata: Metadata = {
  // absolute base for the share-preview image URLs; change it when the site gets its own domain
  metadataBase: new URL("https://uctechne.vercel.app"),
  title: "uctechne",
  description: "미국·중국 테크 미디어 기사를 한 곳에서 확인할 수 있습니다.",
  // what link previews (KakaoTalk, Facebook, Slack, ...) show; the image is app/opengraph-image.tsx
  openGraph: {
    type: "website",
    siteName: PREVIEW_TITLE,
    title: PREVIEW_TITLE,
    description: PREVIEW_DESCRIPTION,
    locale: "ko_KR",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: PREVIEW_TITLE, description: PREVIEW_DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
