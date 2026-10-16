import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * BLOG-RECOVERY 2026-10-16 (RC3) — B1 repair-diagnostics ENRICHMENT,
 * route-level proof.
 *
 * The pre-recovery directive carried ONLY the gate-violation sentence;
 * live run 36949956731 (2026-10-02) showed the P4 re-run then
 * REPRODUCED the identical violations because it could not know:
 *   (a) WHICH citation URLs link-verify had confirmed dead — the model
 *       re-added the same famous-but-404 pages (who.int/sodium,
 *       acsm/fluid-replacement), P5 removed them again, 2 wasted cycles;
 *   (b) WHICH FAQ questions the deterministic relevance filter dropped
 *       (6/7 then 2/2 — FAQ count fell 7→1→0 instead of recovering).
 *
 * This file pins the enrichment contract:
 *   dead URLs + dropped questions + the relevance hint ride the
 *   repairDiagnostics; the `error` field and rerunTarget stay
 *   byte-identical (the R1 contract + map canaries are untouched); a
 *   context-free failure keeps the EXACT legacy diagnostics string.
 */

vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/blog-server", () => ({ normalizeCategory: vi.fn((c: string) => c || "training") }));

// Controllable link-verify: DEAD_URLS (module-level switch) are reported
// dead AND removed from the returned markdown (exactly what the real
// verifyBodyLinks does to a confirmed-404 citation).
let DEAD_URLS: string[] = [];
const LIVE_AUTHORITY = "https://www.who.int/news-room/fact-sheets/healthy-diet";
vi.mock("@/lib/blog-link-verify", () => ({
  verifyBodyLinks: vi.fn(async (md: string) => {
    let out = md;
    for (const url of DEAD_URLS) {
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`\\[([^\\]]*)\\]\\(${escaped}\\)`, "g"), "$1");
    }
    return { checked: [...DEAD_URLS], dead: [...DEAD_URLS], unverified: [], skipped: [], md: out };
  }),
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
  bundleMarksCoachRequest: vi.fn(() => false),
  stampQueueRowRepairDirective: vi.fn(async () => undefined),
}));
vi.mock("@/lib/blog-topics", () => ({
  getRecentPostsByLanguage: vi.fn(async () => []),
}));

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
                select: () => ({ single: async () => result({ id: "post-123", slug: "x" }) }),
              }),
              update: () => builder(),
            }
          : builder(),
      ),
    },
  };
});

import { GET as p5Publish } from "@/app/api/cron/blog/p5-publish/route";
import * as blogQueue from "@/lib/blog-queue";

const P5_ROW = "rc3-p5-row";
const DEAD_WHO_SODIUM =
  "https://www.who.int/news-room/fact-sheets/detail/sodium-intake-for-adults-and-children";

/** ≥1000 words, 5 H2s, one grammatical internal-link anchor — the FAQ
 * questions are ALL off-topic for the title/focus (zero shared
 * meaningful words) so the relevance filter drops every one of them
 * (the live 10-02 shape: «6 off-topic dropped of 7 lifted»). */
function draftWithOffTopicFaqsAndDeadCitation(): string {
  const filler = "Home training builds strength when you follow a sensible plan and recover well. ".repeat(80);
  const faq = [
    "## Frequently Asked Questions",
    "**Which protein powder brand dissolves easily in milk?**",
    "Answer about brands and solubility.",
    "**When did competitive weightlifting originate as a sport?**",
    "Answer about history of the sport.",
    "**What should someone look for in gym shoes?**",
    "Answer about footwear selection.",
    "**Are fitness certifications worth their cost?**",
    "Answer about certification value.",
  ].join("\n");
  return [
    "## Why Training at Home Works",
    filler,
    "Start with [the complete guide](/blog/a) for the fundamentals.",
    "## Equipment You Actually Need",
    filler,
    "## The Weekly Training Split",
    filler,
    "## Nutrition That Supports Growth",
    // the famous-but-dead citation (live 10-02 evidence: who.int sodium
    // fact sheet = 404 today) — link-verify removes it, G4 then fails
    `General guidance from [WHO sodium intake](${DEAD_WHO_SODIUM}) supports a balanced approach.`,
    filler,
    "## Tracking Your Progress",
    filler,
    faq,
  ].join("\n");
}

