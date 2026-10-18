/**
 * SITE-CONTENT/CORE — the pure resolution engine for admin-editable
 * site copy (SITE-CONTENT-281, owner task order 2026-09-27).
 *
 * WHAT THIS IS (and is NOT):
 *   - The site's static marketing copy lives in TWO layers: the CODE
 *     DEFAULTS (src/lib/site-content/home.ts + static-pages.ts — the
 *     literal copy that used to be welded into the views) and OPTIONAL
 *     Supabase overrides in the `site_content` table (migration 0094).
 *   - This module resolves a key for the active locale: a VALID override
 *     wins; anything else (missing row, null value, wrong type, empty or
 *     whitespace-only string) falls back to the code default. A missing
 *     default resolves to "" — the page can never crash on content, and
 *     a broken DB row can never blank it (the fallback law).
 *
 * PURE MODULE: no Supabase, no server-only imports — client components
 * (LandingView / StaticPageView) import the sibling default modules and
 * resolve here, so the public first-load graph stays free of any
 * Supabase client (the Phase-182/224 bundle law holds: server routes
 * fetch the overrides and pass them down as props).
 *
 * TOKENS: about-page paragraphs carry live library sizes. Defaults and
 * overrides may embed `{exercises}` / `{foods}`; resolve-time
 * substitution keeps the copy growing with the libraries instead of
 * aging silently (the P3-10/217 law, preserved through the DB layer).
 */

import { EXERCISES_COUNT } from "@/lib/exercises-shared";
import { FOODS_COUNT } from "@/lib/foods-shared";

export type SiteCopyMap = Record<string, { en?: unknown; ar?: unknown } | undefined>;

// PRIORITY-PAGES Implementation (2026-10-19, audit §E-2): optional
// per-answer destination links — the /faq page answered every question
// then left the visitor stranded ("answers with no links", the audit's
// measured finding). Optional so every existing consumer (homepage
// accordion, JSON-LD builders, admin-override picker) is untouched;
// admin overrides from the DB simply don't carry links (the override IS
// the content — pre-existing system law, unchanged).
export type SiteFaqItem = { q: string; a: string; links?: StaticSectionLink[] };

export type StaticSectionLink = { label: string; href: string };

export type StaticSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
  links?: StaticSectionLink[];
};

export type StaticPageContent = {
  title: string;
  sections: StaticSection[];
};

export type FaqPageContent = {
  title: string;
  items: SiteFaqItem[];
};

/* ── Token engine ──────────────────────────────────────────────── */

const TOKEN_VALUES: Record<string, string> = {
  "{exercises}": `${EXERCISES_COUNT.toLocaleString("en-US")}+`,
  "{foods}": `${FOODS_COUNT.toLocaleString("en-US")}+`,
};

/** Substitute `{exercises}` / `{foods}` with the live library sizes. */
export function applySiteTokens(text: string): string {
  let out = text;
  for (const [token, value] of Object.entries(TOKEN_VALUES)) {
    if (out.includes(token)) out = out.split(token).join(value);
  }
  return out;
}

/* ── Override validators (the fallback law's teeth) ────────────── */

/** A text override must be a non-empty, non-whitespace string to win. */
export function pickTextOverride(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? value : null;
}

/** A FAQ override must be an array of well-formed Q/A pairs to win. */
export function pickFaqOverride(value: unknown): SiteFaqItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items: SiteFaqItem[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) return null;
    const { q, a } = raw as Record<string, unknown>;
    if (typeof q !== "string" || q.trim().length === 0) return null;
    if (typeof a !== "string" || a.trim().length === 0) return null;
    items.push({ q, a });
  }
  return items;
}

function isInternalHref(href: unknown): href is string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}

/** A static-page override must be a fully well-formed structure to win. */
export function pickStaticPageOverride(value: unknown): StaticPageContent | null {
  if (typeof value !== "object" || value === null) return null;
  const { title, sections } = value as Record<string, unknown>;
  if (typeof title !== "string" || title.trim().length === 0) return null;
  if (!Array.isArray(sections) || sections.length === 0) return null;
  const parsed: StaticSection[] = [];
  for (const raw of sections) {
    if (typeof raw !== "object" || raw === null) return null;
    const section = raw as Record<string, unknown>;
    if (typeof section.heading !== "string" || section.heading.trim().length === 0) return null;
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length === 0) return null;
    if (!section.paragraphs.every((p) => typeof p === "string" && p.trim().length > 0)) return null;
    if (section.list !== undefined) {
      if (!Array.isArray(section.list) || !section.list.every((li) => typeof li === "string" && li.trim().length > 0)) {
        return null;
      }
    }
    if (section.links !== undefined) {
      if (!Array.isArray(section.links) || section.links.length === 0) return null;
      for (const link of section.links) {
        if (typeof link !== "object" || link === null) return null;
        const { label, href } = link as Record<string, unknown>;
        if (typeof label !== "string" || label.trim().length === 0) return null;
        // Only internal site paths — an admin-entered external URL is
        // rejected at resolve time (defence in depth behind the admin
        // form's own href validation).
        if (!isInternalHref(href)) return null;
      }
    }
    parsed.push({
      heading: section.heading,
      paragraphs: section.paragraphs as string[],
      list: section.list as string[] | undefined,
      links: section.links as StaticSectionLink[] | undefined,
    });
  }
  return { title, sections: parsed };
}

/** A FAQ-page override: well-formed title + Q/A items. */
export function pickFaqPageOverride(value: unknown): FaqPageContent | null {
  if (typeof value !== "object" || value === null) return null;
  const { title, items } = value as Record<string, unknown>;
  if (typeof title !== "string" || title.trim().length === 0) return null;
  const parsed = pickFaqOverride(items);
  if (!parsed) return null;
  return { title, items: parsed };
}

/* ── Locale helper ─────────────────────────────────────────────── */

export function localeValue(entry: { en?: unknown; ar?: unknown } | undefined, isAr: boolean): unknown {
  if (!entry) return undefined;
  return isAr ? entry.ar : entry.en;
}
