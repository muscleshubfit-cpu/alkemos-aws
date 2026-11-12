import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * B1 ROUTE-LEVEL PROOF (Execution-Path Audit §8.2 B1 — owner order
 * 2026-10-01): the diagnostics channel END-TO-END at the route layer —
 *
 *   P5 battery failure → 500 body { error, rerunTarget: "p4-review",
 *                                 repairDiagnostics: <violations> }
 *   P5 word-floor      → 500 body { error, rerunTarget: "p2-content" }
 *                        (NO repairDiagnostics — B1 is p4-scoped)
 *   P5 infra failure   → 500 body { error } (legacy shape, no contract)
 *   P4 ?repairDiagnostics=<text> → reviewAndEnhance receives the text
 *   P4 (no param)      → reviewAndEnhance receives undefined
 *
 * The `error` field stays VERBATIM in every case (the R1 contract body
 * is only EXTENDED, never reworded — the blog-repair-target map and
 * its canaries ride the unchanged message).
 */

vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/blog-server", () => ({ normalizeCategory: vi.fn((c: string) => c || "training") }));
vi.mock("@/lib/blog-link-verify", () => ({
  verifyBodyLinks: vi.fn(async (md: string) => ({
    checked: [],
    dead: [],
    unverified: [],
    skipped: [],
    md,
  })),
}));

vi.mock("@/lib/blog-queue", () => ({
  getQueueIdParam: vi.fn(),
  fetchQueueItem: vi.fn(),
  validateQueueStatus: vi.fn(),
  requireRowLang: vi.fn(),
  updateQueueItem: vi.fn(async () => null),
  markQueueItemFailed: vi.fn(async () => null),
  findRecentPairRows: vi.fn(async () => []),
  countAutomatedPublishedToday: vi.fn(async () => 0),
  countAutomatedPublishedThisWeek: vi.fn(async () => 0),
  BLOG_WEEKLY_QUOTA_PER_LANG: 2,
  bundleMarksCoachRequest: vi.fn(() => false),
  stampQueueRowRepairDirective: vi.fn(async () => undefined),
}));
vi.mock("@/lib/blog-topics", () => ({
  getRecentPostsByLanguage: vi.fn(async () => []),
}));

// reviewAndEnhance is the seam the p4 tests need controlled (arg
// capture); everything else (countWords, splitFaqSection, …) stays
// real so the behavioral surface is the production code.
vi.mock("@/lib/blog-pipeline", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/blog-pipeline")>();
  return {
    ...orig,
    reviewAndEnhance: vi.fn(async () => ({
      markdown: "## Reviewed\n\n" + "solid reviewed advice with depth. ".repeat(40),
      report: {
        changesSummary: ["proofread"],
        keywordCoverage: "good" as const,
        factCheckNotes: "ok",
      },
      internalLinks: [],
      externalLinks: [],
      source: "route-test-model",
    })),
  };
});

// Supabase admin mock — insert error togglable for the P5 infra case.
let INSERT_FAILS = false;
vi.mock("@/lib/supabase/admin", () => {
  const result = (data: unknown) => ({ data, error: null });
  const builder = () => ({
    select: () => builder(),
    eq: () => builder(),
    ilike: () => builder(),
    order: () => builder(),
    limit: () => result([]),
    maybeSingle: async () => result(null),
    single: async () => result({ id: "post-123", slug: "x" }),
  });
  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: {
      from: vi.fn((table: string) =>
        table === "blog_posts"
          ? {
              ...builder(),
              insert: () => ({
                select: () => ({
                  single: async () =>
                    INSERT_FAILS
                      ? { data: null, error: { message: "relation blog_posts does not exist" } }
                      : result({ id: "post-123", slug: "x" }),
                }),
              }),
              update: () => builder(),
            }
          : builder(),
      ),
    },
  };
});

import { GET as p5Publish } from "@/app/api/cron/blog/p5-publish/route";
import { GET as p4Review } from "@/app/api/cron/blog/p4-review/route";
import * as blogQueue from "@/lib/blog-queue";
import { reviewAndEnhance } from "@/lib/blog-pipeline";

const P5_ROW = "b1-p5-row";
const P4_ROW = "b1-p4-row";

/** ≥1300 words, 5 H2s, grammatical anchors + one authority link — but
 * NO FAQ section (FAQ count 0 → battery G3 failure → p4-review target).
 * The same live 38f230fb shape the R1 contract test rides. */
function longDraftWithoutFaq(): string {
  const filler = "Home training builds strength when you follow a sensible plan and recover well. ".repeat(90);
  return [
    "## Why Training at Home Works",
    filler,
    "Start with [the complete guide](/blog/a) for the fundamentals.",
    "## Equipment You Actually Need",
    filler,
    "## The Weekly Training Split",
    filler,
    "## Nutrition That Supports Growth",
    "General guidance from [WHO healthy diets](https://www.who.int/news-room/fact-sheets/healthy-diet) supports a balanced approach.",
    filler,
    "## Tracking Your Progress",
    filler,
  ].join("\n");
}

