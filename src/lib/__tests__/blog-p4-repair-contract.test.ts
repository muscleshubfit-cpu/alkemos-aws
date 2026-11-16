import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import type { NextRequest } from "next/server";

/**
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the ROUTE-LEVEL
 * proof for the blog engine's new repair cycle, per the owner's
 * acceptance criteria:
 *
 *   - «العيب القابل للإصلاح يجب أن يُصلح فعليًا قبل اجتياز الجودة»
 *     → P4 with a «حاجة»-carrying AR review output REPAIRS it in-route
 *       and lands "reviewed" with CLEAN markdown (canary 1).
 *   - «تغطية حالات الفشل المتكرر وعدم التحسن»
 *     → an UNFIXABLE defect makes P4 emit the SAME machine-readable
 *       repair contract P5 emits (rerunTarget + repairDiagnostics from
 *       the honest ledger) — the runner's directed chain replaces the
 *       blind ×3 that killed run 43875066747 (canaries 2-3).
 *   - «إثبات أن المحتوى النهائي اجتاز مراجعة الجودة»
 *     → P5 now DETECTS dialect contamination at publish (the gate that
 *       was missing: dialect detection lived only inside the latin
 *       repair's validator) and routes it to the repair contract
 *       (canaries 4-5).
 *   - the runner wrapper EXECUTES the p4 self-repair contract
 *     (source-pinned — canaries 6-8).
 */

vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/blog-server", () => ({ normalizeCategory: vi.fn((c: string) => c || "training") }));
vi.mock("@/lib/blog-link-verify", () => ({
  verifyInternalLinks: vi.fn(async (md: string) => ({ checked: [], removed: [], md })),
  verifyBodyLinks: vi.fn(async (md: string) => ({
    checked: [],
    dead: [],
    unverified: [],
    skipped: [],
    md,
  })),
}));

vi.mock("@/lib/blog-queue", () => ({
  getQueueIdParam: vi.fn((req: NextRequest) => new URL(req.url).searchParams.get("queueId")),
  fetchQueueItem: vi.fn(),
  requireRowLang: vi.fn((qi: { language: string }) => qi.language),
  updateQueueItem: vi.fn(async () => null),
  markQueueItemFailed: vi.fn(async () => null),
  stampQueueRowRepairDirective: vi.fn(async () => undefined),
}));
vi.mock("@/lib/blog-topics", () => ({
  getRecentPostsByLanguage: vi.fn(async () => []),
}));
vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...orig,
    callFreeAIFallbackChain: vi.fn(),
  };
});

// reviewAndEnhance is the seam: its AR output carries the LIVE failure
// shape («حاجة» + bare Latin tokens). Everything else in blog-pipeline
// (the dialect + latin repair passes, ensureFaqSection, splitFaq…)
// stays REAL — the behavioral surface is the production code.
vi.mock("@/lib/blog-pipeline", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/blog-pipeline")>();
  return {
    ...orig,
    reviewAndEnhance: vi.fn(async () => ({
      markdown:
        "## القسم الأول عن التدريب\n\nهذا نص عربي وافٍ عن التدريب لضمان اجتياز فحص النسبة الحتمي عند المصلّح. تحتاج حاجة واحدة مع مصل اللبن whey ومعدل bmr أيضًا.\n\n## القسم الثاني\n\nنص وافٍ ثانٍ لضمان الفحص.\n\n## القسم الثالث\n\nنص وافٍ ثالث لضمان الفحص.",
      report: {
        changesSummary: ["تدقيق لغوي"],
        keywordCoverage: "good" as const,
        factCheckNotes: "ok",
      },
      internalLinks: [],
      externalLinks: [],
      source: "route-test-model",
    })),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(() => {
      const builder = () => ({
        select: () => builder(),
        update: () => builder(),
        eq: () => builder(),
        ilike: () => builder(),
        order: () => builder(),
        limit: () => builder(),
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: { id: "post-1" }, error: null }),
      });
      return {
        ...builder(),
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: "post-1" }, error: null }) }) }),
      };
    }),
  },
}));

import { GET as p4Review } from "@/app/api/cron/blog/p4-review/route";
import * as blogQueue from "@/lib/blog-queue";
import { reviewAndEnhance } from "@/lib/blog-pipeline";
import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
import { mapP5FailureToRerunTarget } from "@/lib/blog-repair-target";

