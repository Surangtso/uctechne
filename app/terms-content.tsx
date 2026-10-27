import type { Lang } from "@/lib/i18n";
import { LegalPage, type LegalDoc } from "./legal-page";

const DOC: Record<Lang, LegalDoc> = {
  ko: {
    title: "이용약관",
    back: "← 홈으로",
    effective: "시행일: 2026년 10월 27일",
    intro: "이 약관은 uctechne(이하 “서비스”)의 이용 조건과 운영자와 이용자의 권리·의무를 정합니다. 서비스를 이용하면 이 약관에 동의한 것으로 봅니다.",
    sections: [
      {
        h: "1. 서비스의 내용",
        p: "서비스는 미국과 중국 테크 미디어 기사의 제목, AI가 작성한 번역·요약, 원문 링크를 한곳에 모아 보여주고, 운영자가 직접 쓰는 큐레이션 글을 제공합니다. 기능은 바뀌거나 늘어날 수 있으며, 유료 기능을 도입하게 되면 시작하기 전에 알립니다.",
      },
      {
        h: "2. 계정",
        li: [
          "로그인은 Google 계정으로 하며 선택 사항입니다. 로그인하지 않아도 기사를 볼 수 있습니다.",
          "이용자는 자신의 계정을 직접 관리해야 하며, 다른 사람이 쓰게 해서는 안 됩니다.",
          "계정 삭제는 언제든 아래 문의 이메일로 요청할 수 있습니다. 처리 방식은 개인정보 처리방침을 따릅니다.",
        ],
      },
      {
        h: "3. 콘텐츠와 저작권",
        li: [
          "각 기사의 저작권은 해당 매체와 작성자에게 있습니다. 서비스는 제목, 짧은 요약, 원문 링크만 보여줍니다.",
          "운영자가 직접 쓴 큐레이션 글과 서비스의 디자인·로고의 저작권은 운영자에게 있습니다.",
          "이용자는 서비스의 콘텐츠를 운영자의 허락 없이 복제·배포하거나 영리 목적으로 쓸 수 없습니다. 개인적인 열람과 링크 공유는 자유롭게 할 수 있습니다.",
        ],
      },
      {
        h: "4. AI 번역·요약에 대한 안내",
        p: "번역과 요약은 AI가 쓰며 오류가 있을 수 있습니다. 서비스의 내용은 정보 제공이 목적이며 투자, 법률, 의료 등 중요한 판단의 근거가 아닙니다. 정확한 내용은 원문 링크에서 확인해 주세요.",
      },
      {
        h: "5. 이용자가 하지 말아야 할 일",
        li: [
          "서비스나 서버를 방해하거나 보안을 우회하려는 행위",
          "프로그램 등으로 서비스의 콘텐츠를 대량으로 수집하는 행위",
          "다른 사람의 계정·정보를 도용하거나 법령에 어긋나는 행위",
        ],
        p: "위 행위가 있으면 이용을 제한할 수 있습니다.",
      },
      {
        h: "6. 삭제·정정 요청",
        p: "매체나 저작권자는 자신의 콘텐츠의 삭제나 정정을 아래 이메일로 요청할 수 있습니다. 요청을 확인하는 대로 처리합니다.",
        contact: "삭제·정정 요청 이메일",
      },
      {
        h: "7. 서비스의 변경과 중단",
        p: "운영자는 운영상·기술상 필요에 따라 서비스를 바꾸거나 중단할 수 있습니다. 이용자에게 큰 영향이 있는 변경은 미리 알립니다.",
      },
      {
        h: "8. 책임의 제한",
        p: "서비스는 있는 그대로 제공됩니다. 운영자는 관련 법령이 허용하는 범위에서, 서비스의 내용을 믿고 한 판단이나 외부 링크의 내용, 서비스 중단으로 생긴 손해에 책임을 지지 않습니다. 다만 운영자의 고의나 중대한 과실로 생긴 손해와, 법령상 제한할 수 없는 이용자의 권리는 영향을 받지 않습니다.",
      },
      {
        h: "9. 준거법과 관할",
        p: "이 약관은 대한민국 법에 따라 해석되며, 분쟁이 생기면 민사소송법에 따른 관할 법원에서 해결합니다.",
      },
      {
        h: "10. 약관의 변경",
        p: "약관을 바꾸면 시행일 7일 전에 이 페이지에 알립니다. 이용자에게 불리한 변경은 시행일 30일 전에 알립니다.",
      },
      {
        h: "11. 운영자와 문의",
        p: "운영자: Subeen Jung (대한민국). 이 약관에 관한 문의는 아래 이메일로 보내 주세요.",
        contact: "문의 이메일",
      },
    ],
  },
  en: {
    title: "Terms of Service",
    back: "← Home",
    effective: "Effective: October 27, 2026",
    intro:
      "These terms set out the conditions for using uctechne (the “Service”) and the rights and duties of the operator and users. By using the Service you agree to them.",
    sections: [
      {
        h: "1. What the Service is",
        p: "The Service gathers headlines, AI-written translations and summaries, and links to the original articles of US and Chinese tech media in one place, and offers curated posts written by the operator. Features may change or grow; if paid features are introduced, we will say so before they start.",
      },
      {
        h: "2. Accounts",
        li: [
          "Signing in is optional and uses your Google account. You can read articles without signing in.",
          "You are responsible for your account and must not let others use it.",
          "You can ask for your account to be deleted at any time at the email below. How it is handled is described in the Privacy Policy.",
        ],
      },
      {
        h: "3. Content and copyright",
        li: [
          "Each article is copyrighted by its outlet and author. The Service shows only headlines, short summaries, and links to the original.",
          "The curated posts written by the operator, and the design and logo of the Service, are copyrighted by the operator.",
          "You may not copy, redistribute, or use the Service's content commercially without the operator's permission. Reading it yourself and sharing links are free.",
        ],
      },
      {
        h: "4. About AI translations and summaries",
        p: "Translations and summaries are written by AI and may contain errors. The Service is for information only and is not a basis for investment, legal, medical, or other important decisions. Please check the original article for accuracy.",
      },
      {
        h: "5. What you must not do",
        li: [
          "Interfere with the Service or its servers, or try to bypass its security",
          "Collect the Service's content in bulk with automated tools",
          "Use someone else's account or information, or break the law",
        ],
        p: "We may restrict use if this happens.",
      },
      {
        h: "6. Takedown and correction requests",
        p: "Outlets and rights holders can ask for their content to be removed or corrected by emailing the address below. We will act on a request as soon as we have checked it.",
        contact: "Takedown / correction requests",
      },
      {
        h: "7. Changes and discontinuation",
        p: "The operator may change or end the Service for operational or technical reasons. Changes that significantly affect users will be announced in advance.",
      },
      {
        h: "8. Limit of liability",
        p: "The Service is provided as is. To the extent the law allows, the operator is not liable for decisions made in reliance on the Service, the content of external links, or losses from interruption of the Service. This does not affect liability for the operator's intent or gross negligence, or any user rights that the law does not allow to be limited.",
      },
      {
        h: "9. Governing law",
        p: "These terms are governed by the laws of the Republic of Korea, and disputes are resolved in the court with jurisdiction under the Korean Civil Procedure Act.",
      },
      {
        h: "10. Changes to these terms",
        p: "If we change these terms, we will post the change on this page 7 days before it takes effect, or 30 days before if it is unfavorable to users.",
      },
      {
        h: "11. Operator and contact",
        p: "Operator: Subeen Jung (Republic of Korea). For questions about these terms, email the address below.",
        contact: "Contact email",
      },
    ],
  },
};

export const TermsPage = ({ lang }: { lang: Lang }) => <LegalPage lang={lang} doc={DOC[lang]} />;
