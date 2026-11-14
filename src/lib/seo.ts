/**
 * SEO Utilities — structured data (JSON-LD) for search engines + AI.
 *
 * This file centralizes all structured data schemas so they're consistent
 * across pages. Each function returns a JSON-LD object that can be injected
 * into a page's <script type="application/ld+json"> tag.
 *
 * Schemas included:
 *   - Organization (site-wide, with founder Person — Phase SEO-GEO-2)
 *   - WebSite (site-wide, with SearchAction)
 *   - Service (for coaching page)
 *   - FAQPage (⚠️ DEPRECATED — Google retired rich results May 2026)
 *   - BreadcrumbList (for navigation)
 *   - HowTo (⚠️ DEPRECATED — Google retired rich results Sept 2023)
 *   - Article (for blog posts — with author Person + reviewedBy)
 *   - SoftwareApplication (for EVO AI coach)
 *   - ExerciseAction (for exercise detail pages)
 *   - ItemList (for list pages)
 *
 * Reference: docs/SEO-SCHEMA-REFERENCE.md (from claude-seo project)
 * Reference: docs/SEO-EEAT-FRAMEWORK.md (E-E-A-T signals)
 * Reference: docs/SEO-GEO-MASTER-PLAN.md §6 (content strategy)
 */

import { AHMED_ZAKE, getPersonSchema, type AuthorProfile } from "./authors";
import { SOCIAL_PROFILE_URLS } from "./social";

const SITE_URL = "https://alkemos.com";
const SITE_NAME = "Alkemos";
const SITE_LOGO = `${SITE_URL}/logo.png`;

/**
 * Serialize a JSON-LD object for <script type="application/ld+json">
 * injection (audit M7, 2026-09-07).
 *
 * `JSON.stringify` alone does NOT escape `</script>`: an admin/AI-authored
 * title or answer containing that sequence would break out of the script
 * element and inject markup into the page. Escaping `<` as `\u003c` makes
 * the payload inert inside a script context while staying valid JSON.
 * Use EVERYWHERE a schema is fed to dangerouslySetInnerHTML.
 */