const chain = vi.mocked(callFreeAIFallbackChain);
const P4_ROW = "p4-dialect-row";

function p4Row(lang: "en" | "ar" = "ar") {
  return {
    id: P4_ROW,
    language: lang,
    status: "images_done",
    topic: "arabic muscle building",
    focus_keyword: "بناء العضلات",
    category: "training",
    article_bundle: JSON.stringify({
      research0: { keywords: ["بناء العضلات"], faqs: [] },
      outline: {
        title: "دليل بناء العضلات",
        subtitle: "s",
        metaDescription: "d",
        slugBase: "muscle-guide",
        sections: ["s1", "s2", "s3", "s4", "s5"],
        lsiKeywords: [],
        imagePlan: [],
      },
      content: {
        markdown: "## القسم الأول\n\nنص عربي وافٍ للتوليد لضمان النسبة.\n\n## القسم الثاني\n\nنص وافٍ.",
        words: 900,
        source: "old-model",
      },
      images: [],
    }),
  };
}

function req(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  chain.mockReset();
  vi.mocked(blogQueue.fetchQueueItem).mockResolvedValue({ data: p4Row(), error: null } as never);
});

describe("P4 route — the dialect repair actually fixes the defect (canaries 1-3)", () => {
  it("1. a «حاجة»-carrying AR review output is REPAIRED in-route and lands reviewed with CLEAN markdown", async () => {
    const res = await p4Review(req(`http://test/api/cron/blog/p4-review?queueId=${P4_ROW}`));
    const body = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    // BEFORE (the review model's own output — the live defect class):
    const reviewResult = (reviewAndEnhance as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    const reviewMd = (await reviewResult) as { markdown: string; report?: { changesSummary?: string[] } };
    expect(scanArabicDialect(reviewMd.markdown).weak).toBeGreaterThanOrEqual(1);
    // AFTER (what the route persisted — the owner's before/after proof):
    const update = vi.mocked(blogQueue.updateQueueItem).mock.calls[0]?.[1] as {
      status: string;
      article_bundle: string;
    };
    expect(update.status).toBe("reviewed");
    const bundle = JSON.parse(update.article_bundle) as {
      review: { markdown: string; report?: { changesSummary?: string[] } };
    };
    expect(scanArabicDialect(bundle.review.markdown).weak).toBe(0);
    expect(scanArabicDialect(bundle.review.markdown).strong).toBe(0);
    expect(scanLatinContamination(bundle.review.markdown).count).toBe(0);
    expect(bundle.review.markdown).toContain("شيء");
    // The honest repair note rides the report.
    expect(JSON.stringify(bundle.review.report?.changesSummary ?? [])).toContain("dialect-repair");
    expect(JSON.stringify(bundle.review.report?.changesSummary ?? [])).toContain("latin-repair");
    // Deterministic passes only — the dictionary covered everything here.
    expect(chain).not.toHaveBeenCalled();
  });

  it("2. an UNFIXABLE dialect defect (AI junk) → 500 with the P4 self-repair contract + the honest ledger diagnostics", async () => {
    // «عشان» is NOT in the dictionary (context-dependent) — the AI pass
    // is the only repairer, and it answers junk (the measured class).
    vi.mocked(reviewAndEnhance).mockResolvedValueOnce({
      markdown:
        "## القسم الأول\n\nنص عربي وافٍ عن التدريب لضمان فحص النسبة الحتمي عند المصلّح. عشان تفهم الفرق بوضوح كامل.\n\n## القسم الثاني\n\nنص وافٍ ثانٍ لضمان الفحص.",
      report: { changesSummary: [], keywordCoverage: "good" as const, factCheckNotes: "" },
      internalLinks: [],
      externalLinks: [],
      source: "route-test-model",
    } as never);
    chain.mockResolvedValue({
      text: "we need to replace these words",
      model: "junk-model",
      provider: "junk-provider",
    } as never);

    const res = await p4Review(req(`http://test/api/cron/blog/p4-review?queueId=${P4_ROW}`));
    const body = JSON.parse(await res.text());

    // The markFailed ran — the case is NEVER success (owner criterion #9).
    expect(blogQueue.markQueueItemFailed).toHaveBeenCalledWith(
      P4_ROW,
      expect.stringContaining("quality-repair unfixable"),
    );
    // The 500 body carries the SAME machine-readable contract P5 emits
    // — run-step.mts translates it to exit 3 and run-step.sh's chain
    // re-runs p4-review WITH the directive (the blind ×3 killer is dead).
    expect(res.status).toBe(500);
    expect(body.rerunTarget).toBe("p4-review");
    expect(body.repairDiagnostics).toContain("تعذّر الإصلاح");
    expect(body.repairDiagnostics).toContain("ai-dialect-tokens");
    expect(blogQueue.stampQueueRowRepairDirective).toHaveBeenCalledWith(P4_ROW, "p4-review");
  });

  it("3. a TRANSIENT parse failure (not a gate class) keeps the plain 500 — no fabricated contract", async () => {
    vi.mocked(reviewAndEnhance).mockRejectedValueOnce(
      new Error("P4 ar: invalid review JSON from test:test"),
    );
    const res = await p4Review(req(`http://test/api/cron/blog/p4-review?queueId=${P4_ROW}`));
    const body = JSON.parse(await res.text());
    expect(res.status).toBe(500);
    expect(body.rerunTarget).toBeUndefined();
    expect(body.repairDiagnostics).toBeUndefined();
  });
});

describe("P5 publish gate — dialect detection now EXISTS at publish (canaries 4-5)", () => {
  it("4. an AR body with a STRONG marker is held with the repair contract (was: publishable — the detection hole)", () => {
    // The exact hole: dialect markers with ZERO Latin tokens never
    // triggered anything pre-2026-11-16 (the validator lived inside the
    // latin repair path). This gate closes it.
    const msg = "p5: dialect contamination in final body (strong=1, weak=0: عشان×1) — rerun p4-review";
    expect(mapP5FailureToRerunTarget(msg)).toBe("p4-review");
  });

  it("5. the published-corpus law shape (weak ≥ 5) also routes to the repair contract; below it passes", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: dialect contamination in final body (strong=0, weak=6: حاجة×2, زي×2, كمان×2) — rerun p4-review",
      ),
    ).toBe("p4-review");
    // Infra/unknown classes stay null (closed-set law unchanged).
    expect(mapP5FailureToRerunTarget("p5: Post insert (ar): boom")).toBeNull();
    expect(mapP5FailureToRerunTarget("p5: Unknown")).toBeNull();
  });
});