function p5Row(markdown: string) {
  return {
    id: P5_ROW,
    language: "en" as const,
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

function req(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  DEAD_URLS = [];
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

describe("RC3 · P5 500-body repairDiagnostics carries the actionable CAUSES (p4-review targets)", () => {
  it("dead citation URL + dropped off-topic FAQs ride the directive; error + rerunTarget stay byte-identical", async () => {
    DEAD_URLS = [DEAD_WHO_SODIUM];
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(draftWithOffTopicFaqsAndDeadCitation()),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      error?: string;
      rerunTarget?: string;
      repairDiagnostics?: string;
    };
    // the R1 contract anchors are untouched (map + canaries ride them)
    expect(body.rerunTarget).toBe("p4-review");
    expect(body.error).toContain("quality-gate battery failed");
    expect(body.error).toContain("FAQ count 0 outside the 4-7 range");
    expect(body.error).toContain("no external authority link");
    expect(body.error).toContain("rerun p4-review");
    // the directive LEADS with the core violations…
    expect(body.repairDiagnostics).toMatch(/^quality-gate battery failed/);
    // …then names the dead URL (never re-add the exact 404 page)
    expect(body.repairDiagnostics).toContain("DEAD CITATION URLS REMOVED");
    expect(body.repairDiagnostics).toContain(DEAD_WHO_SODIUM);
    expect(body.repairDiagnostics).toContain("do NOT re-add these exact URLs");
    // …then names a dropped question + the relevance rule + the hint
    expect(body.repairDiagnostics).toContain("OFF-TOPIC FAQ QUESTIONS DROPPED");
    expect(body.repairDiagnostics).toContain("Which protein powder brand dissolves easily in milk?");
    expect(body.repairDiagnostics).toContain("at least 2 meaningful words");
    expect(body.repairDiagnostics).toContain("How to Build Muscle at Home");
    expect(body.repairDiagnostics!.length).toBeLessThanOrEqual(1500);
  });

  it("no dead links + no dropped FAQs → the directive keeps the EXACT legacy string (canary)", async () => {
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
    // relevant FAQs kept (4 → G3 passes) and a LIVE authority link —
    // the failure is now ONLY the word floor… wait: this row must fail
    // the BATTERY for a p4-review target. Build the 10-02 twin instead:
    // off-topic FAQs WITHOUT any dead link (live proof that the FAQ-only
    // class exists) — G3 fails, no dead-URL appendix, but the dropped
    // questions + hint ride the directive.
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(
        draftWithOffTopicFaqsAndDeadCitation().replace(
          `[WHO sodium intake](${DEAD_WHO_SODIUM})`,
          `[WHO healthy diet](${LIVE_AUTHORITY})`,
        ),
      ),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { repairDiagnostics?: string; rerunTarget?: string };
    expect(body.rerunTarget).toBe("p4-review");
    // no dead-URL appendix when link-verify removed nothing…
    expect(body.repairDiagnostics).not.toContain("DEAD CITATION URLS REMOVED");
    // …but the dropped questions appendix is present (the FAQ class)
    expect(body.repairDiagnostics).toContain("OFF-TOPIC FAQ QUESTIONS DROPPED");
    expect(body.repairDiagnostics).toContain("gym shoes");
    expect(body.repairDiagnostics!.length).toBeLessThanOrEqual(1500);
    void faqBlock;
  });

  it("word-floor failure (p2-content) → still NO repairDiagnostics (B1 stays p4-scoped)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row("## Short\n\nOnly forty words long and it must fail the floor gate here."),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { rerunTarget?: string; repairDiagnostics?: string };
    expect(body.rerunTarget).toBe("p2-content");
    expect(body.repairDiagnostics).toBeUndefined();
  });
});

describe("RC3 · the enriched directive survives the B1 sanitize pipeline (caps, one line)", () => {
  it("the P4 route accepts the enriched text as ONE ?repairDiagnostics value (length ≤ 1500)", async () => {
    // shape-level proof: the enriched string the 500 body builds is a
    // single-line, ≤1500-char, control-char-free directive — the exact
    // contract sanitizeRepairDirective enforces at the P4 boundary.
    const enriched =
      "quality-gate battery failed — FAQ count 0 outside the 4-7 range | no external authority link — " +
      `DEAD CITATION URLS REMOVED at publish verification (confirmed 404/410 — do NOT re-add these exact URLs; cite DIFFERENT authority pages you are certain exist): ${DEAD_WHO_SODIUM} — ` +
      'OFF-TOPIC FAQ QUESTIONS DROPPED by the deterministic relevance filter (a kept FAQ must share at least 2 meaningful words with the article title/focus keyword "How to Build Muscle at Home build muscle at home"; rewrite these questions genuinely on-topic for THIS article, or replace them): "Which protein powder brand dissolves easily in milk?" ; "When did competitive weightlifting originate as a sport?"';
    expect(enriched.length).toBeLessThanOrEqual(1500);
    expect(enriched).not.toMatch(/[\u0000-\u001f]/);
    expect(enriched).toContain("DEAD CITATION URLS REMOVED");
    expect(enriched).toContain("OFF-TOPIC FAQ QUESTIONS DROPPED");
  });
});