function p5Row(markdown: string, lang: "en" | "ar" = "en") {
  return {
    id: P5_ROW,
    language: lang,
    status: "reviewed",
    topic: "home muscle building",
    focus_keyword: "build muscle at home",
    category: "training",
    article_bundle: JSON.stringify({
      outline: {
        title: "How to Build Muscle at Home: The Complete Guide",
        slugBase: "build-muscle-home-complete-guide",
        metaDescription: "How to build muscle at home with a weekly plan, nutrition and tracking.",
        lsiKeywords: [],
      },
      review: { markdown },
      images: [],
    }),
  };
}

function p4Row() {
  return {
    id: P4_ROW,
    language: "en" as const,
    status: "failed", // the R1 loop re-enters P4 on failed rows
    topic: "home muscle building",
    focus_keyword: "build muscle at home",
    category: "training",
    article_bundle: JSON.stringify({
      research0: { keywords: ["build muscle"], faqs: [] },
      outline: {
        title: "How to Build Muscle at Home: The Complete Guide",
        subtitle: "s",
        metaDescription: "d",
        slugBase: "build-muscle-home-guide",
        sections: ["s1", "s2", "s3", "s4", "s5"],
        lsiKeywords: [],
        imagePlan: [],
      },
      content: { markdown: "## One\n" + "plain training advice text. ".repeat(90), words: 1400, source: "old-model" },
      images: [{ url: "https://images.example/x.jpg", alt: "x", credit: "x" }],
    }),
  };
}

function req(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  INSERT_FAILS = false;
  (blogQueue.getQueueIdParam as ReturnType<typeof vi.fn>).mockImplementation(
    (r: { url: string }) => new URL(r.url).searchParams.get("queueId"),
  );
  (blogQueue.validateQueueStatus as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (blogQueue.requireRowLang as ReturnType<typeof vi.fn>).mockImplementation(
    (qi: { language: string }) => qi.language,
  );
  (blogQueue.countAutomatedPublishedToday as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (blogQueue.bundleMarksCoachRequest as ReturnType<typeof vi.fn>).mockReturnValue(false);
});

// ─────────────────────────────────────────────────────────────────
// P5 — the 500 body carries the violations for p4-review targets
// ─────────────────────────────────────────────────────────────────

describe("B1 · P5 500 body carries repairDiagnostics (p4-review targets)", () => {
  it("battery failure → repairDiagnostics = violations, error stays VERBATIM", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(longDraftWithoutFaq()),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string; repairDiagnostics?: string };
    // the legacy error message is byte-identical (map + canaries ride it)
    expect(body.error).toBe(
      "p5: quality-gate battery failed — FAQ count 0 outside the 4-7 range — rerun p4-review",
    );
    expect(body.rerunTarget).toBe("p4-review");
    // the diagnostics carry the violations WITHOUT the p5: prefix and
    // WITHOUT the "— rerun p4-review" tail (pure directive text)
    expect(body.repairDiagnostics).toBe("quality-gate battery failed — FAQ count 0 outside the 4-7 range");
  });

  it("latin body gate failure → repairDiagnostics names the tokens (the AR path)", async () => {
    // A realistic AR row: Arabic title/focus, 5 Arabic H2s, ≥1300 words,
    // a grammatical WHO authority link, 4 relevant Arabic FAQs — the row
    // passes the WHOLE battery and dies at the Phase-176 body Latin gate
    // on two bare Latin tokens planted in the prose (the exact class the
    // R2 dictionary pass misses: non-dictionary supplement tokens).
    const arFiller = "التدريب المنزلي يبني القوة عندما تتبع خطة معقولة وتستعيد جيدًا. ".repeat(160);
    const arBody = [
      "## لماذا ينجح التدريب المنزلي",
      arFiller,
      "## الأدوات التي تحتاجها فعلًا",
      arFiller,
      "## خطة التمرين الأسبوعية",
      arFiller + " مع creatine leucine في الجرعة الموصى بها. ",
      "## التغذية التي تدعم النمو",
      `توصيات من [منظمة الصحة العالمية](https://www.who.int/news-room/fact-sheets/healthy-diet) تدعم النهج المتوازن.`,
      arFiller,
      "## تتبع تقدمك",
      arFiller,
    ].join("\n");
    const arFaq = [
      "## الأسئلة الشائعة",
      "**كم يومًا في الأسبوع لبناء العضلات في المنزل؟**",
      "ثلاث إلى أربع جلسات أسبوعية تكفي لمعظم المتدربين.",
      "**هل يمكن بناء العضلات في المنزل بدون أدوات؟**",
      "نعم بتمارين وزن الجسم مع التقدم التدريجي.",
      "**متى تظهر نتائج بناء العضلات في المنزل؟**",
      "غالبًا خلال ثمانية إلى اثني عشر أسبوعًا منتظمًا.",
      "**هل التمرين في المنزل كافٍ لبناء العضلات؟**",
      "نعم إذا انتظمت شدة التقدم والحصة الأسبوعية.",
    ].join("\n");
    const row = p5Row(`${arBody}\n${arFaq}`, "ar");
    const bundle = JSON.parse(row.article_bundle as string);
    bundle.outline.title = "كيف تبني العضلات في المنزل: الدليل الكامل";
    row.article_bundle = JSON.stringify(bundle);
    // the relevance hint rides title + focus — an AR row carries an AR focus
    (row as { focus_keyword: string }).focus_keyword = "بناء العضلات في المنزل";
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({ data: row, error: null });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string; repairDiagnostics?: string };
    expect(body.rerunTarget).toBe("p4-review");
    // the battery itself PASSED (this row's failure is the latin gate)…
    expect(body.error).not.toContain("quality-gate battery failed");
    expect(body.error).toContain("latin contamination in final body");
    expect(body.error).toContain("rerun p4-review");
    // …and the diagnostics carry the actionable token list, stripped
    expect(body.repairDiagnostics).toContain("latin contamination in final body");
    expect(body.repairDiagnostics).toContain("creatine");
    expect(body.repairDiagnostics).not.toContain("rerun p4-review");
  });

  it("word-floor failure → p2-content target carries NO repairDiagnostics (B1 is p4-scoped)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row("## Short\n\nOnly forty words long and it must fail the floor gate here."),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string; repairDiagnostics?: string };
    expect(body.rerunTarget).toBe("p2-content");
    expect(body.repairDiagnostics).toBeUndefined();
  });

  it("infra failure → legacy body (no rerunTarget, no repairDiagnostics)", async () => {
    INSERT_FAILS = true;
    const faqBlock = [
      "## Frequently Asked Questions",
      "**How many days a week should I build muscle at home?**",
      "Answer for home muscle days.",
      "**Can I build muscle at home without equipment?**",
      "Answer for equipment.",
      "**How long until I see results building muscle at home?**",
      "Answer for results.",
      "**Is home training enough to build muscle?**",
      "Answer for sufficiency.",
    ].join("\n");
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(`${longDraftWithoutFaq()}\n${faqBlock}`),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string; repairDiagnostics?: string };
    expect(body.error).toContain("Post insert");
    expect(body.rerunTarget).toBeUndefined();
    expect(body.repairDiagnostics).toBeUndefined();
  });

  it("missing reviewed artifacts → p4-review target still carries its (terse) diagnostics", async () => {
    const row = p5Row("ignored");
    row.article_bundle = JSON.stringify({ outline: { title: "x" } }); // no review.markdown
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({ data: row, error: null });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string; repairDiagnostics?: string };
    expect(body.rerunTarget).toBe("p4-review");
    expect(body.repairDiagnostics).toBe("missing reviewed artifacts");
  });
});

