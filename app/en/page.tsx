import type { Metadata } from "next";
import Home from "../home";

export const metadata: Metadata = {
  title: "uctechne",
  description: "Tech news from US and Chinese media in one place, translated into English.",
  openGraph: { type: "website", siteName: "uctechne", title: "uctechne", description: "Ride the wave first.", locale: "en_US", url: "/en" },
  alternates: { canonical: "/en", languages: { ko: "/", en: "/en" } },
};

export default function Page({ searchParams }: { searchParams: Parameters<typeof Home>[0]["searchParams"] }) {
  return <Home lang="en" searchParams={searchParams} />;
}