export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * Organization schema — describes the company/site.
 * Used on all pages (in layout.tsx).
 *
 * Phase 117 completion (owner directive 2026-09-04): Organization is the
 * FINAL schema choice INSTEAD of LocalBusiness — the owner confirmed
 * there is no local business activity and the project is global.
 * Owner-required fields: name · url · logo · description (short version
 * of the homepage atomic answer) · sameAs. Deliberately NO address /
 * phone / geo fields. sameAs carries ONLY the canonical site URL: a
 * repo-wide search found no OWNED social profiles (facebook/twitter/t.me
 * hits are share-button targets, not profiles) — the owner said to add
 * social links "إن وجدت" (if found) and none exist. areaServed:
 * Worldwide + knowsLanguage stay (global reach, not local presence).
 *
 * Phase SEO-GEO-2 (2026-09-08): added `founder` Person field pointing
 * at the Ahmed Zake ProfilePage @id. This is a strong E-E-A-T signal —
 * it tells Google's Knowledge Graph that a real human stands behind
 * the organization, not just an anonymous brand. Pairs with the
 * `author` Person on every Article schema (getArticleSchema).
 *
 * Phase SEO-GEO-4.6 (2026-09-09): `sameAs` now carries the REAL owned
 * profiles (owner created them — §12.10 entity-building executed):
 * Trustpilot · Product Hunt · Facebook · Instagram · X, from the single
 * source src/lib/social.ts. This is the deferred technical attribution
 * step — it gives the Knowledge Graph the brand-entity links that
 * disambiguate Alkemos from the Alkimos suburb in brand queries.
 *
 * Phase SEO-GEO-6.2 (2026-09-12): LinkedIn added (owner-created, §12.21)
 * — sameAs now carries SIX owned profiles.
 *
 * §12.40 (P2-14, audit finding #9 — mixed-language schema): the
 * description is now LOCALE-AWARE. The audit verified the EN homepage
 * served an Arabic Organization description to English users and
 * machines. Root layout passes the resolved route locale: EN pages get
 * the English entity description (site's primary language), /ar/* pages
 * keep the Arabic one. The `lang` parameter is REQUIRED on purpose —
 * every caller must state the locale explicitly (compile-time safety
 * against a silent Arabic default leaking back onto EN surfaces).
 */
const ORG_DESCRIPTIONS: Record<"en" | "ar", string> = {
  en: "The complete digital training platform: 868+ exercises with photos, 8,162+ foods with nutrition data, ready-made programs, free tools, and personal coaching alongside the EVO AI engine.",
  ar: "منصة التدريب الرقمي المتكاملة: 868+ تمرينًا، 8,162+ صنفًا غذائيًا بالقيم الغذائية، برامج جاهزة، أدوات مجانية، وتدريب أونلاين مع مدرب خاص وذكاء اصطناعي EVO.",
};

export function getOrganizationSchema(lang: "en" | "ar") {
  const founderPerson = getPersonSchema(AHMED_ZAKE);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    description: ORG_DESCRIPTIONS[lang],
    sameAs: [SITE_URL, ...SOCIAL_PROFILE_URLS],
    areaServed: "Worldwide",
    knowsLanguage: ["ar", "en"],
    founder: founderPerson,
  };
}

/**
 * WebSite schema — describes the website with search action.
 * Enables Google sitelinks search box.
 *
 * §12.40 (P2-14, audit findings #8 + #9):
 *   - The description is LOCALE-AWARE (same law as getOrganizationSchema
 *     above): EN homepage gets the English description, /ar/* the Arabic
 *     one — the audit had verified the Arabic text on the EN homepage.
 *   - The SearchAction target /blog?search={search_term_string} is now
 *     FUNCTIONAL: BlogListPage seeds the ?search= param into its search
 *     state after hydration, so following the declared URL actually
 *     shows filtered results. The ?search= variant keeps its clean /blog
 *     canonical (search URLs are deliberately non-indexable — Google
 *     canonicalizes them; the audit's #8 finding is addressed by making
 *     the target honest, not by indexing it). Google retired the
 *     sitelinks search box itself in 2024 — the remaining value of this
 *     potentialAction is for AI engines and Bing-style surfaces that
 *     machine-read the schema and follow the URL.
 */
const WEBSITE_DESCRIPTIONS: Record<"en" | "ar", string> = {
  en: "A comprehensive sports platform: an exercise library, workout programs, fitness calculators, a food database, and a fitness blog.",
  ar: "منصة رياضية شاملة: مكتبة تمارين، برامج تدريب، حاسبات لياقة، مكتبة أطعمة، ومدونة رياضية.",
};

export function getWebSiteSchema(lang: "en" | "ar") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: WEBSITE_DESCRIPTIONS[lang],
    inLanguage: ["ar", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Service schema — for the coaching page.
 * Describes the coaching service without naming specific coaches.
 *
 * §12.53 item 3 (2026-09-15, deep-audit finding: Arabic JSON-LD on the
 * EN /coaching page): name/description are LOCALE-AWARE, same law as
 * getOrganizationSchema's ORG_DESCRIPTIONS above. The `lang` parameter
 * is REQUIRED on purpose — every caller must state the locale explicitly
 * (compile-time safety against a silent Arabic default leaking back onto
 * EN surfaces, the same class of bug P2-14 fixed for Organization/WebSite).
 */
const COACHING_SERVICE_TEXT: Record<
  "en" | "ar",
  { name: string; description: string }
> = {
  en: {
    name: "Online Coaching — Professional Coaches & Nutrition Specialists",
    description:
      "Online coaching with professional coaches and nutrition specialists: personalized meal and workout plans, weekly check-ins, manual swaps by your coach, and the EVO AI assistant available around the clock.",
  },
  ar: {
    name: "التدريب الأونلاين — مدربون وأخصائيو تغذية",
    description:
      "تدريب أونلاين مع مدربين وأخصائيي تغذية محترفين: خطط تغذية وتمارين مخصصة، متابعة أسبوعية، تبديلات يجريها المدرب بنفسه، ومدرّب ذكاء اصطناعي (EVO) متاح على مدار الساعة.",
  },
};

export function getCoachingServiceSchema(lang: "en" | "ar") {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: COACHING_SERVICE_TEXT[lang].name,
    serviceType: "Nutrition and Fitness Coaching",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: "Worldwide",
    description: COACHING_SERVICE_TEXT[lang].description,
    // Content-strategy v1 (2026-09-20): the visible page sells ONE
    // canonical Coaching membership ($39.99/mo, $359/yr — memberships.ts).
    // The old $20–$40 / 2-offer range advertised the retired Starter/Elite
    // products and contradicted the page (a copy-vs-implementation error).
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "39.99",
      url: `${SITE_URL}/coaching`,
      availability: "https://schema.org/InStock",
    },
    // Phase SEO-GEO-6.4 (§12.19 P0-5): the hardcoded aggregateRating
    // (4.8 / 500 reviews) was REMOVED — it had no visible review source,
    // which is a fabricated-signal risk on YMYL pages. Re-add ONLY with a
    // real, linkable review source (Trustpilot / app store) — §12.19 P1-7.
  };
}

