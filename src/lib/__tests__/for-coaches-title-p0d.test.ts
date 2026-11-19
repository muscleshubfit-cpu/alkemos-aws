import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * ORGANIC-GROWTH-P0-D — the for-coaches <title> canary
 * (roadmap docs/organic-growth-system-2026-11-18/10 field 8:
 * «طول العنوانين ≤70 + لا تكرار علامة» enforced as an automated text
 * check, exactly as the acceptance criterion field 9 requires).
 *
 * The defect (audit 01-current-state-audit §metadata):
 *   AR — the plain string title fed the /ar root template "%s — Alkemos"
 *   → rendered 71 chars with the brand TWICE («انضم كمدرب في Alkemos — …
 *   — Alkemos»). EN — no group suffix at all (every other EN commercial
 *   surface ends "… | Alkemos").
 *
 * The fix (10 field 4, pinned verbatim):
 *   AR: title: { absolute: "انضم كمدرب في Alkemos — عملاؤك وأسعارك
 *        وأموالك بين يديك" } — absolute bypasses the template.
 *   EN: "Coach Platform — Your Clients, Your Prices, Your Money | Alkemos"
 *        — brand-free lead + the ONE group suffix (the old lead itself
 *        carried "Alkemos", so a suffix would have doubled the brand).
 *
 * Scope discipline (P0-D touches the <title> ONLY): og:title and
 * twitter:title are pinned to their pre-P0-D strings — any drift here
 * is a scope violation and fails this canary.
 *
 * Previous-fix preservation: SEO-GEO-4 (2026-09-08) pinned the
 * /ar/for-coaches/register deep title with its EXPLICIT brand because
 * the intermediate layout absorbs the /ar template chain — that law is
 * re-pinned here so the P0-D absolute switch can never silently reopen
 * the template chain under the register subtree.
 */

const EN_LAYOUT = "src/app/(en)/for-coaches/layout.tsx";
const AR_LAYOUT = "src/app/(ar)/ar/for-coaches/layout.tsx";
const AR_REGISTER = "src/app/(ar)/ar/for-coaches/register/layout.tsx";

const EN_TITLE = "Coach Platform — Your Clients, Your Prices, Your Money | Alkemos";
const AR_TITLE = "انضم كمدرب في Alkemos — عملاؤك وأسعارك وأموالك بين يديك";

// Pre-P0-D og/twitter strings — the scope pins (must survive verbatim).
const EN_OG_TWITTER = "Coach on Alkemos — your clients, your prices, your money";
const AR_OG = "انضم كمدرب في Alkemos — درِّب عملاءك بأسعارك وأموالك بين يديك";
const AR_TWITTER = "انضم كمدرب في Alkemos — عملاؤك بأسعارك وأموالك بين يديك";

const CEILING = 70; // the P0-D roadmap law (field 8) — tighter than the site-wide 75
const BRAND = "Alkemos";

function read(p: string): string {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing layout file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
}

describe("P0-D — EN title: group convention, one brand, ≤70", () => {
  it("the EN layout title is the pinned P0-D string (verbatim)", () => {
    expect(read(EN_LAYOUT)).toContain(`title: "${EN_TITLE}",`);
  });

  it("the EN title fits the ≤70 law (P0-D field 8)", () => {
    expect(EN_TITLE.length).toBeLessThanOrEqual(CEILING);
  });

  it("the EN title carries the brand exactly ONCE and via the group suffix", () => {
    expect(EN_TITLE.split(BRAND).length - 1).toBe(1);
    expect(EN_TITLE.endsWith(" | Alkemos")).toBe(true);
    // The old "Alkemos"-carrying lead is retired from the <title> — a
    // suffix on top of it would have rendered the brand twice.
    expect(EN_TITLE.startsWith("Coach on Alkemos")).toBe(false);
  });
});

describe("P0-D — AR title: absolute bypass, one brand, ≤70", () => {
  it("the AR layout declares title ABSOLUTE — the /ar template «%s — Alkemos» must never append", () => {
    expect(read(AR_LAYOUT)).toContain(`title: { absolute: "${AR_TITLE}" },`);
  });

  it("the AR absolute title fits the ≤70 law (P0-D field 8)", () => {
    expect(AR_TITLE.length).toBeLessThanOrEqual(CEILING);
  });

  it("the AR title carries the brand exactly ONCE (mid-title, per SEO-GEO-4)", () => {
    expect(AR_TITLE.split(BRAND).length - 1).toBe(1);
  });

  it("the AR title does NOT end with the template suffix (no «— Alkemos» tail)", () => {
    expect(AR_TITLE.endsWith("— Alkemos")).toBe(false);
    expect(AR_TITLE.endsWith("| Alkemos")).toBe(false);
  });

  it("the old 61-char template-fed string is retired from the <title> slot", () => {
    // The pre-P0-D string (rendered 71 chars with the double brand) may
    // survive ONLY as the og:title — never as the page <title>.
    const occurrences = read(AR_LAYOUT).split(AR_OG).length - 1;
    expect(occurrences).toBe(1); // og only; a second one = title regression
  });
});

describe("P0-D — scope discipline: og/twitter untouched", () => {
  it("EN og:title and twitter:title keep the pre-P0-D string (exactly the two)", () => {
    const occurrences = read(EN_LAYOUT).split(EN_OG_TWITTER).length - 1;
    expect(occurrences).toBe(2); // og + twitter — the <title> slot is gone
  });

  it("AR og:title keeps the pre-P0-D string (exactly one, inside openGraph)", () => {
    const occurrences = read(AR_LAYOUT).split(AR_OG).length - 1;
    expect(occurrences).toBe(1);
  });

  it("AR twitter:title keeps the pre-P0-D string (exactly one)", () => {
    const occurrences = read(AR_LAYOUT).split(AR_TWITTER).length - 1;
    expect(occurrences).toBe(1);
  });
});

describe("P0-D — previous fixes preserved", () => {
  it("SEO-GEO-4: the register deep title still carries its EXPLICIT brand (no reopened template chain)", () => {
    expect(read(AR_REGISTER)).toContain(
      'title: "تسجيل مدرب — أنشئ حسابك المجاني | Alkemos",',
    );
  });

  it("the register deep title still fits the ≤70 law through its own rendering", () => {
    // Live-verified (SEO-GEO-4): this deep layout receives NO template —
    // the rendered <title> equals the string verbatim.
    expect("تسجيل مدرب — أنشئ حسابك المجاني | Alkemos".length).toBeLessThanOrEqual(
      CEILING,
    );
  });
});
