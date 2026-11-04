/**
 * Author / Reviewer registry — E-E-A-T foundation (Phase SEO-GEO-2, 2026-09-08).
 *
 * Central definition of every human author and reviewer whose name appears
 * in the Alkemos structured-data layer. Pulling this out of the per-page
 * `seo.ts` schema builders keeps the credentials / jobTitle / url in ONE
 * place — update once, every Article + Organization schema picks it up.
 *
 * Why this matters:
 *   - Google's September 2025 QRG update formalized that raters assess
 *     AI-generated content for genuine E-E-A-T signals. Author + reviewer
 *     bylines + Person schema are the strongest machine-readable signal
 *     that "real human expertise is behind this content."
 *   - The Article schema `author` and `reviewedBy` properties accept a
 *     Person (or Person @id reference). Without this file, every blog
 *     post schema only carried `Organization` as its author — which is
 *     legal JSON-LD but a known weak E-E-A-T signal.
 *
 * Adding a new author:
 *   1. Append to AUTHORS with slug + bilingual bio + credentials
 *   2. Reference the slug from any content's `author` field
 *   3. The schema builder (getArticleSchema) resolves it automatically
 *
 * The owner (Ahmed Zake) is the canonical author of all platform content
 * until additional coaches are added.
 *
 * NOTE: This module is intentionally NOT marked `server-only`. It only
 * contains public author metadata (name, bio, credentials, profile URLs)
 * that is safe to ship to the browser. The client-safe `seo.ts` imports
 * from here, and `seo.ts` is itself imported by client components
 * (LandingView, etc.), so `authors.ts` must be browser-safe too. Any
 * sensitive author data (private contact info, internal notes) should
 * live in a separate server-only module.
 */

export type AuthorRole = "author" | "reviewer" | "editor";

export type AuthorProfile = {
  /** URL-safe slug — also used as the Person @id fragment */
  slug: string;
  /** Display name in English */
  nameEn: string;
  /** Display name in Arabic */
  nameAr: string;
  /** Job title in English (for schema jobTitle + UI byline) */
  jobTitleEn: string;
  /** Job title in Arabic */
  jobTitleAr: string;
  /** Short bio in English (~80 words) for the author card */
  bioEn: string;
  /** Short bio in Arabic (~80 words) for the author card */
  bioAr: string;
  /** List of credentials / certifications (bilingual pair per entry) */
  credentials: Array<{ en: string; ar: string }>;
  /** Same-as links — ONLY verifiable profiles (per E-E-A-T framework) */
  sameAs: string[];
  /**
   * Bilingual display labels for sameAs links (keyed by the exact URL).
   * Falls back to hostname/handle when absent. Kept here so the profile
   * pages stay data-driven from the registry.
   */
  sameAsLabels?: Record<string, { en: string; ar: string }>;
  /** Avatar URL (absolute) — falls back to logo if empty */
  avatarUrl?: string;
  /** Public profile URL on this site (absolute) */
  profileUrl: string;
};

// ============================================================================
// Ahmed Zake — Founder, head author, head reviewer
// ============================================================================

