import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { ContactEmail } from "./contact-email";

type Section = { h: string; p?: string; li?: string[]; contact?: string };

const DOC: Record<Lang, { title: string; back: string; effective: string; intro: string; sections: Section[] }> = {
  ko: {
    title: "개인정보 처리방침",
    back: "← 홈으로",
    effective: "시행일: 2026년 10월 27일",
    intro:
      "uctechne(이하 “서비스”)는 이용자의 개인정보를 소중히 다루며 개인정보 보호법을 따릅니다. 로그인하지 않아도 모든 기사를 볼 수 있으며, 로그인은 선택입니다.",
    sections: [
      {
        h: "1. 수집하는 항목",
        li: [
          "Google 로그인 시: 이메일 주소, 이름, 프로필 사진 주소(Google이 제공), 계정 식별값, 로그인 시각",
          "방문 시: Vercel Web Analytics가 쿠키 없이 방문한 페이지, 유입 경로, 국가, 브라우저·기기 종류를 집계 형태로 수집합니다. 개인을 식별하지 않습니다.",
          "스크랩: 이용자의 브라우저에만 저장되며 서버에 저장하지 않습니다. 스크랩 목록을 보여줄 때 기사 번호가 서버로 전송되지만 이용자와 연결하거나 저장하지 않습니다.",
        ],
      },
      {
        h: "2. 이용 목적",
        li: ["로그인과 계정 식별", "문의·삭제 요청 응대", "서비스 이용 통계와 개선"],
        p: "새로운 목적으로 이용하게 되면 먼저 이 방침을 고쳐 알립니다.",
      },
      {
        h: "3. 보유 및 이용 기간",
        p: "로그인 정보는 이용자가 삭제를 요청할 때까지 보관하며, 요청을 받으면 지체 없이 파기합니다. 법령에 따라 보존해야 하는 정보는 해당 기간 동안 보관합니다.",
      },
      {
        h: "4. 제3자 제공과 처리 위탁·국외 이전",
        p: "이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 서비스 운영을 위해 아래 업체의 서비스를 이용하며, 이 과정에서 개인정보가 해외(일본, 미국 등) 서버에서 처리될 수 있습니다.",
        li: [
          "Supabase: 로그인 인증과 데이터 저장 (이메일, 이름, 프로필 사진 주소, 계정 식별값). 데이터는 일본 도쿄 리전에 저장됩니다.",
          "Google(미국 등): 로그인 인증",
          "Vercel(미국 등): 웹사이트 호스팅과 방문 통계 (집계 정보)",
        ],
      },
      {
        h: "5. 이용자의 권리와 삭제 방법",
        p: "이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요청할 수 있습니다. 아래 이메일로 요청해 주세요. 본인 확인을 위해 로그인에 사용한 Google 계정의 이메일로 보내 주시면 됩니다.",
        contact: "문의·삭제 요청 이메일",
      },
      {
        h: "6. 로컬 저장소",
        p: "로그인 상태 유지와 스크랩 저장을 위해 브라우저의 저장소를 사용합니다. 브라우저 설정에서 언제든 삭제할 수 있으며, 삭제하면 로그아웃되고 스크랩 목록이 사라집니다.",
      },
      {
        h: "7. 안전성 확보 조치",
        p: "전송 구간은 HTTPS로 암호화하고, 데이터베이스 관리 키는 서버에서만 사용하며, 접근 권한을 운영자로 제한합니다.",
      },
      { h: "8. 만 14세 미만", p: "만 14세 미만은 로그인 기능을 이용할 수 없습니다." },
      { h: "9. 방침의 변경", p: "이 방침을 바꾸면 시행일과 함께 이 페이지에 알립니다." },
      {
        h: "10. 운영자 및 개인정보 보호책임자",
        p: "운영자 및 개인정보 보호책임자: Subeen Jung (대한민국). 개인정보와 관련한 문의, 열람·정정·삭제 요청은 아래 이메일로 보내 주세요.",
        contact: "문의 이메일",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    back: "← Home",
    effective: "Effective: October 27, 2026",
    intro:
      "uctechne (the “Service”) handles personal information with care. You can read every article without signing in; signing in is optional.",
    sections: [
      {
        h: "1. What we collect",
        li: [
          "When you sign in with Google: your email address, name, profile picture URL (provided by Google), an account identifier, and the time you signed in.",
          "When you visit: Vercel Web Analytics collects aggregate data without cookies: pages viewed, referrer, country, and browser or device type. It does not identify individuals.",
          "Saved articles: kept only in your browser and not stored on our servers. When your saved list is shown, article IDs are sent to the server, but they are not stored or linked to you.",
        ],
      },
      {
        h: "2. Why we use it",
        li: ["To sign you in and identify your account", "To answer questions and deletion requests", "To measure and improve the Service"],
        p: "If we start using it for a new purpose, we will update this policy first.",
      },
      {
        h: "3. How long we keep it",
        p: "We keep sign-in information until you ask us to delete it, and delete it promptly after your request. Information we are legally required to keep is held for the period the law requires.",
      },
      {
        h: "4. Sharing and service providers",
        p: "We do not sell or give your personal information to third parties. To run the Service we use the providers below, so your information may be processed on servers outside Korea, including in Japan and the United States.",
        li: [
          "Supabase: sign-in authentication and data storage (email, name, profile picture URL, account identifier). Data is stored in the Tokyo, Japan region.",
          "Google (United States and elsewhere): sign-in authentication",
          "Vercel (United States and elsewhere): website hosting and visit statistics (aggregate data)",
        ],
      },
      {
        h: "5. Your rights and how to delete your data",
        p: "You can ask at any time to access, correct, or delete your personal information, or to stop its processing. Email us at the address below. To verify it is you, please write from the email of the Google account you used to sign in.",
        contact: "Privacy and deletion requests",
      },
      {
        h: "6. Browser storage",
        p: "We use your browser storage to keep you signed in and to hold saved articles. You can clear it in your browser settings; doing so signs you out and removes your saved list.",
      },
      {
        h: "7. Security",
        p: "Data in transit is encrypted with HTTPS, the database admin key is used only on the server, and access is limited to the operator.",
      },
      { h: "8. Children", p: "Sign-in is not available to anyone under 14." },
      { h: "9. Changes", p: "If we change this policy, we will post the new version here with its effective date." },
      {
        h: "10. Operator and privacy contact",
        p: "Operator and privacy officer: Subeen Jung (Republic of Korea). For any privacy question, or to access, correct, or delete your information, email the address below.",
        contact: "Contact email",
      },
    ],
  },
};

export function PrivacyPage({ lang }: { lang: Lang }) {
  const d = DOC[lang];
  return (
    <div lang={lang} className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href={lang === "en" ? "/en" : "/"} className="text-sm text-tagline hover:text-accent">
        {d.back}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-xs text-muted">{d.effective}</p>
      <p className="mt-6 text-sm leading-relaxed">{d.intro}</p>
      {d.sections.map((s) => (
        <section key={s.h} className="mt-7">
          <h2 className="text-base font-semibold">{s.h}</h2>
          {s.p && <p className="mt-2 text-sm leading-relaxed text-tagline">{s.p}</p>}
          {s.li && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-tagline">
              {s.li.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          {s.contact && (
            <p className="mt-3 text-sm text-tagline">
              <ContactEmail label={s.contact} />
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
