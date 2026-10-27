import type { Metadata } from "next";
import { PrivacyPage } from "../../privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy · uctechne",
  alternates: { canonical: "/en/privacy", languages: { ko: "/privacy", en: "/en/privacy" } },
};

export default function Page() {
  return <PrivacyPage lang="en" />;
}