export const AHMED_ZAKE: AuthorProfile = {
  slug: "ahmed-zake",
  nameEn: "Ahmed Zake",
  nameAr: "أحمد زكي",
  jobTitleEn: "Founder & Head Coach, Alkemos",
  jobTitleAr: "المؤسس والمدرب الرئيسي، Alkemos",
  // Owner correction (2026-09-28): ~20 years total training experience,
  // ~10 of them coaching ONLINE. Approximation kept honest — no invented
  // precision (no exact counts, no start years).
  bioEn:
    "Ahmed Zake is the founder of Alkemos and a certified fitness and nutrition coach with about twenty years of training experience, around ten of them coaching clients online. He built Alkemos to combine the precision of AI-driven plan generation with the accountability of personal coaching — closing the gap between generic fitness apps and expensive 1-on-1 trainers. Ahmed oversees every piece of content published on the platform, from the 868+ exercise library to the automated blog pipeline, and reviews each article for accuracy before publication.",
  bioAr:
    "أحمد زكي مؤسس Alkemos ومدرب لياقة وتغذية معتمد بخبرة تدريبية تناهز عشرين عامًا، نحو عشر سنوات منها في تدريب العملاء أونلاين. بنى Alkemos ليجمع بين دقة توليد الخطط بالذكاء الاصطناعي ومساءلة التدريب الخاص — ليسدّ الفجوة بين تطبيقات اللياقة العامة والمدربين الشخصيين المكلفين. يشرف أحمد على كل محتوى يُنشر على المنصة، من مكتبة الـ868+ تمرينًا إلى خط المدوّنة الآلي، ويراجع كل مقال للدقّة قبل النشر.",
  credentials: [
    // P2-11 (2026-09-28): the eight credentials below are transcribed
    // EXACTLY as named on the founder's certificates (owner-supplied
    // certificates image — the single source of truth). The issuing body is
    // named on every entry for E-E-A-T verifiability. Per owner instruction
    // NO certificate numbers, dates, membership or accreditation IDs are
    // published — certificate names and issuers only.
    { en: "Certified Personal Trainer — American College of Sports Medicine (ACSM)", ar: "مدرب شخصي معتمد — الكلية الأمريكية للطب الرياضي (ACSM)" },
    { en: "Certified Personal Trainer — American Council on Exercise (ACE)", ar: "مدرب شخصي معتمد — المجلس الأمريكي للتمرين (ACE)" },
    { en: "Certified Personal Trainer — International Sports Sciences Association (ISSA)", ar: "مدرب شخصي معتمد — الرابطة الدولية لعلوم الرياضة (ISSA)" },
    { en: "Fitness Nutrition Specialist — American Council on Exercise (ACE)", ar: "أخصائي تغذية اللياقة — المجلس الأمريكي للتمرين (ACE)" },
    { en: "Fitness Nutrition Specialist (FNS) — National Academy of Sports Medicine (NASM)", ar: "أخصائي تغذية اللياقة (FNS) — الأكاديمية الوطنية للطب الرياضي (NASM)" },
    { en: "Specialist in Sports Nutrition — International Sports Sciences Association (ISSA)", ar: "أخصائي التغذية الرياضية — الرابطة الدولية لعلوم الرياضة (ISSA)" },
    { en: "Weight Management Specialist — American Council on Exercise (ACE)", ar: "أخصائي إدارة الوزن — المجلس الأمريكي للتمرين (ACE)" },
    { en: "Fitness Coach — International Sports Sciences Association (ISSA)", ar: "مدرب لياقة — الرابطة الدولية لعلوم الرياضة (ISSA)" },
    // Experience lines (not certificates — biographical facts stated by
    // the owner 2026-09-28: ~20 years total training, ~10 of them coaching
    // ONLINE; approximation kept honest, no invented precision).
    { en: "About 20 years of training experience, about 10 of them coaching online", ar: "نحو 20 سنة من الخبرة التدريبية، منها نحو 10 سنوات تدريب أونلاين" },
    { en: "Founder of Alkemos (2026)", ar: "مؤسس Alkemos (2026)" },
  ],
  sameAs: [
    // P2-11 (2026-09-28): owner-verified personal Facebook profiles, both
    // resolving live — AhmedZakePT is the founder's coaching page (14k+
    // followers), SpEeRr is his personal profile (18k+ followers). These are
    // the PERSON's own profiles. The BRAND's social profiles live in
    // Organization.sameAs via src/lib/social.ts — do not duplicate them
    // here (Person.sameAs = person, Organization.sameAs = brand; mixing
    // them blurs the entity graph).
    "https://www.facebook.com/AhmedZakePT/",
    "https://www.facebook.com/SpEeRr/",
  ],
  // Owner reversal (2026-09-28, later the same day): the Facebook Page
  // Plugin embed shipped in the follow-up was removed by owner order —
  // the labeled direct-link chips below are the founder pages' only
  // Facebook presence. sameAsLabels stays (the chips consume it).
  sameAsLabels: {
    "https://www.facebook.com/AhmedZakePT/": { en: "Coaching page", ar: "صفحة التدريب" },
    "https://www.facebook.com/SpEeRr/": { en: "Personal profile", ar: "الملف الشخصي" },
  },
  // Owner follow-up item 3 (2026-09-28): the author-card avatar is the
  // founder's REAL photo. The public Facebook page (facebook.com/AhmedZakePT)
  // was checked first per the owner's instruction: its Graph picture endpoint
  // works without a token, but the image it serves is a branded collage
  // (dark neon background, "AZ" logo, text overlays) that becomes unreadable
  // noise at avatar sizes, and its CDN URLs are signed and expire — not
  // reliable for direct use. Chosen instead: the best founder photo already
  // on the site — a dedicated SQUARE 400×400 face crop of the studio
  // portrait /images/coach-portrait.jpg (the clean white-background photo
  // used on the about page). Square because every consumer is a circle
  // (byline 40px, authors index 80px, profile 96–128px) and the profile
  // pages' og:image already declares 400×400 — the JSON-LD Person.image
  // picks this up automatically.
  // Filename note: the first deploy used ahmed-zake-avatar.jpg, whose URL got
  // negative-cached (24h) at the Cloudflare edge by pre-deploy polling —
  // renamed to the never-requested coach-avatar.jpg (naming consistent with
  // coach-portrait.jpg) so no visitor can meet a cached 404.
  avatarUrl: "https://alkemos.com/images/authors/coach-avatar.jpg",
  profileUrl: "https://alkemos.com/authors/ahmed-zake",
};