// ─────────────────────────────────────────────────────────────────
// P4 — the route threads ?repairDiagnostics into reviewAndEnhance
// ─────────────────────────────────────────────────────────────────

describe("B1 · p4-review threads the directive into reviewAndEnhance", () => {
  it("with ?repairDiagnostics → the 5th arg is the directive text (200 + repairDirected)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p4Row(),
      error: null,
    });
    const diag = "quality-gate battery failed — FAQ count 3 outside the 4-7 range";
    const res = await p4Review(
      req(`http://localhost:3000/api/cron/blog/p4-review?queueId=${P4_ROW}&repairDiagnostics=${encodeURIComponent(diag)}`),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; repairDirected?: boolean };
    expect(body.ok).toBe(true);
    expect(body.repairDirected).toBe(true);
    expect(reviewAndEnhance).toHaveBeenCalledTimes(1);
    const call = (reviewAndEnhance as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[4]).toBe(diag);
  });

  it("without the param → the 5th arg is undefined (normal-run prompt, no flag)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p4Row(),
      error: null,
    });
    const res = await p4Review(req(`http://localhost:3000/api/cron/blog/p4-review?queueId=${P4_ROW}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; repairDirected?: boolean };
    expect(body.ok).toBe(true);
    expect(body.repairDirected).toBeUndefined();
    const call = (reviewAndEnhance as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[4]).toBeUndefined();
  });

  it("an empty ?repairDiagnostics= → treated as absent (no directive, no flag)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p4Row(),
      error: null,
    });
    const res = await p4Review(
      req(`http://localhost:3000/api/cron/blog/p4-review?queueId=${P4_ROW}&repairDiagnostics=`),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { repairDirected?: boolean };
    expect(body.repairDirected).toBeUndefined();
    const call = (reviewAndEnhance as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[4]).toBeUndefined();
  });
});
