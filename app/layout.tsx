import type { Metadata } from "next";
// Self-hosted from npm (unicode-range slices), so the build never fetches fonts from Google.
// Hangul comes from the KR font; Chinese characters from the SC font. Verdana (Latin) is set in globals.css.
import "@fontsource-variable/noto-sans-kr";
import "@fontsource-variable/noto-sans-sc";
import "./globals.css";

export const metadata: Metadata = {
  title: "US & China Tech News",
  description: "미국·중국 테크 미디어 기사를 한 곳에서 확인할 수 있습니다.",
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