describe("the runner wrapper EXECUTES the P4 self-repair contract (source pins, canaries 6-8)", () => {
  const SH = readFileSync("scripts/blog-runner/run-step.sh", "utf8");

  it("6. the non-P5 guard now admits exactly the p4-review self-repair (closed-set law extended, not opened)", () => {
    // The guard shape: p5-publish OR (p4-review with target p4-review).
    expect(SH).toContain('[ "$STEP" != "p4-review" ] || [ "$TARGET" != "p4-review" ]');
  });

  it("7. the p4 self-repair chain re-runs p4-review WITH the captured diagnostics (the B1 branch)", () => {
    // The chain's p4 branch now also rides the self-repair case.
    expect(SH).toContain('[ "$RS" = "p4-review" ] && { [ -n "$REPAIR_DIAG" ] || [ "$STEP" = "p4-review" ]; }');
    expect(SH).toContain('MAX_REPAIRS=0 P4_REPAIR_DIAGNOSTICS="$REPAIR_DIAG"');
  });

  it("8. a successful directed re-review EXITS 0 — P5 is the next workflow step, never re-attempted in-run", () => {
    expect(SH).toContain('if [ "$STEP" = "p4-review" ] && [ "$chain_failed" -eq 0 ]; then');
    expect(SH).toContain("P5 runs as the next workflow step");
  });

  it("8b. mutation guard: removing the guard relaxation text breaks this canary (the honest-failure restoration)", () => {
    // The pre-2026-11-16 line ("repair contract from a non-P5 step")
    // survives ONLY inside the relaxed branch — its bare rejection form
    // is gone for p4-review, which is exactly what the pin proves.
    expect(SH).not.toContain(
      'if [ "$STEP" != "p5-publish" ]; then\n      # P0\u2013P4 routes never emit rerunTarget',
    );
  });
});
