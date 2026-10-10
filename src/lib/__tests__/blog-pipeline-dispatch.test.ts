/**
 * blog-pipeline-dispatch.test.ts — Phase 162 coach-pipeline-parity laws.
 *
 * Covers the pure topic sanitizer + the fail-open dispatch contract:
 *   usableCoachTopic (6) — trim/cap/minimum-length (brief-sealable law)
 *   dispatchBlogPipeline (7) — token gating · HTTP 204 contract · body
 *   shape (ref + inputs) · topic omitted when not sealable · job_id echo ·
 *   fail-open on HTTP rejection AND network error (generation never dies).
 * The fetch mock mirrors the proven rate-limit.test.ts pattern.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dispatchBlogPipeline,
  usableCoachTopic,
} from "@/lib/blog-pipeline-dispatch";

const TOKEN = "github_pat_test_token_only";
const URL_AR =
  "https://api.github.com/repos/muscleshubfit-cpu/alkemos-aws/actions/workflows/blog-post-ar.yml/dispatches";
const URL_EN =
  "https://api.github.com/repos/muscleshubfit-cpu/alkemos-aws/actions/workflows/blog-post-en.yml/dispatches";

const ok204 = (): Response => new Response(null, { status: 204 });

describe("usableCoachTopic", () => {
  it("accepts a topic at the 10-char minimum", () => {
    expect(usableCoachTopic("خطة غذاء صحي")).toBe("خطة غذاء صحي");
  });

  it("trims surrounding whitespace before measuring", () => {
    expect(usableCoachTopic("   best home workouts for beginners   ")).toBe(
      "best home workouts for beginners",
    );
  });

  it("rejects topics shorter than the brief-sealable minimum", () => {
    // 9 chars — below the blog-pairing MIN_TOPIC_CHARS law.
    expect(usableCoachTopic("خطة غذاء")).toBeNull();
  });

  it("rejects empty, whitespace-only and non-string inputs", () => {
    expect(usableCoachTopic("")).toBeNull();
    expect(usableCoachTopic("     ")).toBeNull();
    expect(usableCoachTopic(undefined)).toBeNull();
    expect(usableCoachTopic(42)).toBeNull();
  });

  it("caps runaway topics at 300 chars", () => {
    const out = usableCoachTopic("a".repeat(500));
    expect(out).not.toBeNull();
    expect(out!.length).toBe(300);
  });
});

describe("dispatchBlogPipeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.GITHUB_DISPATCH_TOKEN;
  });

  it("fails open (false) without GITHUB_DISPATCH_TOKEN and never calls fetch", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(
      dispatchBlogPipeline({ lang: "ar", topic: "خطة غذاء صحي كاملة", jobId: "job-1" }),
    ).resolves.toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("dispatches the AR workflow with ref main + topic + job_id inputs", async () => {
    process.env.GITHUB_DISPATCH_TOKEN = TOKEN;
    const spy = vi.fn().mockResolvedValue(ok204());
    vi.stubGlobal("fetch", spy);
    await expect(
      dispatchBlogPipeline({ lang: "ar", topic: "أفضل تمارين الكتف في المنزل", jobId: "job-42" }),
    ).resolves.toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(URL_AR);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(String(init.body))).toEqual({
      ref: "main",
      inputs: { topic: "أفضل تمارين الكتف في المنزل", job_id: "job-42" },
    });
  });

  it("dispatches the EN workflow file for lang en", async () => {
    process.env.GITHUB_DISPATCH_TOKEN = TOKEN;
    const spy = vi.fn().mockResolvedValue(ok204());
    vi.stubGlobal("fetch", spy);
    await expect(dispatchBlogPipeline({ lang: "en" })).resolves.toBe(true);
    expect((spy.mock.calls[0] as unknown[])[0]).toBe(URL_EN);
  });

  it("omits the topic input entirely when it is not sealable", async () => {
    process.env.GITHUB_DISPATCH_TOKEN = TOKEN;
    const spy = vi.fn().mockResolvedValue(ok204());
    vi.stubGlobal("fetch", spy);
    await expect(
      dispatchBlogPipeline({ lang: "ar", topic: "قصير" }),
    ).resolves.toBe(true);
    const body = JSON.parse(String((spy.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body).toEqual({ ref: "main", inputs: {} });
  });

  it("fails open on an HTTP rejection (non-204)", async () => {
    process.env.GITHUB_DISPATCH_TOKEN = TOKEN;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 403 })),
    );
    await expect(dispatchBlogPipeline({ lang: "ar" })).resolves.toBe(false);
  });

  it("fails open on a network error / timeout", async () => {
    process.env.GITHUB_DISPATCH_TOKEN = TOKEN;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    await expect(dispatchBlogPipeline({ lang: "en", topic: "valid topic here" })).resolves.toBe(
      false,
    );
  });
});
