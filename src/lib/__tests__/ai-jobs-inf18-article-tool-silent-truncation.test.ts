import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * INF-18 canaries (AI-OPERATIONAL-TEST-PLAN 2026-11-16, T5/S5-8-د — the
 * article_tool silent-truncation detection frame, owner order 2026-11-18
 * «نفّذ البند التالي»).
 *
 * THE MEASURED DEFECT CLASS (audit AI-GENERATION-PIPELINES 2026-11-15 §79,
 * INF-18): the enqueue sanitizer ACCEPTS a 30,000-char article
 * (ai-jobs.ts `content: str(p.content, 30_000)` — the live S5-8 run
 * measured the stored payload at exactly 30,000 chars), but the
 * processor's prompt builder silently slices to 12,000 chars (Arabic) /
 * 14,000 (English) — `ai-job-processors.ts`
 * `${content.slice(0, isAr ? 12_000 : 14_000)}` — with ZERO disclosure:
 * no API warning, no job-row field, no worker log line, no result note.
 * The live evidence (raw/t5/s5-8-article-tool-silent-truncation-inf18.md,
 * job 9d4dba9b, worker run 44317453918): a 30,000-char submitted article
 * produced a 1,597-char "successful" paraphrase — the model physically
 * received tokens_in=3,972 (the 12k window + instructions; the full
 * article would need ~2.5× that), its own notes say «دمج الأقسام
 * المكررة (0-14)» — sections 0-14 ARE the 12k window — and the tail
 * markers at chars 12,526 / 20,026 / 29,526 never appeared in the
 * output. 60% of the member's article was dropped in silence.
 *
 * WHY THIS FILE: the pre-existing coverage pinned the sanitizer clamps
 * and the sentinel split — nothing pinned the ACCEPTANCE-VS-USAGE delta
 * (30k stored ↔ 12k/14k used) at the real PROCESSORS surface the GHA
 * runner calls. These canaries make the audit's measured gap
 * DETERMINISTIC: any future change to the slice (a truncation
 * disclosure, a raised window, an honest rejection) flips a canary —
 * the gap can then be CLOSED deliberately (owner remediation frame),
 * never silently widened. Per the plan's law §10-2 this frame fixes
 * nothing in production code: the item is كشف — the gap is measured,
 * pinned, and documented for the owner's remediation decision.
 */

const captured = vi.hoisted(() => ({
  /** every dispatchAI call the processor issued (id + prompt + system). */
  calls: [] as Array<{ id: string; prompt: string; systemPrompt?: string }>,
}));

vi.mock("@/lib/ai-router", () => ({
  dispatchAI: vi.fn(async (id: string, prompt: string, opts?: { systemPrompt?: string }) => {
    captured.calls.push({ id, prompt, systemPrompt: opts?.systemPrompt });
    return {
      text:
        "===CORRECTED===\n" +
        "نص المعالج الكناري: المرور داخل النافذة فقط — الرموز داخل النافذة حاضرة.\n" +
        "===NOTES===\n- ملاحظة كناري",
      model: "canary/inf18",
    };
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      throw new Error(`unexpected table ${table} (article_tool must not touch the DB)`);
    },
  },
}));

vi.mock("@/lib/plan-generator", () => ({
  generateNutritionPlanAI: vi.fn(async () => ({})),
  generateWorkoutPlanAI: vi.fn(async () => ({})),
  regenerateMeal: vi.fn(async () => ({})),
  regenerateFoodItem: vi.fn(async () => ({})),
  regenerateWorkoutDay: vi.fn(async () => ({})),
  substituteExercise: vi.fn(async () => ({})),
}));

vi.mock("@/lib/evo-nutrition-knowledge.server", () => ({
  loadEvoNutritionKnowledge: vi.fn(async () => ({ knowledgeBlock: "" })),
}));

import { PROCESSORS } from "@/lib/ai-job-processors";
import { sanitizeJobPayload } from "@/lib/ai-jobs";
import { resolveRegistrySpec } from "@/lib/ai-registry";

/* ── Deterministic article builder — mirrors the live S5-8 input shape ──
 * length-preserving REPLACE-AT injections keep the total EXACTLY at
 * `len` and place boundary probes byte-precisely: PROBE_WINDOW ends at
 * char 12,000, PROBE_TAIL starts at char 12,000, PROBE_TAIL_EN starts
 * at char 14,000 (the EN window edge). */
const BASE_PARA =
  "التدريب المنتظم والتغذية المتوازنة حجر الأساس في بناء الجسم السليم. " +
  "يحتاج الجسم إلى البروتين الكافي لإصلاح الألياف العضلية بعد كل حصة تدريبية، " +
  "وإلى الكربوهيدرات المعقدة لتزويد العضلات بالطاقة أثناء الأداء، " +
  "وإلى الدهون الصحية بمصادرها الطبيعية لدعم الهرمونات والامتصاص الفيتاميني.";

