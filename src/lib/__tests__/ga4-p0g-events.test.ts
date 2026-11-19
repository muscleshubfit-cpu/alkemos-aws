import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  trackGa4Event,
  fireOncePerSession,
  consumeGoogleSignupMarkIfAny,
  GOOGLE_SIGNUP_COOKIE,
  docLang,
} from "@/lib/analytics";

/**
 * ORGANIC-GROWTH-P0-G canary (owner order 2026-11-19 «نفّذ البند التالي
 * مباشرة» — docs/organic-growth-system-2026-11-18/
 * 10-prioritized-execution-roadmap.md · 08-§4): the SEVEN funnel events
 * (tool_result · save_result · lead_capture · signup_complete ·
 * checkout_start · subscription_success · evo_message) must record from
 * their REAL trigger points — never formal/cosmetic calls.
 *
 * Two layers, the repo's standard canary shape:
 *   1. LOGIC — the shared sender (gtag → dataLayer → never break UX),
 *      the once-per-session funnel guard, and the Google-signup cookie
 *      consumer, as vitest units (jsdom).
 *   2. SOURCE PINS — the wiring machine-checked in every touched source:
 *      each event fires at its genuine moment (result computed, server
 *      confirmed the save/lead/order/capture, account really created),
 *      params carry tool/lang/plan/method/tier ONLY (zero PII), and no
 *      re-render/double-callback can double-send.
 */

const read = (p: string) => readFileSync(p, "utf8");

/* ── Layer 1: the shared sender (logic units) ─────────────────────────── */

describe("ORGANIC-GROWTH-P0-G — trackGa4Event (the DietPlanResultBridge precedent, shared)", () => {
  type GtagWin = Window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };

  afterEach(() => {
    const w = window as GtagWin;
    delete w.gtag;
    delete w.dataLayer;
  });

  it("prefers window.gtag when the tag is live", () => {
    const w = window as GtagWin;
    const gtag = vi.fn();
    w.gtag = gtag;
    trackGa4Event("tool_result", { tool: "bmi-calculator", lang: "ar" });
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "tool_result", {
      tool: "bmi-calculator",
      lang: "ar",
    });
  });

  it("falls back to the dataLayer queue when only the bootstrap ran (lazy gtag.js)", () => {
    const w = window as GtagWin;
    w.dataLayer = [];
    trackGa4Event("evo_message", { tier: "free", lang: "en" });
    expect(w.dataLayer).toEqual([
      { event: "evo_message", tier: "free", lang: "en" },
    ]);
  });

  it("drops silently when neither exists (GA_ID unset) — never breaks UX", () => {
    expect(() => trackGa4Event("lead_capture", { tool: "newsletter" })).not.toThrow();
  });

  it("survives a throwing gtag (analytics must NEVER break UX)", () => {
    const w = window as GtagWin;
    w.gtag = () => {
      throw new Error("blocked");
    };
    expect(() => trackGa4Event("save_result")).not.toThrow();
  });
});

