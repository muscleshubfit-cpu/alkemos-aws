import { describe, it, expect } from "vitest";

/**
 * R1 REPAIR CONTRACT canaries (Execution-Path Audit §8.2 A1, 2026-09-29
 * — docs/EXECUTION-PATH-AUDIT-AND-RECOVERY-PLAN-2026-09-29.md §3.1/§8.2).
 *
 * These pins are the LIVE error messages of the final failures measured
 * by the audit (blog_generation_queue rows + GHA run 36507693416 logs).
 * They pin message ↔ rerunTarget EXACTLY: if a P5 gate message is ever
 * reworded, one of these canaries fails and the map must be updated in
 * the SAME commit — the repair contract can never drift silently
 * (AGENTS.md §8 REPAIR LOOP LAW + the canary-pinning policy Phase 290).
 */
import {
  P5_RERUN_TARGETS,
  mapP5FailureToRerunTarget,
} from "@/lib/blog-repair-target";

describe("P5_RERUN_TARGETS contract surface", () => {
  it("exposes exactly the two steps the loop may re-run (audit A1)", () => {
    expect([...P5_RERUN_TARGETS]).toEqual(["p2-content", "p4-review"]);
  });
});

describe("mapP5FailureToRerunTarget — word floor → p2-content (G1)", () => {
  it("maps the live 419-word failure (09-28 20:51, run 36481950930)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: article too short (419 words < 1300-word floor) — rerun p2-content",
      ),
    ).toBe("p2-content");
  });

  it("maps the live 1077-word failure (09-28 21:55, run 36489146598)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: article too short (1077 words < 1300-word floor) — rerun p2-content",
      ),
    ).toBe("p2-content");
  });

  it("maps any future word count inside the same deterministic pattern", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: article too short (1299 words < 1300-word floor) — rerun p2-content",
      ),
    ).toBe("p2-content");
  });
});

describe("mapP5FailureToRerunTarget — quality battery → p4-review (G2–G6)", () => {
  it("maps the live FAQ-count-0 + anchors failure (09-29 01:25, run 36507693416 — row 38f230fb)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: quality-gate battery failed — FAQ count 0 outside 4-7 | 2 ungrammatical anchors — rerun p4-review",
      ),
    ).toBe("p4-review");
  });

  it("maps a G4 authority-link floor failure", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: quality-gate battery failed — G4: no external authority link — rerun p4-review",
      ),
    ).toBe("p4-review");
  });

  it("maps a quoted-search-phrase battery failure", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: quality-gate battery failed — 1 quoted search phrase — rerun p4-review",
      ),
    ).toBe("p4-review");
  });
});

describe("mapP5FailureToRerunTarget — latin body gate → p4-review (AR)", () => {
  it("maps the live latin-contamination failure shape (P4 repair class, audit §3.4)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: latin contamination in final body (2302 tokens: we, need, to, replace, latin, words, from, list) — rerun p4-review",
      ),
    ).toBe("p4-review");
  });
});

describe("mapP5FailureToRerunTarget — dialect body gate → p4-review (AR, AI-QUALITY-REPAIR-LOOP 2026-11-16)", () => {
  it("maps the strong-marker shape (any STRONG dialect marker at publish)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: dialect contamination in final body (strong=1, weak=0: عشان×1) — rerun p4-review",
      ),
    ).toBe("p4-review");
  });

  it("maps the published-corpus weak ceiling shape (weak ≥ 5)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: dialect contamination in final body (strong=0, weak=6: حاجة×2, زي×2, كمان×2) — rerun p4-review",
      ),
    ).toBe("p4-review");
  });

  it("the message pattern is disjoint from the latin gate (no cross-matching)", () => {
    // The latin pattern must NOT match the dialect message and vice
    // versa — the two gates stay independently recognizable.
    expect(
      mapP5FailureToRerunTarget("p5: dialect contamination in final body (strong=2, weak=0: عشان×2) — rerun p4-review"),
    ).toBe("p4-review");
    expect(
      mapP5FailureToRerunTarget("p5: latin contamination in final body (3 tokens: whey, iso) — rerun p4-review"),
    ).toBe("p4-review");
  });
});

describe("mapP5FailureToRerunTarget — missing artifacts → p4-review", () => {
  it("maps the pre-P4 bundle guard (route line: missing reviewed artifacts)", () => {
    expect(
      mapP5FailureToRerunTarget("p5: missing reviewed artifacts — rerun p4-review"),
    ).toBe("p4-review");
  });
});

describe("mapP5FailureToRerunTarget — NOT repair contracts → null", () => {
  it("infra: post-insert DB failure is not a gate failure", () => {
    expect(
      mapP5FailureToRerunTarget(
        'p5: Post insert (en): relation "blog_posts" does not exist',
      ),
    ).toBeNull();
  });

  it("infra: partial publish (post inserted, queue update failed) — no repair", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: partial_publish: EN post 12345 inserted but post-update failed. Queue update abc: row not found",
      ),
    ).toBeNull();
  });

  it("quota/duplicate skips are 200s and never reach the map — but a stray message maps to null", () => {
    expect(mapP5FailureToRerunTarget("daily-quota-met")).toBeNull();
    expect(mapP5FailureToRerunTarget('duplicate-en-title "Carbs"')).toBeNull();
  });

  it("empty / unknown / garbage messages map to null (honest failure path)", () => {
    expect(mapP5FailureToRerunTarget("")).toBeNull();
    expect(mapP5FailureToRerunTarget("p5: Unknown")).toBeNull();
    expect(mapP5FailureToRerunTarget("totally unrelated error text")).toBeNull();
  });

  it("a rerun hint for a step OUTSIDE the contract is NOT honored (contract is closed-set)", () => {
    // p1-outline is a valid pipeline step but not a repair target — the
    // map must never fabricate a target the loop cannot execute.
    expect(
      mapP5FailureToRerunTarget("p5: image plan missing — rerun p1-outline"),
    ).toBeNull();
  });
});