const PROBE_WINDOW = "فاصل-النافذة-الفريد-٩٨٧٦٥٤٣٢١٠";
const PROBE_TAIL_AR = "فاصل-الذيل-الفريد-١٢٣٤٥٦٧٨٩٠";
const PROBE_TAIL_EN = "فاصل-الذيل-الإنجليزي-٥٥٤٤٣٣٢٢١١";
const MK = {
  windowA: "ماركر-ألفا",
  windowB: "ماركر-برافو",
  tailC: "ماركر-تشارلي",
  tailD: "ماركر-دلتا",
  tailE: "ماركر-إيكو",
} as const;
const mkSentence = (t: string) => `جملة مميزة تحمل الرمز ${t} للتحقق. `;

const replaceAt = (s: string, at: number, ins: string): string =>
  s.slice(0, at) + ins + s.slice(at + ins.length);

function buildLongArticle(len = 30_000): string {
  const AR_WINDOW = 12_000;
  // 1) window body [0, 12,000): base sections, marker A @2,000, marker B
  //    ending @11,000, PROBE_WINDOW ending exactly @12,000
  let win = "";
  for (let i = 0; win.length < AR_WINDOW; i++) {
    win += `## القسم ${i}: نص مرجعي عن التدريب والتغذية رقم ${i}.\n${BASE_PARA}`;
  }
  win = win.slice(0, AR_WINDOW);
  win = replaceAt(win, 2_000, mkSentence(MK.windowA));
  win = replaceAt(win, 11_000 - mkSentence(MK.windowB).length, mkSentence(MK.windowB));
  win = replaceAt(win, AR_WINDOW - PROBE_WINDOW.length, PROBE_WINDOW);
  // 2) tail body [12,000, len): AR boundary probe @12,000, EN boundary
  //    probe @14,000, markers C @12,500 / D @20,000 / E @29,500
  let tail = "";
  for (let i = 100; tail.length < len - AR_WINDOW; i++) {
    tail += `## القسم ${i}: نص مرجعي عن التدريب والتغذية رقم ${i}.\n${BASE_PARA}`;
  }
  tail = tail.slice(0, len - AR_WINDOW);
  tail = replaceAt(tail, 0, PROBE_TAIL_AR);
  tail = replaceAt(tail, 14_000 - AR_WINDOW, PROBE_TAIL_EN);
  tail = replaceAt(tail, 500, mkSentence(MK.tailC));
  tail = replaceAt(tail, 8_000, mkSentence(MK.tailD));
  tail = replaceAt(tail, 17_500 - mkSentence(MK.tailE).length, mkSentence(MK.tailE));
  return win + tail;
}

