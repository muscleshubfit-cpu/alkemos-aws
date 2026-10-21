import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { NextRequest } from "next/server";

/**
 * BLOG-RECOVERY-3 (owner order 2026-10-21 «استكمال دون فقدان العمل») —
 * the RESUME LAW, pinned end-to-end at the route layer:
 *
 *   P0 + my-language failed row (bundle intact)      → RESUME (its queueId returned — no new row, no research burned)
 *   P0 + nothing resumable                           → the legacy ADOPT/JOIN/CREATE walk
 *   P1 + failed row WITH bundle.outline               → resumed:true (the outline survives)
 *   P1 + failed row WITHOUT outline                   → re-process (the failure was AT P1)
 *   P2 + status "writing"                             → re-attemptable (was a 409 dead-end)
 *   P3 + failed row WITH images                       → resumed:true (no re-fetch)
 *   P4 + failed row WITH review (no repair param)     → resumed:true
 *   P4 + failed row WITH review + ?repairDiagnostics  → re-review (the B1 repair contract)
 *
 * The measured live evidence (run 39580182779): the whole P0→P4 chain
 * succeeded (real bilingual research + 2083-word draft + images + review)
 * and P5's quality-gate rejection marked the row failed — the next run
 * created a BRAND-NEW row and every completed artifact was orphaned.
 */

vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/blog-server", () => ({
  normalizeCategory: vi.fn((c: string) => c || "training"),
}));
vi.mock("@/lib/blog-topics", () => ({
  getRecentPostsByLanguage: vi.fn(async () => []),
  getRecentGeneratedTopics: vi.fn(async () => []),
  getRecentContentDigests: vi.fn(async () => []),
  pickRotationCategory: vi.fn(() => "training"),
  isDuplicateTopic: vi.fn(() => ({ duplicate: false, reason: "" })),
}));

const queueState = {
  rows: new Map<string, Record<string, unknown>>(),
};

vi.mock("@/lib/blog-queue", () => ({
  getLangParam: vi.fn(),
  getQueueIdParam: vi.fn(),
  fetchQueueItem: vi.fn(),
  validateQueueStatus: vi.fn(),
  requireRowLang: vi.fn(),
  updateQueueItem: vi.fn(),
  markQueueItemFailed: vi.fn(async () => null),
  findRecentPairRows: vi.fn(async () => []),
  countAutomatedPublishedToday: vi.fn(async () => 0),
  bundleMarksCoachRequest: vi.fn(() => false),
  stampQueueRowRepairDirective: vi.fn(async () => undefined),
  markQueueRowCoachRequested: vi.fn(async () => null),
  findAdoptablePairRow: vi.fn(async () => null),
  findResumableRow: vi.fn(),
}));

vi.mock("@/lib/blog-research", () => ({
  runBilingualResearchPair: vi.fn(),
  runPhase0Research: vi.fn(),
  researchUsedFallback: vi.fn(() => false),
}));

const outlineCalls: Array<{ topic: string }> = [];
vi.mock("@/lib/blog-pipeline", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/blog-pipeline")>();
  return {
    ...orig,
    buildOutline: vi.fn(async (_lang: string, topic: string) => {
      outlineCalls.push({ topic });
      return {
        outline: {
          title: topic,
          sections: [{ h2: "s1" }, { h2: "s2" }, { h2: "s3" }, { h2: "s4" }, { h2: "s5" }],
          imagePlan: [],
          lsiKeywords: [],
        },
      };
    }),
    generateFullArticle: vi.fn(async () => ({
      markdown: "## عنوان\n\n" + "نص تجريبي للمحتوى العربي الجيد ".repeat(120),
      wordCount: 2000,
    })),
    reviewAndEnhance: vi.fn(async () => ({
      markdown: "## مراجعة\n\n" + "نص محتوى جيد بعمق حقيقي للمقال ".repeat(200),
      report: {
        changesSummary: [],
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
      const result = (data: unknown) => ({ data, error: null });
      let lastInsert: unknown = null;
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder.select = chain;
      builder.insert = (payload: unknown) => {
        lastInsert = Array.isArray(payload) ? payload[0] : payload;
        return builder;
      };
      builder.eq = chain;
      builder.ilike = chain;
      builder.order = chain;
      builder.limit = chain;
      builder.single = async () => result(lastInsert);
      builder.maybeSingle = async () => result(lastInsert);
      return builder;
    }),
  },
}));

import { GET as p0GET } from "@/app/api/cron/blog/p0-research/route";
import { GET as p1GET } from "@/app/api/cron/blog/p1-outline/route";
import { GET as p2GET } from "@/app/api/cron/blog/p2-content/route";
import { GET as p3GET } from "@/app/api/cron/blog/p3-images/route";
import { GET as p4GET } from "@/app/api/cron/blog/p4-review/route";
import * as blogQueue from "@/lib/blog-queue";

