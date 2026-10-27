import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { ContactEmail } from "./contact-email";

export type Section = { h: string; p?: string; li?: string[]; contact?: string };
export type LegalDoc = { title: string; back: string; effective: string; intro: string; sections: Section[] };

export function LegalPage({ lang, doc: d }: { lang: Lang; doc: LegalDoc }) {
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