/**
 * SoftwareApplication schema — for EVO AI coach.
 * Describes EVO as an AI application, not just a chatbot.
 *
 * §12.53 item 3 (2026-09-15, deep-audit finding: Arabic JSON-LD on the
 * EN /evo page): name/description/offers/featureList are LOCALE-AWARE,
 * same law as getOrganizationSchema's ORG_DESCRIPTIONS. The `lang`
 * parameter is REQUIRED on purpose (compile-time safety against a
 * silent Arabic default leaking back onto EN surfaces).
 */
const EVO_APPLICATION_TEXT: Record<
  "en" | "ar",
  {
    name: string;
    description: string;
    offerDescription: string;
    featureList: string[];
  }
> = {
  en: {
    name: "EVO — AI Coach",
    description:
      "EVO is an intelligent performance engine — not just a chatbot. It reads your health data and goal, builds personalized nutrition and workout plans, suggests smart meal and exercise swaps, and provides 24/7 fitness and nutrition consulting via AI.",
    offerDescription: "Free daily chat for everyone; plans and swaps with a subscription",
    featureList: [
      "Builds personalized nutrition and workout plans from your data",
      "Instant fitness and nutrition consulting 24/7",
      "Smart meal and exercise swaps (subscriber feature)",
      "Tracks your progress, weight, and measurements",
      "Free daily chat for visitors and members",
    ],
  },
  ar: {
    name: "EVO — المدرب الذكي",
    description:
      "EVO هو محرك أداء ذكي — ليس مجرد روبوت محادثة. يقرأ بياناتك الصحية وهدفك، يبني لك خطط تغذية وتمارين مخصصة، ويقترح تبديلات ذكية للوجبات والتمارين، ويوفر استشارات لياقة وتغذية على مدار الساعة عبر الذكاء الاصطناعي.",
    offerDescription: "محادثة يومية مجانية للجميع؛ والخطط والتبديلات مع الاشتراك",
    featureList: [
      "بناء خطط تغذية وتمارين مخصصة من بياناتك",
      "استشارات لياقة وتغذية فورية على مدار الساعة",
      "تبديل الوجبات والتمارين بذكاء (ميزة مشتركين)",
      "تتبع تقدمك ووزنك وقياساتك",
      "محادثة يومية مجانية للزوار والمشتركين",
    ],
  },
};

export function getEVOApplicationSchema(lang: "en" | "ar") {
  const text = EVO_APPLICATION_TEXT[lang];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: text.name,
    applicationCategory: "Health & Fitness Application",
    operatingSystem: "Web",
    description: text.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: text.offerDescription,
    },
    // Phase SEO-GEO-6.4 (§12.19 P0-5): hardcoded aggregateRating (4.9 /
    // 300) removed — same fabricated-signal law as the Service schema
    // above; re-enable only with a real, linkable review source.
    featureList: text.featureList,
  };
}

/**
 * WebApplication schema — for the six standalone tool pages
 * (§12.19 P1-6 "المعيار المزدوج": calculator.net-style reference
 * content + arvo-style schema density).
 *
 * SEO-SCHEMA-REFERENCE.md lists WebApplication under "Active: Recommend
 * freely" (browser-based SaaS). Localized per language (name/description/
 * featureList/inLanguage) so each URL serves its own-language entity —
 * the EN layout emits English, the AR mirror layout emits Arabic.
 *
 * Law: NO aggregateRating (P0-5 / §12.20 — fabricated signals removed;
 * re-enable only with a real, linkable review source).
 */
