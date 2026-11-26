/**
 * STORE-GUARDS — the Alkemos Product Store's publishing gates as PURE,
 * testable functions (governing law §3.4 — the eight guards — PLUS the
 * two ratified Phase-1 additions: the absolute image law v2 §0 and the
 * NINTH guard "commissions are internal-only").
 *
 * SOURCES (each rule cites its binding law):
 *  - IMAGE-POLICY-EN.md v2 §0 (owner order 2026-11-26): absolute ban on
 *    women/girls in ANY store image (incl. product, lifestyle, AI,
 *    background, partial, reflections) + immodest/NSFW content for both
 *    genders; when in doubt → REJECT and use a neutral carved icon.
 *  - IMAGE-POLICY-EN.md §2/§4 + clause (h): no Amazon image domains in
 *    image_url (no stored Amazon images, ever).
 *  - Governing law §3.4-5 + SUPPLEMENTS-FOOD-SCREENING-EN.md §2-1: the
 *    operational halal blocklist (pork/alcohol wording) on description +
 *    ingredients = automatic publish rejection.
 *  - SUPPLEMENTS-FOOD-SCREENING-EN.md §2-2: animal-source UNKNOWN-origin
 *    ingredients (gelatin…) are REVIEW FLAGS (owner decision), not bans.
 *  - SUPPLEMENTS-FOOD-SCREENING-EN.md §3: claims discipline — no disease
 *    claims, no FDA-approved-style wording (structure/function only).
 *  - Governing law §3.4-6: NO price before Phase 4 (price_usd must stay
 *    NULL until the Creators API order).
 *  - Owner order 2026-11-26 (ratified §6-c — the NINTH guard): commission
 *    RATES are internal-only — no rate may appear on any public store
 *    surface (COMMISSION-RATES.md is the internal single source).
 *  - Governing law §3.4-8: ≥300 editorial words is an ADVISORY floor —
 *    it warns, it never blocks (the real publish gate is the owner's
 *    0097 review).
 *
 * Every function here is pure + shared by the admin publish API, the
 * seed validation, and the vitest canaries (store-guards.test.ts).
 */

import {
  hasFemaleSubjectSignal,
  hasImmodestSignal,
  hasNsfwVocabulary,
} from "./image-safety";
import { containsStoredAmazonLink, isValidAsin } from "./store-link";

/* ───────────── 1) IMAGE GUARDS (law v2 §0 + clause (h)) ───────────── */

/**
 * Amazon image CDN hosts (clause (h) — Product Advertising Content):
 * storing an IMAGE file is forbidden forever; a stored image_url from
 * these domains means Amazon-hosted content was copied, so the guard
 * rejects it outright.
 */
const AMAZON_IMAGE_HOSTS = [
  "m.media-amazon.com",
  "media-amazon.com",
  "images-amazon.com",
  "images-na.ssl-images-amazon.com",
  "ecx.images-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-fe.ssl-images-amazon.com",
  "d1k5w7mbrh6vq5.cloudfront.net", // legacy amazon media distribution
] as const;

/** true when the URL points at an Amazon image CDN host (clause (h)). */
export function isAmazonImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return AMAZON_IMAGE_HOSTS.some((host) => value.includes(host));
}

export type StoreImageCheck = {
  ok: boolean;
  violations: string[];
};

/**
 * The FULL image gate (IMAGE-POLICY-EN.md v2 §0 + §4) for one image
 * candidate: its URL + its alt/description text. Rejects:
 *  - Amazon image domains (clause (h));
 *  - ANY female-subject signal in the alt/URL text (§0.1 absolute ban —
 *    incl. "woman", "women", "girl", "female", "model"…);
 *  - immodest/NSFW signals (§0.2 — both genders);
 * When in doubt (any signal present) → REJECT: the fallback is the
 * neutral carved icon, never a maybe-noncompliant photo.
 */