function req(url: string): NextRequest {
  // The repo's proven route-test pattern (blog-repair-directive-b1-route):
  // a plain { url } object — the routes read new URL(request.url) only
  // (auth is mocked out).
  return { url } as unknown as NextRequest;
}

const UUID = (n: string) => `${n}${n}${n}${n}${n}${n}${n}${n}-${n}${n}${n}${n}-4${n}${n}${n}-8${n}${n}${n}-${n.repeat(12)}`;
const R_STUCK = UUID("2");
const R_P1_KEEP = UUID("3");
const R_P1_REGEN = UUID("4");
const R_P2_WRITE = UUID("5");
const R_P3_KEEP = UUID("6");
const R_P4_KEEP = UUID("7");
const R_P4_REPAIR = UUID("8");

function row(id: string, overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id,
    language: "ar",
    status: "researched",
    created_at: new Date().toISOString(),
    article_bundle: JSON.stringify({
      research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
    }),
    ...overrides,
  };
}

beforeEach(() => {
  queueState.rows.clear();
  outlineCalls.length = 0;
  vi.clearAllMocks();
  // The repo's B1 route-test law: clearAllMocks wipes vi.fn(impl) defaults
  // in this vitest — re-establish every implementation, every test.
  const bq = blogQueue as unknown as Record<string, ReturnType<typeof vi.fn>>;
  bq.getLangParam.mockImplementation(() => "ar");
  bq.getQueueIdParam.mockImplementation(
    (r: { url: string }) => new URL(r.url).searchParams.get("queueId") || undefined,
  );
  // The real fetchQueueItem returns the PostgREST-ish { data, error }.
  bq.fetchQueueItem.mockImplementation(
    async (id: string) => ({ data: queueState.rows.get(id) ?? null, error: null }),
  );
  bq.validateQueueStatus.mockImplementation(
    (qi: { status: string }, expected: string) =>
      qi.status === expected ? null : `expected ${expected}, got ${qi.status}`,
  );
  bq.requireRowLang.mockImplementation(
    (qi: { language: string }) => qi.language as "ar" | "en",
  );
  bq.updateQueueItem.mockImplementation(
    async (id: string, patch: Record<string, unknown>) => {
      const row = queueState.rows.get(id);
      if (row) Object.assign(row, patch);
      return null;
    },
  );
  bq.findResumableRow.mockImplementation(async () => null);
});

// ── P0 — the RESUME branch ────────────────────────────────────────────