export function getToolWebApplicationSchema(params: {
  name: string;
  description: string;
  url: string;
  inLanguage: "en" | "ar";
  featureList: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: params.name,
    url: params.url,
    description: params.description,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Calculator",
    browserRequirements: "Requires JavaScript",
    inLanguage: params.inLanguage,
    isAccessibleForFree: true,
    featureList: params.featureList,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        params.inLanguage === "ar" ? "مجاني بالكامل" : "Free to use",
    },
  };
}

/**
 * FAQPage schema — for FAQ sections.
 *
 * ⚠️ DEPRECATED (per SEO-SCHEMA-REFERENCE.md, May 2026):
 * Google retired FAQ rich results for ALL sites on May 7, 2026.
 * This schema no longer produces any SERP feature.
 * Kept for non-Google semantic value only — do NOT add new FAQPage
 * schemas expecting Google rich results.
 * For genuine user Q&A pages, use QAPage instead.
 */
export function getFAQSchema(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/**
 * BreadcrumbList schema — for navigation breadcrumbs.
 */
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * HowTo schema — for tools and exercises.
 *
 * ⚠️ DEPRECATED (per SEO-SCHEMA-REFERENCE.md, September 2023):
 * Google stopped showing how-to rich results entirely since Sept 2023.
 * This schema no longer produces any SERP feature.
 * Kept for non-Google semantic value only — do NOT add new HowTo
 * schemas expecting Google rich results.
 */
export function getHowToSchema(params: {
  name: string;
  description: string;
  steps: string[];
  tool?: string[];
  estimatedCost?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: params.name,
    description: params.description,
    step: params.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    })),
    ...(params.tool && { tool: params.tool }),
    ...(params.estimatedCost && {
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: params.estimatedCost,
      },
    }),
  };
}

/**
 * Article schema — for blog posts.
 *
 * Phase SEO-GEO-2 (2026-09-08): added `author` as a Person (was Organization
 * before — a weaker E-E-A-T signal). Added `reviewedBy` Person (Ahmed Zake)
 * to satisfy Google's Quality Rater Guidelines for YMYL-adjacent health &
 * fitness content. The author + reviewer Persons both carry `@id` URLs so
 * multiple references on the same page collapse into one Knowledge Graph
 * entity.
 *
 * The `authorProfile` parameter is optional for backward compatibility —
 * if not passed, the schema falls back to the Ahmed Zake Person (the
 * platform's canonical author). Pages should pass the resolved author
 * (from `resolveAuthor(post.author)`) so the schema matches the byline
 * shown in the UI.
 *
 * Phase SEO-GEO-4 (2026-09-08): added `lastReviewed` field — Google's QRG
 * (Sept 2025) treats this as a strong E-E-A-T signal for YMYL-adjacent
 * health/fitness content. It tells raters "a human expert reviewed this
 * article for accuracy on this date" — distinct from dateModified which
 * only signals a content edit (could be a typo fix, not a review). We
 * set lastReviewed = dateModified by default (every edit goes through
 * Ahmed Zake's review per the platform policy documented in /about).
 *
 * Callers should pass real DB dates (published_at + updated_at), NOT
 * new Date().toISOString() at request time — otherwise Google sees every
 * article as "modified just now" on every crawl, which devalues the
 * freshness signal.
 *
 * AUDIT_REPORT §9-المرحلة 2, item 1 (2026-09-29) — HONEST REVIEW LAW:
 * the blog article pages now pass the article's REAL review state
 * (0097 review_status/last_reviewed_at). `lastReviewed` semantics:
 *   - undefined  → caller did not opt in: LEGACY behavior (the static
 *                 human-curated surfaces — compare pages — keep
 *                 lastReviewed = dateModified + reviewedBy, the
 *                 documented /about policy for owner-written content).
 *   - null       → explicitly NOT reviewed (pipeline-published,
 *                 review pending): the schema OMITS `lastReviewed` AND
 *                 `reviewedBy` entirely — no fabricated E-E-A-T
 *                 signals on YMYL health content (audit C2/F2).
 *   - string     → a REAL human review timestamp (0097): emitted
 *                 verbatim alongside reviewedBy.
 */