export function checkStoreImage(
  imageUrl: string | null | undefined,
  imageAlt: string | null | undefined,
): StoreImageCheck {
  const violations: string[] = [];
  if (isAmazonImageUrl(imageUrl)) {
    violations.push("image_url points at an Amazon image domain (clause (h) — Amazon images are never stored)");
  }
  const text = `${imageUrl ?? ""} ${imageAlt ?? ""}`;
  if (hasFemaleSubjectSignal(text)) {
    violations.push("image text carries a female-subject signal (IMAGE-POLICY v2 §0.1 — absolute ban; use a neutral carved icon)");
  }
  if (hasImmodestSignal(text)) {
    violations.push("image text carries an immodest signal (IMAGE-POLICY v2 §0.2 — immodest imagery is banned for both genders)");
  }
  if (hasNsfwVocabulary(text)) {
    violations.push("image text carries NSFW vocabulary (IMAGE-POLICY v2 §0.2)");
  }
  return { ok: violations.length === 0, violations };
}

/* ───────────── 2) HALAL BLOCKLIST (§3.4-5 + screening §2-1) ───────── */

/**
 * The OPERATIONAL hard blocklist, verbatim from SUPPLEMENTS-FOOD-
 * SCREENING-EN.md §2-1 (the 2026-11-12 pork/alcohol deletion law):
 * any occurrence in the description/ingredients = automatic publish
 * rejection. NOTE: "alcohol-free"/"non-alcoholic" are handled by
 * hasHalalBlocklistHit being context-aware (see below).
 */
const HALAL_BLOCKLIST = [
  "pork",
  "lard",
  "bacon",
  "ethanol",
  "wine",
  "beer",
  "rum",
  "liquor",
  "liqueur",
] as const;

/**
 * Animal-derived UNKNOWN-origin ingredients — REVIEW FLAGS ONLY
 * (screening §2-2: the owner decides per product; never an auto-ban).
 */
export const ANIMAL_SOURCE_REVIEW_FLAGS = [
  "gelatin",
  "porcine",
  "rennet",
  "carmine",
  "shellac",
  "l-cysteine",
] as const;

const ALCOHOL_WORD = "alcohol";
/** Explicit alcohol-free markers (screening §2-2: «alcohol-free» الصريح مقبول). */
const ALCOHOL_FREE_MARKERS = [
  "alcohol-free",
  "alcohol free",
  "non-alcoholic",
  "nonalcoholic",
  "0% alcohol",
  "zero-alcohol",
];

/**
 * true when the text hits a halal blocklist word (WORD-BOUNDARY match —
 * "thumb" must never trip "rum", "swine" never trips "wine": the
 * blocklist is the screening doc's literal list, not a substring trap).
 * "alcohol"-family words are a hard hit UNLESS the phrase is an explicit
 * alcohol-free marker (the screening law allows the explicit
 * alcohol-free statement).
 * Returns the hit word (for the message) or null.
 */
export function hasHalalBlocklistHit(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const value = text.toLowerCase();
  for (const word of HALAL_BLOCKLIST) {
    if (new RegExp(`\\b${word}\\b`, "i").test(value)) return word;
  }
  // alcohol-family: alcohol\w* covers "alcohol", "alcoholic",
  // "alcohols" — while the explicit markers stay allowed.
  if (/\balcohol\w*/i.test(value)) {
    const isExplicitlyFree = ALCOHOL_FREE_MARKERS.some((marker) =>
      new RegExp(`\\b${marker.replace(/[-%\d\s]/g, (m) => (m === " " ? "\\s" : m))}\\b`, "i").test(value) ||
        value.includes(marker),
    );
    if (!isExplicitlyFree) return ALCOHOL_WORD;
  }
  return null;
}

/** Returns the first animal-source review flag found (advisory), or null. */
export function findAnimalSourceReviewFlag(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const value = text.toLowerCase();
  for (const flag of ANIMAL_SOURCE_REVIEW_FLAGS) {
    if (new RegExp(`\\b${flag}\\b`, "i").test(value)) return flag;
  }
  return null;
}

/* ───────────── 3) CLAIMS DISCIPLINE (screening §3) ───────────── */

