"use client";

import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { useNav, type View } from "@/hooks/use-nav";
import { CONSENT_REOPEN_EVENT } from "@/components/CookieConsent";
// P3-10/م4 (Phase 217): the About page's library sizes derive from the
// shared count constants (client-safe slices — never the giant arrays),
// so the copy grows with the libraries instead of aging silently.
// SITE-CONTENT-281: the literals moved to site-content/static-pages.ts
// (the {exercises}/{foods} tokens carry the live counts there) and the
// page renders admin overrides with those defaults as the fallback.
import {
  resolveFaqPage,
  resolveStaticPage,
} from "@/lib/site-content/static-pages";
import type { SiteCopyMap, StaticSection } from "@/lib/site-content/core";

// P3-10/م4 note: the EX_LIB/FOOD_LIB count interpolation now lives as
// {exercises}/{foods} tokens inside site-content/static-pages.ts — the
// counts themselves still derive from these shared slices via the token
// engine, so the copy still grows with the libraries.

export function StaticPageView({
  page,
  content,
}: {
  page: "about" | "privacy" | "terms" | "faq";
  content?: SiteCopyMap;
}) {
  const { t, lang } = useI18n();
  const { navigate } = useNav();
  const isAr = lang === "ar";

  // SITE-CONTENT-281: admin overrides (fetched by the server route and
  // passed down) win; the code defaults in site-content/static-pages.ts
  // are the eternal fallback — a missing/broken row can never blank the
  // page (the fallback law).
  // PRIORITY-PAGES Implementation (2026-10-19, audit §E-2): FAQ items may
  // now carry optional destination links — passed into the section so
  // each answer ends with its chips (the existing static-page links
  // renderer, zero new UI).
  const pageContent: { title: string; sections: StaticSection[] } =
    page === "faq"
      ? {
          title: resolveFaqPage(content, isAr).title,
          sections: resolveFaqPage(content, isAr).items.map((f) => ({
            heading: f.q,
            paragraphs: [f.a],
            links: f.links,
          })),
        }
      : resolveStaticPage(content, page, isAr);
  // The «last updated» line stays a live client-side date (existing
  // behavior, preserved verbatim through the content-system move).
  const updatedLine = `${isAr ? "آخر تحديث:" : "Last updated:"} ${new Date().toLocaleDateString(
    isAr ? "ar-EG" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  )}`;

  /* PHASE 144 (owner directive 2026-09-08 «المعايير العالمية»):
     GDPR withdrawal-as-easy-as-giving — one click on the privacy page
     clears the stored consent record and re-opens the site-wide banner
     (CookieConsent listens for CONSENT_REOPEN_EVENT). Same ease as the
     original Accept/Reject click. */
  const reopenCookieBanner = () => {
    try {
      localStorage.removeItem("mhe_cookie_consent");
    } catch {}
    window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    /* Phase 132 (owner feedback: «باقي الموقع إعادة التنسيق ليتبع هوية
       الصفحة الرئيسية»): static pages join the Marble & Chrome identity —
       token surfaces/text, marble-card FAQ box, chrome CTA. The old
       Apple-light palette (bg-white / #f5f5f7 / #0071e3 blue link) is
       retired. */
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 sm:px-6 md:py-28">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{pageContent.title}</h1>
        <p className="mt-3 text-sm font-normal text-[var(--muted-foreground)]">{updatedLine}</p>

        {(page === "about" || page === "faq") && (
          <div className="mt-6">
            <ShareButtons path={page === "about" ? "/about" : "/faq"} title={pageContent.title} />
          </div>
        )}

        <div className="mt-16 space-y-12">
          {pageContent.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
                {section.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {section.list && (
                  <ul className="mt-4 space-y-2 ps-5">
                    {section.list.map((item, j) => (
                      <li key={j} className="list-disc">{item}</li>
                    ))}
                  </ul>
                )}
                {section.links && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {section.links.map((l, j) => (
                      <a
                        key={j}
                        href={l.href}
                        className="seal-chip transition-transform duration-300 hover:-translate-y-0.5"
                      >
                        {l.label} <span className="rtl:rotate-180" aria-hidden="true">›</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* FAQ specific — marble-card + chrome CTA (identity) */}
        {page === "faq" && (
          <div className="marble-card mt-20 p-10 text-center">
            <p className="text-base font-normal text-[var(--muted-foreground)]">
              {isAr ? "لديك سؤال آخر؟" : "Have another question?"}
            </p>
            <button
              onClick={() => navigate("contact")}
              className="btn-outline mt-4 px-6 py-2.5 text-sm"
            >
              {isAr ? "تواصل معنا" : "Contact us"}
            </button>
          </div>
        )}

        {/* PHASE 144 — GDPR cookie-withdrawal CTA (privacy page only):
            clears the stored consent and re-opens the consent banner. */}
        {page === "privacy" && (
          <div className="marble-card mt-20 p-10 text-center">
            <p className="text-base font-normal text-[var(--muted-foreground)]">
              {isAr
                ? "هل تريد تغيير اختيارك لملفات تعريف الارتباط؟"
                : "Want to change your cookie choice?"}
            </p>
            <button
              onClick={reopenCookieBanner}
              className="btn-chrome mt-4 px-6 py-2.5 text-sm"
            >
              {isAr ? "إعدادات الكوكيز" : "Cookie settings"}
            </button>
          </div>
        )}
      </main>

      {/* Access-point fix (2026-09-14): the slim copyright line is replaced
          by the SHARED marble footer — about/faq/privacy/terms (+ their AR
          mirrors) now carry the same persistent link grid as the homepage,
          ending their isolation from the site's navigation. */}
      <SiteFooter />
 </div>
 );
}
