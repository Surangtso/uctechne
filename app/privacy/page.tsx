import type { Metadata } from "next";
import { PrivacyPage } from "../privacy-content";

export const metadata: Metadata = {
  title: "개인정보 처리방침 · uctechne",
  alternates: { canonical: "/privacy", languages: { ko: "/privacy", en: "/en/privacy" } },
};

export default function Page() {
  return <PrivacyPage lang="ko" />;
}