/**
 * Disease-claim patterns (screening §3-1 — banned for ALL products):
 * diagnose/treat/cure/prevent/heal a disease/condition, or "FDA
 * approved"-style authority claims. Structure/function wording ("supports
 * muscle recovery", per the manufacturer) is the allowed register.
 */
const DISEASE_CLAIM_RE =
  /\b(diagnos\w*|treat\w*|cur\w*|heal\w*|prevent\w*)\b[^.]{0,40}\b(disease|illness|cancer|diabetes|diabetic|covid|obesity|arthritis|osteoporosis|hypertension|depression|anxiety|alzheimer|heart disease|stroke|infection|inflammation)\b/i;

const FDA_AUTHORITY_RE = /\bfda[ -]?(approved|certified|endorsed)\b/i;

/** true when the text carries a disease/authority claim. */
export function hasBannedClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  return DISEASE_CLAIM_RE.test(text) || FDA_AUTHORITY_RE.test(text);
}

/* ───── 4) PRICE GUARD (§3.4-6 — no prices before the Phase-4 API) ──── */

/**
 * The Phase-1 law: price_usd MUST be null until the Creators-API order
 * (Phase 4) flips it. A manual price on publish is a BLOCKING violation
 * (the price clause: only API-served or API-obtained prices may display).
 */
export function hasManualPriceViolation(
  priceUsd: number | null | undefined,
): boolean {
  return priceUsd !== null && priceUsd !== undefined;
}

/* ── 5) NINTH GUARD: commissions are internal-only (§6-c, ratified) ── */

/**
 * Commission-rate context: any percentage tied to commission/earnings
 * wording. The internal rates live ONLY in docs/store/COMMISSION-RATES.md
 * (admin docs + internal reports); the OWNER ORDER (2026-11-26) forbids
 * any rate on public store surfaces or as a marketing hook.
 */
const COMMISSION_CONTEXT_RE =
  /\b(commission|commissions|payout|payouts|referral fee|advertising fee|we earn|you earn|earning rate|fee rate)s?\b[^.]{0,60}\d{1,2}(?:\.\d{1,2})?\s*%/i;

const RATE_NEAR_COMMISSION_RE =
  /\d{1,2}(?:\.\d{1,2})?\s*%[^.]{0,40}\b(commission|commissions|payout|payouts)\b/i;

/** Documented rate strings from the internal table (COMMISSION-RATES.md). */
const DOCUMENTED_RATES = [
  "10.00%",
  "5.00%",
  "4.50%",
  "4.00%",
  "3.00%",
  "2.50%",
  "2.00%",
  "1.00%",
  "0.00%",
];

/**
 * NINTH GUARD: true when a text shows a commission RATE (either an
 * explicit documented rate string, or any % in commission/earnings
 * context). Applied to product title/summary/content at publish time
 * and to rendered public surfaces by the store canary. The mandated
 * disclosure sentences (no percentages) never match.
 */
export function hasCommissionRateText(
  text: string | null | undefined,
): boolean {
  if (!text) return false;
  if (COMMISSION_CONTEXT_RE.test(text)) return true;
  if (RATE_NEAR_COMMISSION_RE.test(text)) return true;
  return DOCUMENTED_RATES.some((rate) => text.includes(rate));
}

/* ───── 6) EDITORIAL FLOOR (§3.4-8 — advisory, NEVER a block) ──────── */

/** The advisory editorial floor (words) — a guideline, not Amazon policy. */
export const EDITORIAL_FLOOR_WORDS = 300;

/** Word count of the editorial content (whitespace-separated). */
export function editorialWordCount(
  content: string | null | undefined,
): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

/* ───────────── 7) THE AGGREGATED PUBLISH GATE ───────────── */

export type StoreGuardSeverity = "block" | "warn";

export type StoreGuardFinding = {
  rule: string;
  severity: StoreGuardSeverity;
  message: string;
};

export type StoreProductGuardInput = {
  asin?: string | null;
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  price_usd?: number | null;
};