describe("ORGANIC-GROWTH-P0-G — fireOncePerSession (the funnel dedupe guard)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("fires once per session per key — the second call is a no-op", () => {
    const fire = vi.fn();
    fireOncePerSession("tool_result:calorie-calculator", fire);
    fireOncePerSession("tool_result:calorie-calculator", fire);
    fireOncePerSession("tool_result:calorie-calculator", fire);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("keys are independent (one per tool)", () => {
    const a = vi.fn();
    const b = vi.fn();
    fireOncePerSession("tool_result:calorie-calculator", a);
    fireOncePerSession("tool_result:macro-calculator", b);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("a blocked sessionStorage still fires (a possible duplicate is cheaper than a missing funnel event)", () => {
    const spy = vi
      .spyOn(window.sessionStorage, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const fire = vi.fn();
    expect(() => fireOncePerSession("tool_result:bmi-calculator", fire)).not.toThrow();
    expect(fire).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe("ORGANIC-GROWTH-P0-G — the Google-signup cookie consumer (exactly-once)", () => {
  afterEach(() => {
    document.cookie = `${GOOGLE_SIGNUP_COOKIE}=; Max-Age=0; Path=/`;
  });

  it("no mark → no event (returning Google logins never fire signup_complete)", () => {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    const gtag = vi.fn();
    w.gtag = gtag;
    consumeGoogleSignupMarkIfAny();
    expect(gtag).not.toHaveBeenCalled();
    delete w.gtag;
  });

  it("mark present → signup_complete { method: google } exactly once, then consumed", () => {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    const gtag = vi.fn();
    w.gtag = gtag;
    document.cookie = `${GOOGLE_SIGNUP_COOKIE}=1; Path=/`;
    consumeGoogleSignupMarkIfAny();
    // Repeated callbacks (token refresh re-emits the profile) must not
    // double-send: the mark is gone.
    consumeGoogleSignupMarkIfAny();
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "signup_complete", {
      method: "google",
      lang: docLang(),
    });
    delete w.gtag;
  });
});

/* ── Layer 2: source pins — every event at its REAL trigger point ─────── */

const TOOL_PAGES = {
  calorie: "src/app/(en)/tools/calorie-calculator/page.tsx",
  macro: "src/app/(en)/tools/macro-calculator/page.tsx",
  bmi: "src/app/(en)/tools/bmi-calculator/page.tsx",
  bodyFat: "src/app/(en)/tools/body-fat-calculator/page.tsx",
  water: "src/app/(en)/tools/water-tracker/page.tsx",
  meal: "src/app/(en)/meal-planner/page.tsx",
} as const;

describe("ORGANIC-GROWTH-P0-G — tool_result (لكل أداة، عند الحساب الفعلي)", () => {
  it.each([
    ["calorie", TOOL_PAGES.calorie, "calorie-calculator", "setResult(targets);"],
    ["macro", TOOL_PAGES.macro, "macro-calculator", "setResult({"],
    ["bmi", TOOL_PAGES.bmi, "bmi-calculator", "setResult({ bmi,"],
    ["body-fat", TOOL_PAGES.bodyFat, "body-fat-calculator", "setResult({ bf,"],
  ] as const)(
    "%s: fires once-per-session right after the REAL computation",
    (_name, file, slug, anchor) => {
      const src = read(file);
      expect(src).toContain(
        `fireOncePerSession("tool_result:${slug}", () =>`,
      );
      expect(src).toContain(
        `trackGa4Event("tool_result", { tool: "${slug}", lang }),`,
      );
      // Ordering: the event follows the setResult anchor (computation
      // happened), not the JSX gates (which would be a formal call).
      const anchorIdx = src.indexOf(anchor);
      const trackIdx = src.indexOf(`fireOncePerSession("tool_result:${slug}"`);
      expect(anchorIdx).toBeGreaterThanOrEqual(0);
      expect(trackIdx).toBeGreaterThan(anchorIdx);
      // No result VALUES in the payload (zero PII): params are exactly
      // tool + lang.
      expect(src).toContain(`{ tool: "${slug}", lang }`);
    },
  );

  it("water-tracker: the tracker's real moments (goal applied / water logged), once per session", () => {
    const src = read(TOOL_PAGES.water);
    expect(src).toContain(
      'fireOncePerSession("tool_result:water-tracker", () =>',
    );
    expect(src).toContain(
      'trackGa4Event("tool_result", { tool: "water-tracker", lang }),',
    );
    // All three real moments route through the one guard.
    expect(src.match(/trackToolResult\(\);/g)?.length).toBe(3);
  });

  it("meal-planner: the builder's real moment (first food added), once per session", () => {
    const src = read(TOOL_PAGES.meal);
    expect(src).toContain(
      'fireOncePerSession("tool_result:meal-planner", () =>',
    );
    expect(src).toContain(
      'trackGa4Event("tool_result", { tool: "meal-planner", lang }),',
    );
    // Inside addItemToMeal (the real action), not a render/effect.
    const fnIdx = src.indexOf("const addItemToMeal = ");
    const trackIdx = src.indexOf('fireOncePerSession("tool_result:meal-planner"');
    const fnEnd = src.indexOf("};", fnIdx);
    expect(trackIdx).toBeGreaterThan(fnIdx);
    expect(trackIdx).toBeLessThan(fnEnd);
  });

  it("the AR mirrors inherit everything (bilingual single sources)", () => {
    expect(read("src/app/(ar)/ar/tools/calorie-calculator/page.tsx")).toContain(
      'export { default } from "@/app/(en)/tools/calorie-calculator/page";',
    );
    expect(read("src/app/(ar)/ar/meal-planner/page.tsx")).toContain(
      'export { default } from "@/app/(en)/meal-planner/page";',
    );
  });
});

describe("ORGANIC-GROWTH-P0-G — save_result (فقط بعد تأكيد الخادم)", () => {
  it.each([
    ["SaveResultButton", "src/components/SaveResultButton.tsx", "toolSlug"],
    ["water-tracker", TOOL_PAGES.water, '"water-tracker"'],
    ["meal-planner", TOOL_PAGES.meal, '"meal-planner"'],
  ] as const)("%s: fires only on the server-confirmed success path", (_n, file, toolArg) => {
    const src = read(file);
    expect(src).toContain("trackGa4Event(\"save_result\"");
    expect(src).toContain(`{ tool: ${toolArg}, lang }`);
    // The call sits AFTER the !res.ok early-return (server confirmed).
    const notOkIdx = src.indexOf("if (!res.ok)");
    const trackIdx = src.indexOf('trackGa4Event("save_result"');
    expect(trackIdx).toBeGreaterThan(notOkIdx);
  });
});

describe("ORGANIC-GROWTH-P0-G — lead_capture (البريد لا يدخل التحليلات أبدًا)", () => {
  it("LeadCaptureCard: fires on server-confirmed send, tool + lang only", () => {
    const src = read("src/components/LeadCaptureCard.tsx");
    expect(src).toContain('trackGa4Event("lead_capture", { tool: toolSlug, lang });');
    const trackIdx = src.indexOf('trackGa4Event("lead_capture"');
    const doneIdx = src.indexOf("setDone(true);");
    expect(trackIdx).toBeGreaterThan(doneIdx);
    // Zero-PII pin: the payload line carries NO email/name variable.
    const payloadLine = src
      .split("\n")
      .find((l) => l.includes('trackGa4Event("lead_capture"'));
    expect(payloadLine).toBeDefined();
    expect(payloadLine).not.toMatch(/email|name|cleanEmail/i);
  });

  it("NewsletterForm: fires on server-confirmed subscribe, tool=newsletter", () => {
    const src = read("src/components/NewsletterForm.tsx");
    expect(src).toContain(
      'trackGa4Event("lead_capture", { tool: "newsletter", lang });',
    );
    const notOkIdx = src.indexOf("if (!res.ok || data.error)");
    const trackIdx = src.indexOf('trackGa4Event("lead_capture"');
    expect(trackIdx).toBeGreaterThan(notOkIdx);
  });
});

describe("ORGANIC-GROWTH-P0-G — signup_complete (الحساب أُنشأ فعلًا)", () => {
  it("email arm: fires only when !error && !dupEmail (covers instant + needsConfirmation)", () => {
    const src = read("src/components/views/AuthView.tsx");
    expect(src).toContain("if (!error && !dupEmail) {");
    expect(src).toContain('trackGa4Event("signup_complete", {');
    expect(src).toContain('method: "email",');
    // The fire is guarded BEFORE the branch dispatch — duplicates and
    // errors can never reach it.
    const guardIdx = src.indexOf("if (!error && !dupEmail) {");
    const trackIdx = src.indexOf('trackGa4Event("signup_complete"');
    expect(trackIdx).toBeGreaterThan(guardIdx);
    // Zero-PII pin on the params block: the only "email" string is the
    // method literal — no email VARIABLE, no name, no phone.
    const paramsBlock = src.slice(trackIdx, trackIdx + 260);
    expect(paramsBlock).toContain('method: "email"');
    expect(paramsBlock).not.toMatch(/\b(fullName|phone|coachSlug|password)\b/);
    expect(paramsBlock).not.toMatch(/\bemail\b\s*[,:}]/);
  });

  it("Google arm: the callback marks ONLY fresh Google accounts (provider + <5min)", () => {
    const src = read("src/app/(app)/auth/callback/route.ts");
    expect(src).toContain('data.user.app_metadata?.provider === "google"');
    expect(src).toContain("Date.now() - createdMs < 5 * 60 * 1000");
    expect(src).toContain("redirect.cookies.set(GOOGLE_SIGNUP_COOKIE");
    // The mark rides the SAME redirect the route already answers (no
    // extra navigation, no header change).
    expect(src).toContain("const redirect = NextResponse.redirect(");
  });

  it("Google arm: the AuthProvider consumes the mark exactly once, profile-gated", () => {
    const src = read("src/hooks/use-auth.tsx");
    expect(src).toContain("if (p) consumeGoogleSignupMarkIfAny();");
    // Inside the onAuthChange subscription (fires with a real profile).
    const subIdx = src.indexOf("data.onAuthChange((p) => {");
    const consumeIdx = src.indexOf("if (p) consumeGoogleSignupMarkIfAny();");
    expect(consumeIdx).toBeGreaterThan(subIdx);
  });
});

describe("ORGANIC-GROWTH-P0-G — checkout_start (بالباقة وطريقة الدفع)", () => {
  it("PayPal rail: fires when the server CREATED the order (real commitment)", () => {
    const src = read("src/components/views/CheckoutView.tsx");
    const createOrderIdx = src.indexOf("createOrder: async () => {");
    const orderOkIdx = src.indexOf("throw new Error(data.error || \"Failed to create order\");");
    const trackIdx = src.indexOf('trackGa4Event("checkout_start"');
    expect(trackIdx).toBeGreaterThan(orderOkIdx);
    expect(trackIdx).toBeGreaterThan(createOrderIdx);
    // Params: plan + duration + method + lang (zero PII — no name/whatsapp).
    const payload = src.slice(trackIdx, src.indexOf("});", trackIdx));
    expect(payload).toContain("plan: planTier");
    expect(payload).toContain("duration_months: durationMonths");
    expect(payload).toContain('payment_method: "paypal"');
    expect(payload).not.toMatch(/fullName|whatsapp|receipt/i);
  });

  it("manual rail: fires when the request was SUBMITTED; subscription_success is INTENTIONALLY absent", () => {
    const src = read("src/components/views/CheckoutView.tsx");
    // Exactly TWO checkout_start call sites (PayPal + manual).
    expect(src.match(/trackGa4Event\("checkout_start"/g)?.length).toBe(2);
    // The manual fire sits after submitSubscriptionRequest succeeded.
    const submitIdx = src.indexOf("await submitSubscriptionRequest({");
    const manualTrackIdx = src.lastIndexOf('trackGa4Event("checkout_start"');
    expect(manualTrackIdx).toBeGreaterThan(submitIdx);
    // EXACTLY ONE subscription_success call site in the whole file — and
    // it is inside the server-confirmed PayPal branch only.
    expect(src.match(/trackGa4Event\("subscription_success"/g)?.length).toBe(1);
  });
});

describe("ORGANIC-GROWTH-P0-G — subscription_success (تأكيد حقيقي فقط، بلا ازدواج)", () => {
  it("fires ONLY inside the res.ok && result.success branch (server captured + activated)", () => {
    const src = read("src/components/views/CheckoutView.tsx");
    const confirmedIdx = src.indexOf("if (res.ok && result.success) {");
    const trackIdx = src.indexOf('trackGa4Event("subscription_success"');
    expect(trackIdx).toBeGreaterThan(confirmedIdx);
    // The exactly-once ref guard wraps the fire.
    expect(src).toContain("if (!successFiredRef.current) {");
    const guardIdx = src.indexOf("if (!successFiredRef.current) {");
    expect(trackIdx).toBeGreaterThan(guardIdx);
    // Params: plan + duration + method + lang.
    const payload = src.slice(trackIdx, src.indexOf("});", trackIdx));
    expect(payload).toContain("plan: planTier");
    expect(payload).toContain("payment_method");
    expect(payload).not.toMatch(/fullName|whatsapp|orderId/i);
  });
});

describe("ORGANIC-GROWTH-P0-G — evo_message (جسم الرسالة لا يدخل التحليلات)", () => {
  it("fires at the sendMessage chokepoint with tier + lang only", () => {
    const src = read("src/lib/evo-chat-context.tsx");
    expect(src).toContain(
      'trackGa4Event("evo_message", { tier, lang: docLang() });',
    );
    // After the empty/limit guard, before the user message is built —
    // the send moment, not the response moment.
    const guardIdx = src.indexOf("if (!content.trim() || dailyLimitReached) return;");
    const trackIdx = src.indexOf('trackGa4Event("evo_message"');
    expect(trackIdx).toBeGreaterThan(guardIdx);
    // Zero-PII pin: the payload is a fixed literal — no content/history.
    expect(src).not.toContain('trackGa4Event("evo_message", { content');
  });
});

describe("ORGANIC-GROWTH-P0-G — the shared lib's zero-PII + automatic-dimension laws", () => {
  it("the lib documents and the payload type enforces primitives only", () => {
    const src = read("src/lib/analytics.ts");
    expect(src).toContain("ZERO PII LAW");
    expect(src).toContain("GA4 AUTOMATIC dimensions");
    expect(src).toContain("analytics must NEVER break UX");
    // gtag-first, dataLayer fallback (the P0-C precedent, shared).
    expect(src).toContain('typeof w.gtag === "function"');
    expect(src).toContain("Array.isArray(w.dataLayer)");
  });

  it("no event payload anywhere ships an email, name, phone or message body", () => {
    const files = [
      TOOL_PAGES.calorie,
      TOOL_PAGES.macro,
      TOOL_PAGES.bmi,
      TOOL_PAGES.bodyFat,
      TOOL_PAGES.water,
      TOOL_PAGES.meal,
      "src/components/SaveResultButton.tsx",
      "src/components/LeadCaptureCard.tsx",
      "src/components/NewsletterForm.tsx",
      "src/components/views/AuthView.tsx",
      "src/components/views/CheckoutView.tsx",
      "src/lib/evo-chat-context.tsx",
      "src/hooks/use-auth.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      for (const line of src.split("\n")) {
        if (!line.includes("trackGa4Event(")) continue;
        expect(line, `${f}: PII leaked through an event payload`).not.toMatch(
          /\b(email|fullName|whatsapp|phone|cleanEmail|userMessage)\b/,
        );
      }
    }
  });
});
