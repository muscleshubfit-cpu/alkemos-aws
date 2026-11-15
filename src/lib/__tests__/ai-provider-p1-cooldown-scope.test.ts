import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  __resetCooldownForTests,
  classifyForCooldown,
  markCooldown,
  cooldownState,
} from "@/lib/ai-provider-cooldown";

/**
 * P1 canaries — INF-3: the class-aware cooldown SCOPE (quota class →
 * provider-wide, gone class → model-scoped) and the tightened GONE regex.
 */

const FILE = { deleteFile: true } as const;

describe("INF-3 — class-aware cooldown scope", () => {
  beforeEach(() => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "1800000";
    delete process.env.AI_PROVIDER_COOLDOWN;
    delete process.env.AI_COOLDOWN_STATE_FILE;
    __resetCooldownForTests(FILE);
  });
  afterEach(() => {
    delete process.env.AI_PROVIDER_COOLDOWN_MS;
    __resetCooldownForTests(FILE);
  });

  it("a GONE failure cools ONLY the model-scoped entry — the provider's other models stay live", () => {
    markCooldown("chain:openrouter:some-dead-model", "gone: 404 model retired");
    expect(cooldownState("chain:openrouter:some-dead-model")).not.toBeNull();
    expect(cooldownState("chain:openrouter")).toBeNull();
    expect(cooldownState("chain:openrouter:healthy-model")).toBeNull();
  });

  it("a QUOTA failure cools the whole provider (the account is dry)", () => {
    markCooldown("chain:openrouter", "quota: 429 rate limit");
    // cooldownState is an EXACT-scope lookup — the provider scope is what
    // the chain walk consults FIRST (cd = cdProvider ?? cdModel), so every
    // entry of the provider is skipped while the mark lives.
    expect(cooldownState("chain:openrouter")).not.toBeNull();
    expect(cooldownState("chain:openrouter:some-model")).toBeNull(); // no model-scoped mark exists
  });

  it("the GONE regex keeps the dead-model classes with word-bounded «not found»", () => {
    // the MEASURED live signatures stay «gone» (run 38847288514):
    expect(classifyForCooldown("DEGRADED function cannot be invoked")).toBe("gone");
    expect(classifyForCooldown("model not found")).toBe("gone");
    expect(classifyForCooldown("404 Not Found")).toBe("gone");
    expect(classifyForCooldown("this model was decommissioned")).toBe("gone");
    // An unrelated «not found» inside a message still classifies gone —
    // but the SCOPE fix above caps the damage at that one model entry
    // (the measured incident class: one dead id froze every entry).
    expect(classifyForCooldown("Bad Request: user not found in org")).toBe("gone");
  });
});