/**
 * The full publish gate for one product (used by the admin publish API
 * and the seed validation). Returns findings; ANY "block" finding means
 * the product CANNOT be published. The editorial floor and the
 * animal-source flags are WARNINGS (the real owner-review gate is the
 * 0097 flow — review_status pending → reviewed).
 *
 * Guards applied (by law §3.4):
 *   1. stored tagged links (store-link.ts §3.4-1)
 *   2. ASIN validity (non-standard ASIN = block)
 *   4. image law v2 §0 + Amazon domains (§3.4-4)
 *   5. halal blocklist (§3.4-5)
 *   6. manual price (§3.4-6)
 *   9. commission rates (ratified §6-c)
 *   +  claims discipline (screening §3) — block
 *   +  editorial floor (§3.4-8) — advisory warn only
 *   +  animal-source flags (screening §2-2) — advisory warn only
 */
export function runStoreProductGuards(
  product: StoreProductGuardInput,
): StoreGuardFinding[] {
  const findings: StoreGuardFinding[] = [];
  const fields: Array<[string, string | null | undefined]> = [
    ["title", product.title],
    ["summary", product.summary],
    ["content", product.content],
    ["image_url", product.image_url],
  ];
  for (const [field, value] of fields) {
    if (value) {
      if (containsStoredAmazonLink(value)) {
        findings.push({
          rule: "stored-tagged-link",
          severity: "block",
          message: `${field}: contains a stored Amazon/tagged link — links are built from the ASIN at render time only (§3.4-1)`,
        });
      }
      if (hasCommissionRateText(value)) {
        findings.push({
          rule: "commissions-internal-only",
          severity: "block",
          message: `${field}: shows a commission rate — rates are internal-only and never public (§6-c, owner order 2026-11-26)`,
        });
      }
    }
  }
  if (product.asin) {
    if (!isValidAsin(product.asin)) {
      findings.push({
        rule: "asin-format",
        severity: "block",
        message: "asin: non-standard ASIN (expected B + 9 chars, or 10 digits) (§3.4-1)",
      });
    }
  }
  const image = checkStoreImage(product.image_url, product.image_alt);
  for (const violation of image.violations) {
    findings.push({
      rule: "image-policy",
      severity: "block",
      message: violation,
    });
  }
  const halalHit = hasHalalBlocklistHit(
    `${product.summary ?? ""}\n${product.content ?? ""}`,
  );
  if (halalHit) {
    findings.push({
      rule: "halal-blocklist",
      severity: "block",
      message: `description/content contains the blocklisted word "${halalHit}" (pork/alcohol law 2026-11-12 — §3.4-5)`,
    });
  }
  if (hasBannedClaim(`${product.summary ?? ""}\n${product.content ?? ""}`)) {
    findings.push({
      rule: "claims-discipline",
      severity: "block",
      message: "content carries a disease/authority claim (screening §3 — structure/function wording only)",
    });
  }
  if (hasManualPriceViolation(product.price_usd)) {
    findings.push({
      rule: "price-before-api",
      severity: "block",
      message: "price_usd is set — prices stay NULL until the Phase-4 Creators-API order (§3.4-6)",
    });
  }
  const animalFlag = findAnimalSourceReviewFlag(product.content ?? "");
  if (animalFlag) {
    findings.push({
      rule: "animal-source-flag",
      severity: "warn",
      message: `content mentions "${animalFlag}" (unknown animal origin — screening §2-2: owner review required, not an auto-ban)`,
    });
  }
  const words = editorialWordCount(product.content);
  if (words < EDITORIAL_FLOOR_WORDS) {
    findings.push({
      rule: "editorial-floor",
      severity: "warn",
      message: `editorial content is ${words} words (advisory floor ${EDITORIAL_FLOOR_WORDS} — §3.4-8: a guideline, never a publish blocker)`,
    });
  }
  return findings;
}

/** true when any finding blocks publishing (the admin API's hard stop). */
export function blocksPublish(findings: StoreGuardFinding[]): boolean {
  return findings.some((f) => f.severity === "block");
}