// ============================================================================
// Registry — every author the platform knows about
// ============================================================================

export const AUTHORS: AuthorProfile[] = [AHMED_ZAKE];

/** Resolve an author by slug → AuthorProfile. Throws on unknown slug. */
export function getAuthorBySlug(slug: string): AuthorProfile | null {
  return AUTHORS.find((a) => a.slug === slug) ?? null;
}

/**
 * Resolve an author from a free-text `author` string (as stored in the
 * `blog_posts.author` column). The DB historically stored 'MuscleHub',
 * 'Alkemos', or 'Ahmed Zake' — we normalize all of those to the canonical
 * Ahmed Zake Person, since he is the de-facto author of every post on
 * the platform today.
 *
 * When additional coaches are onboarded, expand the matching map below
 * or store author_slug directly on blog_posts and prefer that column.
 */
export function resolveAuthor(dbAuthor: string | null | undefined): AuthorProfile {
  if (!dbAuthor) return AHMED_ZAKE;
  const normalized = dbAuthor.trim().toLowerCase();
  // Historical aliases — all point to Ahmed Zake (the founder) until the
  // platform adds a second human author.
  if (
    normalized === "ahmed zake" ||
    normalized === "alkemos" ||
    normalized === "musclehub" ||
    normalized === "musclehubeg"
  ) {
    return AHMED_ZAKE;
  }
  // Try a direct slug match (case-insensitive)
  const direct = AUTHORS.find(
    (a) => a.slug.toLowerCase() === normalized.replace(/\s+/g, "-"),
  );
  return direct ?? AHMED_ZAKE;
}

// ============================================================================
// Schema builders — return JSON-LD Person objects
// ============================================================================

/**
 * Build a schema.org Person JSON-LD object for an author.
 *
 * Used as the `author` field in Article schema, the `reviewedBy` field,
 * and the `founder` field in Organization schema.
 *
 * The `@id` is a stable URL so multiple references to the same person
 * across the page (e.g. as author AND reviewer) collapse into one
 * entity in Google's Knowledge Graph.
 */
export function getPersonSchema(author: AuthorProfile) {
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": author.profileUrl,
    name: author.nameEn,
    alternateName: author.nameAr,
    jobTitle: author.jobTitleEn,
    description: author.bioEn,
    url: author.profileUrl,
    image: author.avatarUrl,
    worksFor: {
      "@type": "Organization",
      name: "Alkemos",
      url: "https://alkemos.com",
    },
    knowsAbout: [
      "Fitness coaching",
      "Nutrition coaching",
      "Strength training",
      "Hypertrophy training",
      "Fat loss",
      "Macronutrient planning",
      "Workout programming",
      // P2-11 (2026-09-28): cert-supported additions — the founder holds
      // ISSA Specialist in Sports Nutrition + ACE Weight Management
      // Specialist credentials (see credentials above).
      "Sports nutrition",
      "Weight management",
    ],
  };

  // Only add sameAs if we have real, verifiable profile URLs (E-E-A-T
  // framework warning: empty sameAs is better than fake sameAs).
  if (author.sameAs.length > 0) {
    person.sameAs = author.sameAs;
  }

  // Credentials → hasCredential (Schema.org property, recognized by Google)
  if (author.credentials.length > 0) {
    person.hasCredential = author.credentials.map((c) => c.en);
  }

  return person;
}

/**
 * Build a ProfilePage JSON-LD object for an author's profile page.
 * Used on /authors/[slug] to mark the page as an entity-about-a-Person.
 */
export function getProfilePageSchema(author: AuthorProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: getPersonSchema(author),
    name: `${author.nameEn} — Author at Alkemos`,
    url: author.profileUrl,
    description: author.bioEn,
  };
}
