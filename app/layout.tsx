import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// simplified Chinese (titles from 36Kr, TMTPost, Huxiu); Hangul is not in this font and falls through to Noto Sans KR
const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
    <html lang="ko" className={`${notoSansKr.variable} ${notoSansSc.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
