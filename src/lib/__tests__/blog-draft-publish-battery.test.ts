import { describe, it, expect } from "vitest";
import {
  AI_DRAFT_SOURCE,
  AI_DRAFT_PUBLISH_WORD_FLOOR,
  manualPublishBatteryApplies,
  runAiDraftPublishBattery,
} from "@/lib/blog-quality-gates";
import { countWords } from "@/lib/blog-pipeline";
import type { GateLang } from "@/lib/blog-quality-gates";

/**
 * PHASE 5-D (stage د — owner order 2026-10-31 «نفّذ جميع المراحل
 * المتبقية» approving Phase-4 §12-5): the MANUAL-PUBLISH BATTERY for AI
 * drafts (the Phase-2 §7-د design verbatim — reuse, no new logic).
 *
 * Pinned here:
 *   • The SCOPE law: the battery applies ONLY to source
 *     'ai:article_generate' rows that are going published — manual
 *     articles and unpublished saves are exempt.
 *   • The three gates reuse the automated P5 publish's deterministic
 *     laws: word floor 1000 (the P5 floor) · G4 authority ≥1 (the same
 *     findAuthorityLinks) · HEAD link verification (the same
 *     verifyBodyLinks — confirmed-dead 404/410 links are violations
 *     named for the human; inconclusive verdicts stay fail-open).
 *   • The word-count parity canary: the battery's inline count stays
 *     byte-identical to blog-pipeline's countWords.
 */

const AUTHORITY_LINK =
  "[NIH Office of Dietary Supplements](https://ods.od.nih.gov/factsheets/Creatine-HealthProfessional/)";

function words(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
}

function body(wordsN: number, withAuthority = false): string {
  return `${words(wordsN)}${withAuthority ? `\n\nSee ${AUTHORITY_LINK} for details.` : ""}`;
}

/** All-heads-OK fetch stub — canaries never touch the network. */
const okFetch = async () => ({ status: 200 }) as unknown as Response;

describe("Phase 5-D — the manual-publish battery SCOPE law (ai:article_generate ONLY)", () => {
  it("applies ONLY to the AI-draft source going published", () => {
    expect(manualPublishBatteryApplies(AI_DRAFT_SOURCE, true)).toBe(true);
    // every other source — manual articles above all — is exempt
    expect(manualPublishBatteryApplies(undefined, true)).toBe(false);
    expect(manualPublishBatteryApplies(null, true)).toBe(false);
    expect(manualPublishBatteryApplies("", true)).toBe(false);
    expect(manualPublishBatteryApplies("manual", true)).toBe(false);
    expect(manualPublishBatteryApplies("ai:article_generate_v2", true)).toBe(false);
    // and an unpublished save never triggers it
    expect(manualPublishBatteryApplies(AI_DRAFT_SOURCE, false)).toBe(false);
  });

  it("the source constant matches the fallback path's stamp", () => {
    expect(AI_DRAFT_SOURCE).toBe("ai:article_generate");
  });
});

describe("Phase 5-D — the battery's three gates (P5's deterministic laws)", () => {
  it("word floor: 999 words → violation · exactly 1000 words → no word violation (the SAME floor P5 enforces)", async () => {
    expect(AI_DRAFT_PUBLISH_WORD_FLOOR).toBe(1000);

    // short body: 999 words TOTAL (no authority suffix — the G4 violation
    // is irrelevant to this assertion; we pin the word-floor line only).
    const short = await runAiDraftPublishBattery({ lang: "en", bodyMd: words(999), fetchImpl: okFetch as never });
    expect(short.wordCount).toBe(999);
    expect(short.violations.some((v) => v.includes("999 words"))).toBe(true);

    // exact-floor body: TOTAL is exactly 1000 words (authority link
    // included) — self-adjusting by construction.
    const authTail = `\n\nSee ${AUTHORITY_LINK} for details.`;
    const exactMd = words(1000 - countWords(authTail)) + authTail;
    expect(countWords(exactMd)).toBe(1000);
    const exact = await runAiDraftPublishBattery({ lang: "en", bodyMd: exactMd, fetchImpl: okFetch as never });
    expect(exact.wordCount).toBe(1000);
    expect(exact.violations.some((v) => v.includes("words (<"))).toBe(false);
  });

  it("G4: no authority link → violation · authority link present → none (the YMYL E-E-A-T floor)", async () => {
    const noAuthority = await runAiDraftPublishBattery({ lang: "en", bodyMd: body(1100, false), fetchImpl: okFetch as never });
    expect(noAuthority.violations.some((v) => v.includes("no external authority link"))).toBe(true);

    const withAuthority = await runAiDraftPublishBattery({ lang: "ar", bodyMd: body(1100, true), fetchImpl: okFetch as never });
    expect(withAuthority.violations.some((v) => v.includes("no external authority link"))).toBe(false);
    expect(withAuthority.violations).toHaveLength(0);
  });

  it("HEAD verification: a CONFIRMED-dead citation (404) is a named violation; an inconclusive verdict (403) stays fail-open", async () => {
    // The battery threads verifyBodyLinks' injectable fetchImpl (the same
    // seam its own tests use) — no network in this canary.
    const deadFetch = async () => ({ status: 404 }) as unknown as Response;
    const refusedFetch = async () => ({ status: 403 }) as unknown as Response;
    const md = body(1100, true);
    const deadUrl = "https://ods.od.nih.gov/factsheets/Creatine-HealthProfessional/";

    const dead = await runAiDraftPublishBattery({ lang: "en", bodyMd: md, fetchImpl: deadFetch as never });
    expect(dead.deadLinks).toContain(deadUrl);
    expect(dead.violations.some((v) => v.includes("confirmed-dead citation link(s)"))).toBe(true);
    expect(dead.violations.some((v) => v.includes(deadUrl))).toBe(true);

    const refused = await runAiDraftPublishBattery({ lang: "en", bodyMd: md, fetchImpl: refusedFetch as never });
    expect(refused.deadLinks).toHaveLength(0); // fail-open: refused HEAD never costs a citation
    expect(refused.unverifiedLinks).toContain(deadUrl);
    expect(refused.violations.some((v) => v.includes("confirmed-dead"))).toBe(false);
    expect(refused.violations).toHaveLength(0); // words + G4 + link gates all pass
  });

  it("the word-count parity canary: the battery's inline count is byte-identical to blog-pipeline's countWords", async () => {
    for (const md of ["", "one two three", body(1234, true), "  spaced   out\ttabs\nnewlines  "]) {
      const r = await runAiDraftPublishBattery({ lang: "en", bodyMd: md, fetchImpl: okFetch as never });
      expect(r.wordCount).toBe(countWords(md));
    }
  });
});

describe("Phase 5-D — the battery result contract (the editor's teaching message)", () => {
  it("returns violations + link verdicts + wordCount for the toast", async () => {
    const r = await runAiDraftPublishBattery({ lang: "en", bodyMd: body(500, false), fetchImpl: okFetch as never });
    expect(r.violations.length).toBe(2); // word floor + G4
    expect(r.wordCount).toBe(500);
    expect(Array.isArray(r.deadLinks)).toBe(true);
    expect(Array.isArray(r.unverifiedLinks)).toBe(true);
  });
});