export function getArticleSchema(params: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  authorProfile?: AuthorProfile;
  lastReviewed?: string | null;
  /**
   * Phase 318 (P1-8): explicit canonical URL for NON-blog surfaces.
   * The legacy default builds `${SITE_URL}/blog/${slug}` — correct for
   * articles, wrong for /compare (produces /blog/compare/…). Optional
   * and fully backward-compatible: blog callers keep the legacy path.
   */
  pageUrl?: string;
}) {
  const profile = params.authorProfile ?? AHMED_ZAKE;
  const authorPerson = getPersonSchema(profile);
  const reviewerPerson = getPersonSchema(AHMED_ZAKE);
  const dateModified = params.dateModified || params.datePublished;
  const realReview = params.lastReviewed === undefined ? dateModified : params.lastReviewed;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    image: params.image || SITE_LOGO,
    datePublished: params.datePublished,
    dateModified: dateModified,
    // AUDIT §9-2.1: emitted ONLY when a real human review exists (or the
    // legacy owner-curated surfaces that did not opt into the honest
    // state). null review → both fields omitted (honest, never fabricated).
    ...(realReview ? { lastReviewed: realReview } : {}),
    ...(realReview ? { reviewedBy: reviewerPerson } : {}),
    author: authorPerson,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.pageUrl ?? `${SITE_URL}/blog/${params.slug}`,
    },
  };
}

/**
 * Speakable schema — for voice-search optimization (Phase SEO-GEO-4, 2026-09-08).
 *
 * Marks the sections of the page that are most relevant for voice assistants
 * (Siri, Google Assistant, Alexa) to read aloud when a user asks a question
 * the article answers. Per schema.org/SpeakableSpecification, the `cssSelector`
 * points at the headline + summary elements via their stable class names.
 *
 * We mark two elements as speakable:
 *   1. `[data-speakable="headline"]` — the article H1 (short, punchy answer)
 *   2. `[data-speakable="summary"]` — the article excerpt/subtitle (1–2 sentence
 *      elaboration that voice assistants can read in ~10 seconds)
 *
 * The BlogArticlePage component adds these `data-speakable` attributes to
 * the matching elements so the selectors resolve. Without the attributes,
 * the schema is valid JSON-LD but does nothing — voice assistants won't
 * know which content to read.
 *
 * Speakable is supported by Google Assistant, Amazon Alexa, Apple Siri,
 * and Microsoft Cortana. The schema does NOT guarantee a voice answer —
 * it only makes the content ELIGIBLE for selection.
 */
export function getSpeakableSchema(params: {
  url: string;
  headlineSelector: string;
  summarySelector: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: params.url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [params.headlineSelector, params.summarySelector],
    },
  };
}

/**
 * YMYL review date — Phase SEO-GEO-4.5 (2026-09-09).
 *
 * Single source for the "last reviewed for accuracy" date stamped on the
 * static YMYL detail pages (foods + exercises, EN + AR mirrors). The date
 * advances whenever a human review pass over these libraries completes —
 * it is a REVIEW date, not a content-change date, so it must not be
 * confused with `dateModified`. Platform policy (per /about, same policy
 * behind the Article schema's reviewedBy): every published piece is
 * reviewed by Ahmed Zake before it ships.
 */
export const CONTENT_LAST_REVIEWED = "2026-09-28";

/**
 * Reviewed WebPage schema — Phase SEO-GEO-4.5 (§7.1 items #6 + #7).
 *
 * The blog + comparison pages carried `reviewedBy` + `lastReviewed` since
 * Phase SEO-GEO-2, but the LARGEST health-content surfaces on the site did
 * not: the 8,162 food pages and 868 exercise pages (× 2 language mirrors ≈
 * 19.4K pages) shipped only Breadcrumb + NutritionInformation / HowTo.
 * Those are exactly the YMYL surfaces where Google's QRG raters look for
 * human-expertise signals — and where AI answer engines decide whether a
 * source is citable for health questions.
 *
 * Why a standalone WebPage node: `lastReviewed` is a property of WebPage
 * (and `reviewedBy` of CreativeWork, which WebPage extends), while
 * NutritionInformation sits under Intangible and HowTo cannot carry
 * `lastReviewed` — stamping the review on a dedicated WebPage node keeps
 * every property strictly schema.org-valid (no validator warnings) with
 * zero risk to the existing nutrition / HowTo nodes on ~19K pages.
 *
 * `reviewedBy` resolves to the shared Ahmed Zake Person (@id-stable, so it
 * collapses into the same Knowledge Graph entity already referenced by
 * Article.author / Organization.founder).
 */
