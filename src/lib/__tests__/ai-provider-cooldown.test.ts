import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  __resetCooldownForTests,
  activeCooldowns,
  classifyForCooldown,
  cooldownEnabled,
  cooldownState,
  cooldownTtlMs,
  flushCooldownWrites,
  markCooldown,
} from "@/lib/ai-provider-cooldown";
import { readFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * BLOG-PROVIDER-FAILOVER 2026-10-16 — the COOLDOWN REGISTRY (circuit
 * breaker) unit contract, per the owner order «…وتجنب تكرار المحاولات
 * الفاشلة»:
 *   • OPT-IN: absent env = INACTIVE (every pre-existing canary stays
 *     byte-identical — the registry must be a no-op until the blog
 *     workflows set AI_PROVIDER_COOLDOWN_MS).
 *   • Only exhaustion-class failures cool (429/402/401/403 quota · 404
 *     model-gone). Transient 5xx/timeout NEVER cool.
 *   • Marks never shorten; expiry prunes; the state file carries NO
 *     secrets (scope = provider/key-INDEX/model + error class only) and
 *     survives a process restart (fresh load reads it back).
 */

const ENV_KEYS = [
  "AI_PROVIDER_COOLDOWN_MS",
  "AI_PROVIDER_COOLDOWN",
  "AI_COOLDOWN_STATE_FILE",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

let stateFile = "";

beforeEach(() => {
  cleanEnv();
  stateFile = join(mkdtempSync(join(tmpdir(), "cd-")), "cooldown.json");
  process.env.AI_COOLDOWN_STATE_FILE = stateFile;
  __resetCooldownForTests();
});

afterEach(() => {
  cleanEnv();
  vi.unstubAllGlobals();
  try {
    rmSync(stateFile, { force: true });
  } catch {
    /* ignore */
  }
});

describe("cooldown registry — OPT-IN law (canary protection)", () => {
  it("absent env → INACTIVE: mark/state/active are all no-ops", () => {
    expect(cooldownEnabled()).toBe(false);
    expect(cooldownTtlMs()).toBe(0);
    markCooldown("chain:groq", "quota: 429");
    expect(cooldownState("chain:groq")).toBeNull();
    expect(activeCooldowns()).toEqual([]);
  });

  it("AI_PROVIDER_COOLDOWN_MS>0 activates the registry with that TTL", () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "60000";
    expect(cooldownEnabled()).toBe(true);
    expect(cooldownTtlMs()).toBe(60000);
    markCooldown("chain:groq", "quota: 429");
    expect(cooldownState("chain:groq")?.reason).toContain("429");
  });

  it("AI_PROVIDER_COOLDOWN=0 is the kill-switch even with MS set", () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "60000";
    process.env.AI_PROVIDER_COOLDOWN = "0";
    expect(cooldownEnabled()).toBe(false);
    markCooldown("chain:groq", "quota: 429");
    expect(cooldownState("chain:groq")).toBeNull();
  });
});

describe("classifyForCooldown — only exhaustion classes cool", () => {
  it("quota/auth/payment class → \"quota\"", () => {
    expect(classifyForCooldown("AI API error 429 from gemini: You exceeded your current quota")).toBe("quota");
    expect(classifyForCooldown("AI API error 402 from openrouter: insufficient credits")).toBe("quota");
    expect(classifyForCooldown("AI API error 401 from groq: invalid api key")).toBe("quota");
    expect(classifyForCooldown("RESOURCE_EXHAUSTED rate limit exceeded")).toBe("quota");
  });

  it("dead-model class → \"gone\"", () => {
    expect(classifyForCooldown("AI API error 404 from gemini: model not found")).toBe("gone");
    expect(classifyForCooldown("no longer available to new users")).toBe("gone");
    // BLOG-PROVIDER-FAILOVER 2026-10-16 (live run 38847288514): the openrouter
    // upstream "DEGRADED function cannot be invoked" class (the Phase-177
    // dead-id signature on a live call) — futile to re-attempt within the
    // window, so it cools like a dead model.
    expect(classifyForCooldown("Provider returned error 400: DEGRADED function cannot be invoked")).toBe("gone");
  });

  it("transient failures NEVER cool (retry semantics preserved)", () => {
    expect(classifyForCooldown("AI API error 503 from groq: model overloaded")).toBeNull();
    expect(classifyForCooldown("AI API timeout after 55000ms from gemini")).toBeNull();
    expect(classifyForCooldown("empty response")).toBeNull();
    expect(classifyForCooldown("returned no web-search evidence (citation URLs)")).toBeNull();
    expect(classifyForCooldown("")).toBeNull();
  });
});

describe("cooldown registry — memory semantics", () => {
  it("a fresh mark never SHORTENS an active cooldown", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    vi.useFakeTimers();
    try {
      markCooldown("s", "first");
      const first = cooldownState("s")!;
      // same frozen instant → the re-mark must NOT change the expiry
      markCooldown("s", "second");
      const sameInstant = cooldownState("s")!;
      expect(sameInstant.until).toBe(first.until);
      // a mark 1ms later may EXTEND (later failure = later window) but
      // never pulls the expiry EARLIER:
      vi.setSystemTime(Date.now() + 1);
      markCooldown("s", "third");
      expect(cooldownState("s")!.until).toBeGreaterThanOrEqual(first.until);
    } finally {
      vi.useRealTimers();
    }
  });

  it("expired entries are pruned and report null", () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "30";
    markCooldown("s", "quota: 429");
    expect(cooldownState("s")).not.toBeNull();
    const until = cooldownState("s")!.until;
    vi.useFakeTimers();
    vi.setSystemTime(until + 1000);
    expect(cooldownState("s")).toBeNull();
    vi.useRealTimers();
  });

  it("activeCooldowns() lists scopes sorted by soonest expiry", () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    markCooldown("b", "quota: x");
    markCooldown("a", "quota: y");
    const scopes = activeCooldowns().map((c) => c.scope);
    expect(scopes).toContain("a");
    expect(scopes).toContain("b");
  });
});

describe("cooldown registry — file persistence (cross-process, secret-free)", () => {
  it("marks survive a process restart (fresh load reads the state file)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    markCooldown("grounded:gemini:key#1:gemini-3.5-flash", "quota: 429");
    await flushCooldownWrites();
    // Simulate a NEW process: wipe memory + the loaded flag, keep the file.
    __resetCooldownForTests();
    const loaded = cooldownState("grounded:gemini:key#1:gemini-3.5-flash");
    expect(loaded).not.toBeNull();
    expect(loaded!.reason).toContain("429");
  });

  it("the state file contains NO secret material (scope = index + model only)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    markCooldown("grounded:openrouter:key#2", "quota: 402 insufficient credits");
    await flushCooldownWrites();
    const raw = readFileSync(stateFile, "utf8");
    expect(raw).toContain("grounded:openrouter:key#2");
    expect(raw).not.toContain("sk-or-");
    expect(raw).not.toContain("gsk_");
    expect(raw).not.toContain("nvapi-");
    expect(raw).not.toContain("AIza");
  });

  it("a corrupt/absent state file degrades to memory-only (fail-soft)", () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    __resetCooldownForTests({ deleteFile: true });
    // No file exists → no crash, no cooldowns
    expect(activeCooldowns()).toEqual([]);
    markCooldown("s", "quota: 429"); // memory-only path still works
    expect(cooldownState("s")).not.toBeNull();
  });
});
