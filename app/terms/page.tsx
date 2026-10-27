import type { Metadata } from "next";
import { TermsPage } from "../terms-content";

export const metadata: Metadata = {
  title: "이용약관 · uctechne",
  alternates: { canonical: "/terms", languages: { ko: "/terms", en: "/en/terms" } },
};

export default function Page() {
  return <TermsPage lang="ko" />;
}