describe("INF-18 — article_tool silent truncation (S5-8-د: 30k accepted ↔ 12k/14k used, بلا إفصاح)", () => {
  beforeEach(() => {
    captured.calls.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("القيد الحرفي (العربية): البرومبت يحمل content.slice(0, 12_000) كاملًا وفاصل الذيل عند الحرف 12,000 لا يعبر أبدًا", async () => {
    const content = buildLongArticle(30_000);
    // builder sanity — probes are byte-precise
    expect(content.length).toBe(30_000);
    expect(content.indexOf(PROBE_WINDOW)).toBe(12_000 - PROBE_WINDOW.length);
    expect(content.indexOf(PROBE_TAIL_AR)).toBe(12_000);
    expect(content.indexOf(PROBE_TAIL_EN)).toBe(14_000);
    expect(content.indexOf(MK.windowA)).toBeGreaterThan(1_900);
    expect(content.indexOf(MK.tailC)).toBeGreaterThan(12_400);

    const result = (await PROCESSORS.article_tool({
      tool: "paraphrase",
      content,
      title: "اختبار INF-18",
      keyword: "اختبار",
      category: "تدريب",
      language: "ar",
    })) as Record<string, unknown>;

    expect(captured.calls.length).toBe(1);
    const { id, prompt } = captured.calls[0];
    expect(id).toBe("ai-job:paraphrase");

    // THE MEASURED GAP, byte-precise:
    expect(prompt.includes(content.slice(0, 12_000))).toBe(true); // the window rides VERBATIM
    expect(prompt.includes(PROBE_TAIL_AR)).toBe(false); // the 12k boundary probe NEVER rides
    expect(prompt.includes(PROBE_TAIL_EN)).toBe(false); // nor the 14k one under the AR window
    expect(prompt.includes(PROBE_WINDOW)).toBe(true); // the window edge probe rides
    // positional markers — the live evidence family (ألفا/برافو داخل، تشارلي/دلتا/إيكو خارج)
    expect(prompt.includes(MK.windowA)).toBe(true);
    expect(prompt.includes(MK.windowB)).toBe(true);
    expect(prompt.includes(MK.tailC)).toBe(false);
    expect(prompt.includes(MK.tailD)).toBe(false);
    expect(prompt.includes(MK.tailE)).toBe(false);
    // and the job still lands a normal success (the silence itself)
    expect(result.tool).toBe("paraphrase");
    expect(typeof result.text).toBe("string");
    expect(String(result.text).length).toBeGreaterThan(0);
  });

  it("القيد الإنجليزي: نافذة 14_000 حرفًا — فاصل الـ12k يعبر وماركر-تشارلي معه، وفاصل الـ14k وماركرات ما بعده لا تعبر", async () => {
    const content = buildLongArticle(30_000);
    const result = (await PROCESSORS.article_tool({
      tool: "paraphrase",
      content,
      title: "INF-18 EN probe",
      keyword: "probe",
      category: "training",
      language: "en",
    })) as Record<string, unknown>;
    expect(captured.calls.length).toBe(1);
    const { prompt } = captured.calls[0];
    expect(prompt.includes(content.slice(0, 14_000))).toBe(true);
    expect(prompt.includes(PROBE_TAIL_AR)).toBe(true); // 12k probe is INSIDE the EN window
    expect(prompt.includes(MK.tailC)).toBe(true); // char 12,500 rides for EN
    expect(prompt.includes(PROBE_TAIL_EN)).toBe(false); // the 14k boundary probe NEVER rides
    expect(prompt.includes(MK.tailD)).toBe(false); // 20,000 dropped
    expect(prompt.includes(MK.tailE)).toBe(false); // 29,500 dropped
    expect(result.tool).toBe("paraphrase");
  });

  it("جانب القبول: المُنقّي يقبل/يخزّن 30_000 حرفًا (المدخل المخزّن = 2.5× النافذة العربية) ودلتا القبول/الاستخدام مقيسة", () => {
    const content = buildLongArticle(30_000);
    const sanitized = sanitizeJobPayload("article_tool", {
      tool: "paraphrase",
      content,
      title: "اختبار INF-18",
      keyword: "اختبار",
      category: "تدريب",
      language: "ar",
    }) as Record<string, unknown>;
    const stored = String(sanitized.content ?? "");
    // the enqueue trust boundary KEEPS the whole 30k (the live row measured 30,000)
    expect(stored.length).toBe(30_000);
    // over-30k clamps to exactly 30k (the acceptance cap — «يقبل 30k»)
    const over = sanitizeJobPayload("article_tool", {
      tool: "paraphrase",
      content: buildLongArticle(40_000),
      title: "t",
      keyword: "k",
      category: "c",
      language: "ar",
    }) as Record<string, unknown>;
    expect(String(over.content ?? "").length).toBe(30_000);
  });

  it("الصمت حرفيًا: صفر إفصاح بالقص بأي قناة — لا تحذير سجل، لا حقل نتيجة يعترف بالذيل المُسقط (60% من المقال)", async () => {
    const content = buildLongArticle(30_000);
    const result = (await PROCESSORS.article_tool({
      tool: "paraphrase",
      content,
      title: "اختبار INF-18",
      keyword: "اختبار",
      category: "تدريب",
      language: "ar",
    })) as Record<string, unknown>;
    // the result contract has NO truncation disclosure field
    const disclosedKeys = Object.keys(result).filter((k) =>
      /trunc|dropped|clipped|skipped_chars|content_chars|input_len|dropped_chars/i.test(k),
    );
    expect(disclosedKeys).toEqual([]);
    // and no console diagnostic fires for the dropped tail
    const warns = (console.warn as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    const errors = (console.error as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    const logs = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    const all = [...warns, ...errors, ...logs];
    expect(all.filter((l) => /truncat|dropped chars|قص.*حرف|30_?000|12_?000|14_?000/i.test(l))).toEqual([]);
  });

  it("ميزانية المخرجات (شق التدقيق الثاني): paraphrase يخدم بمخرج 4000 توكن — لا يستطيع حمل إعادة صياغة كاملة لنافذة 12k حرفًا عربية", () => {
    const resolved = resolveRegistrySpec("ai-job:paraphrase");
    expect(resolved).not.toBeNull();
    expect(resolved!.spec.policy.maxTokens).toBe(4000);
    // 12,000 Arabic chars ≈ >4,000 tokens — even the SEEN window cannot
    // ride back in full (the audit's «paraphrase بـ4k توكن يقص المقالات
    // الطويلة» clause, pinned at the registry single source).
  });

  it("مسار المشي الحي: الصف يخزّن 30k (منقّى) ثم المعالج يرسل 12k فقط — نفس تسلسل التجربة الحية (9d4dba9b)", async () => {
    const content = buildLongArticle(30_000);
    const sanitized = sanitizeJobPayload("article_tool", {
      tool: "paraphrase",
      content,
      title: "اختبار INF-18",
      keyword: "اختبار",
      category: "تدريب",
      language: "ar",
    }) as Record<string, unknown>;
    // the runner feeds the SANITIZED row payload (exactly the live walk)
    await PROCESSORS.article_tool(sanitized);
    expect(captured.calls.length).toBe(1);
    const { prompt } = captured.calls[0];
    expect(prompt.includes(String(sanitized.content).slice(0, 12_000))).toBe(true);
    expect(prompt.includes(PROBE_TAIL_AR)).toBe(false);
    expect(prompt.includes(MK.tailC)).toBe(false);
  });
});