describe("BLOG-RECOVERY-3 — P0 RESUME branch", () => {
  it("my-language failed row (≤48h, with completed work) → returned for continuation, NO new row created", async () => {
    const stuck = row(R_STUCK, {
      status: "failed",
      article_bundle: JSON.stringify({
        research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
        outline: { title: "x" },
        content: { markdown: "## d" },
        images: [{ url: "u" }],
        review: { markdown: "## r" },
      }),
    });
    vi.mocked(blogQueue.findResumableRow).mockResolvedValue(stuck as never);
    const res = await p0GET(req(`http://test.local/api/cron/blog/p0-research?lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.queueId).toBe(R_STUCK);
    expect(body.resumed).toBe(true);
    expect(body.pairMode).toBe("resumed");
    expect(body.actual_status).toBe("failed");
    // no research was burned on a fresh CREATE — the resume short-circuits
    const { runBilingualResearchPair } = await import("@/lib/blog-research");
    expect(vi.mocked(runBilingualResearchPair)).not.toHaveBeenCalled();
  });

  it("no resumable row → the legacy CREATE walk proceeds (the research pair runs)", async () => {
    vi.mocked(blogQueue.findResumableRow).mockResolvedValue(null as never);
    const { runBilingualResearchPair } = await import("@/lib/blog-research");
    vi.mocked(runBilingualResearchPair).mockResolvedValue({
      mine: {
        lang: "ar",
        research: { keywords: [{ keyword: "كلمات تجريبية للموضوع", searchVolume: "high" }], faqs: [], topics: ["موضوع تجريبي طويل"] },
        category: "training",
        source: "p0-ar:groq:openai/gpt-oss-120b",
      },
      other: {
        lang: "en",
        research: { keywords: [], faqs: [], topics: ["t"] },
        category: "training",
        source: "p0-en:groq:openai/gpt-oss-20b",
      },
      twinError: null,
    } as never);
    const res = await p0GET(req(`http://test.local/api/cron/blog/p0-research?lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(vi.mocked(runBilingualResearchPair)).toHaveBeenCalledTimes(1);
    expect(body.pairMode).not.toBe("resumed");
  });
});

// ── P1 — artifact-preserving resume on failed rows ────────────────────

describe("BLOG-RECOVERY-3 — P1 outline-preserving resume", () => {
  it("failed row WITH bundle.outline → resumed:true, buildOutline NOT called", async () => {
    queueState.rows.set(
      R_P1_KEEP,
      row(R_P1_KEEP, {
        status: "failed",
        article_bundle: JSON.stringify({
          research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
          outline: { title: "kept" },
        }),
      }),
    );
    const res = await p1GET(req(`http://test.local/api/cron/blog/p1-outline?queueId=${R_P1_KEEP}&lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.resumed).toBe(true);
    expect(outlineCalls).toHaveLength(0);
  });

  it("mid-pipeline statuses (written/images_done/reviewed) → P1 skips idempotently (the RESUME walk re-enters at P1)", async () => {
    for (const st of ["outlined", "writing", "written", "images_done", "reviewed"]) {
      queueState.rows.clear();
      const id = `a${st.length}${st.charCodeAt(0) % 10}`; // deterministic distinct-ish
      queueState.rows.set(
        R_P1_KEEP,
        row(R_P1_KEEP, { status: st }),
      );
      const res = await p1GET(req(`http://test.local/api/cron/blog/p1-outline?queueId=${R_P1_KEEP}&lang=ar`));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.idempotent).toBe(true);
      expect(body.resumed).toBeUndefined(); // plain idempotent skip — no AI burned
    }
    expect(outlineCalls).toHaveLength(0);
  });

  it("failed row WITHOUT outline → re-processed (the failure was AT P1)", async () => {
    queueState.rows.set(R_P1_REGEN, row(R_P1_REGEN, { status: "failed" }));
    const res = await p1GET(req(`http://test.local/api/cron/blog/p1-outline?queueId=${R_P1_REGEN}&lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(outlineCalls).toHaveLength(1);
    expect(queueState.rows.get(R_P1_REGEN)?.status).toBe("outlined");
  });
});

// ── P2 — the "writing" dead-end fix ───────────────────────────────────

describe("BLOG-RECOVERY-3 — P2 writing re-attemptable", () => {
  it("status \"writing\" (crashed mid-write, no draft) → re-attempted, not 409", async () => {
    queueState.rows.set(
      R_P2_WRITE,
      row(R_P2_WRITE, {
        status: "writing",
        article_bundle: JSON.stringify({
          research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
          outline: { title: "x", sections: [], imagePlan: [], lsiKeywords: [] },
        }),
      }),
    );
    const res = await p2GET(req(`http://test.local/api/cron/blog/p2-content?queueId=${R_P2_WRITE}&lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(queueState.rows.get(R_P2_WRITE)?.status).toBe("written");
  });
});

// ── P3 — images-preserving resume ─────────────────────────────────────

describe("BLOG-RECOVERY-3 — P3 images-preserving resume", () => {
  it("failed row WITH sourced images → resumed:true, no re-fetch", async () => {
    queueState.rows.set(
      R_P3_KEEP,
      row(R_P3_KEEP, {
        status: "failed",
        article_bundle: JSON.stringify({
          research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
          outline: { title: "x", sections: [], imagePlan: [{ query: "q" }] },
          images: [{ url: "img1" }, { url: "img2" }],
        }),
      }),
    );
    const res = await p3GET(req(`http://test.local/api/cron/blog/p3-images?queueId=${R_P3_KEEP}&lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.resumed).toBe(true);
    expect(body.images).toBe(2);
  });
});

// ── P4 — review-preserving resume + the B1 repair contract intact ─────

describe("BLOG-RECOVERY-3 — P4 review-preserving resume", () => {
  it("failed row WITH review (no repair param) → resumed:true", async () => {
    queueState.rows.set(
      R_P4_KEEP,
      row(R_P4_KEEP, {
        status: "failed",
        article_bundle: JSON.stringify({
          research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
          outline: { title: "x", sections: [], imagePlan: [], lsiKeywords: [] },
          content: { markdown: "## d\n\nنص " },
          review: { markdown: "## r\n\nنص " },
        }),
      }),
    );
    const res = await p4GET(req(`http://test.local/api/cron/blog/p4-review?queueId=${R_P4_KEEP}&lang=ar`));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.resumed).toBe(true);
  });

  it("failed row WITH review + ?repairDiagnostics → re-review (the B1 repair contract wins over the resume)", async () => {
    queueState.rows.set(
      R_P4_REPAIR,
      row(R_P4_REPAIR, {
        status: "failed",
        article_bundle: JSON.stringify({
          research0: { keywords: [], faqs: [], topics: ["موضوع تجريبي"] },
          outline: { title: "x", sections: [], imagePlan: [], lsiKeywords: [] },
          content: { markdown: "## d\n\nنص " },
          review: { markdown: "## r\n\nنص " },
        }),
      }),
    );
    const res = await p4GET(
      req(`http://test.local/api/cron/blog/p4-review?queueId=${R_P4_REPAIR}&lang=ar&repairDiagnostics=fix%20anchors`),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.resumed).toBeUndefined(); // it RE-RAN
    expect(queueState.rows.get(R_P4_REPAIR)?.status).toBe("reviewed");
  });
});
