import type { Metadata } from "next";
import { TermsPage } from "../../terms-content";

export const metadata: Metadata = {
  title: "Terms of Service · uctechne",
  alternates: { canonical: "/en/terms", languages: { ko: "/terms", en: "/en/terms" } },
};

export default function Page() {
  return <TermsPage lang="en" />;
}