export function getReviewedWebPageSchema(params: {
  url: string;
  name: string;
  lastReviewed?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: params.url,
    name: params.name,
    lastReviewed: params.lastReviewed ?? CONTENT_LAST_REVIEWED,
    reviewedBy: getPersonSchema(AHMED_ZAKE),
  };
}

/**
 * Exercise schema — for exercise detail pages.
 * Combines HowTo + Exercise schema.
 */
export function getExerciseSchema(params: {
  name: string;
  description: string;
  muscles: string[];
  equipment: string;
  instructions: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ExerciseAction",
    name: params.name,
    description: params.description,
    exerciseType: "https://schema.org/ExerciseAction",
    equipment: params.equipment,
    muscleAction: params.muscles.join(", "),
    step: params.instructions.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    })),
  };
}

/**
 * ItemList schema — for list pages (exercises, foods, programs).
 *
 * W1-1 (E-02, full-stack audit 2026-10-02): the builder is now
 * ABSOLUTE-URL-AWARE. The two compare detail pages pass the competitor's
 * official homepage (an absolute https URL — comparisons.ts) as the second
 * item; the old blind `${SITE_URL}${item.url}` prefix produced
 * "https://alkemos.comhttps://www.myfitnesspal.com" on all 8 compare
 * pages (invalid URLs). Absolute http(s) URLs now pass through VERBATIM;
 * relative site paths keep the SITE_URL prefix — the 14 legacy callers
 * (all relative) are byte-identical in output.
 */
export function getItemListSchema(params: {
  name: string;
  description: string;
  items: Array<{ name: string; url: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: params.name,
    description: params.description,
    itemListElement: params.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: /^https?:\/\//i.test(item.url) ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Helper: render JSON-LD as a script tag string.
 * Use in page components: <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />
 */
export function renderJsonLd(schema: object) {
  return JSON.stringify(schema);
}

/**
 * SEO-GEO-4 (2026-09-08, owner directive «ابدأ (ج) ثم (أ)»): AR title
 * dedup fix.
 *
 * The `/ar` nested layout (src/app/ar/layout.tsx) declares the Next.js
 * title template `%s — Alkemos`. Several Arabic pages were feeding it
 * titles that ALREADY end with a brand suffix ("| Alkemos" / "— Alkemos"
 * / "على Alkemos"), so the live <title> rendered the brand TWICE
 * (live-verified: "…تمارين الصدر | Alkemos — Alkemos"). This helper
 * strips the trailing brand so the template appends exactly ONE
 * "— Alkemos". Mid-title brand mentions (e.g. "انضم كمدرب في Alkemos…")
 * are intentionally preserved — only the duplicated SUFFIX is removed.
 *
 * Scope: ONLY the `metadata.title` value fed to the AR template. The
 * og/twitter `title` fields bypass Next.js templates, so they keep the
 * original suffixed strings.
 *
 * SEO/GEO audit (2026-09-28): added the «، Alkemos» (Arabic comma)
 * trailing pattern — the author profile titles are composed from
 * `authors.ts` jobTitles that END with «، Alkemos» (e.g. «المؤسس
 * والمدرب الرئيسي، Alkemos»), so the old three patterns left a
 * «…، Alkemos — Alkemos» double brand on /ar/authors/ahmed-zake.
 */
export function stripTrailingBrandForArTemplate(title: string): string {
  return title
    .replace(/\s*\|\s*Alkemos\s*$/u, "")
    .replace(/\s*—\s*Alkemos\s*$/u, "")
    .replace(/\s*،\s*Alkemos\s*$/u, "")
    .replace(/\s+على\s+Alkemos\s*$/u, "");
}

export { SITE_URL, SITE_NAME, SITE_LOGO };

/**
 * Recipe schema — HEALTHY-RECIPES-PLATFORM plan §10-1 (the audit's
 * «getRecipeSchema يُبنى جديدًا» gap, built on the honest-dates
 * getArticleSchema precedent + the foods pages' hand-made
 * NutritionInformation node).
 *
 * LAWS (owner §11 + repo E-E-A-T law):
 *  - NO aggregateRating EVER — zero real reviews exist; a fabricated
 *    rating is a Google penalty (the blog's honest-schema precedent).
 *  - Author/publisher follow the platform honesty pattern: the daily
 *    pipeline is the author (Organization), never a fabricated Person.
 *  - Every nutrition number comes from the COMPUTED layer
 *    (recipes-nutrition), passed in by the caller — this function
 *    serializes, it never computes.
 *  - saturatedFat/sodium are included ONLY when the caller passes a
 *    non-null value (owner §2 «لا تختلق قيم» — the enrichment columns
 *    are optional by design).
 *  - recipeIngredient carries the weight + weight-state in the VERSION's
 *    language; recipeInstructions is a HowToStep list from the stored
 *    steps; suitableForDiet maps from the diets[] the RULES ENGINE
 *    computed (never model-claimed — D-GATE-1).
 */
export function getRecipeSchema(params: {
  lang: "en" | "ar";
  title: string;
  description: string;
  pageUrl: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  recipeYield: number;
  prepMinutes: number;
  cookMinutes: number;
  cuisineLabels: string[];
  suitableForDietLabels: string[];
  /** Per-serving computed values (the caller's single source of truth). */
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number | null;
    saturatedFatG?: number | null;
    sodiumMg?: number | null;
  };
  /** Already localized "120 g rice (raw)" strings. */
  recipeIngredient: string[];
  instructions: string[];
}) {
  const toIso = (minutes: number) => `PT${Math.max(0, Math.round(minutes))}M`;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: params.title,
    description: params.description,
    inLanguage: params.lang === "ar" ? "ar" : "en",
    url: params.pageUrl,
    ...(params.image ? { image: [params.image] } : {}),
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    recipeYield: `${params.recipeYield}`,
    prepTime: toIso(params.prepMinutes),
    cookTime: toIso(params.cookMinutes),
    totalTime: toIso(params.prepMinutes + params.cookMinutes),
    ...(params.cuisineLabels.length > 0 ? { recipeCuisine: params.cuisineLabels } : {}),
    ...(params.suitableForDietLabels.length > 0
      ? { suitableForDiet: params.suitableForDietLabels }
      : {}),
    recipeIngredient: params.recipeIngredient,
    recipeInstructions: params.instructions.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
    nutrition: {
      "@type": "NutritionInformation",
      // «~245 kcal» — schema.org expects a string per property.
      calories: `${params.nutrition.calories} kcal`,
      proteinContent: `${params.nutrition.proteinG} g`,
      carbohydrateContent: `${params.nutrition.carbsG} g`,
      fatContent: `${params.nutrition.fatG} g`,
      ...(params.nutrition.fiberG != null ? { fiberContent: `${params.nutrition.fiberG} g` } : {}),
      ...(params.nutrition.saturatedFatG != null
        ? { saturatedFatContent: `${params.nutrition.saturatedFatG} g` }
        : {}),
      ...(params.nutrition.sodiumMg != null ? { sodiumContent: `${params.nutrition.sodiumMg} mg` } : {}),
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": params.pageUrl },
  };
}

/**
 * Maps an internal diets[] value to the schema.org restrictedDiet enum
 * (getRecipeSchema's suitableForDiet input). Values with NO honest
 * schema.org enum are OMITTED — never approximated:
 *   keto / low-carb / high-protein / mediterranean / pescatarian have
 *   no restrictedDiet enum member, so they are simply not emitted.
 * dairy-free → LowLactoseDiet is sound by construction (zero dairy ⇒
 * zero lactose); dash → LowSaltDiet because the rules engine's DASH
 * criterion IS the sodium ceiling (≤600 mg/serving).
 */
export const SCHEMA_SUITABLE_FOR_DIET: Record<string, string> = {
  vegetarian: "VegetarianDiet",
  vegan: "VeganDiet",
  "gluten-free": "GlutenFreeDiet",
  "dairy-free": "LowLactoseDiet",
  dash: "LowSaltDiet",
};
