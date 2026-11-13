import { describe, it, expect } from "vitest";
import {
  normalizeToken,
  extractConcepts,
  canonicalConcept,
  jaccardSimilarity,
  detectSearchIntent,
  classifyPrimaryDomain,
  findSemanticTopicCollision,
  computeDomainCoverage,
  undercoveredDomains,
  saturatedDomains,
  buildDiversityDirective,
  pickLeastRecentlyUsedAngle,
  recommendedAngleOrder,
  angleUsedRecently,
  domainEssencePairs,
  FITNESS_DOMAINS,
  type DomainId,
} from "@/lib/blog-semantic";

/**
 * BLOG-DIVERSITY-ENGINE (owner order 2026-11-13) — the SEMANTIC dedup
 * gate that rides on top of the lexical isDuplicateTopic. These vectors
 * pin the owner's exact complaint class: articles that answer the SAME
 * reader question with DIFFERENT wording, plus the anti-goal — the
 * editorially-distinct intents (Phase-178 hours/impact/science) must
 * stay publishable. The gate is pure and deterministic: no DB, no AI.
 */

// ─────────────────────────────────────────────────────────────────
// Normalization + synonym canon
// ─────────────────────────────────────────────────────────────────

describe("normalizeToken — AR folding, clitic stripping, EN stemming", () => {
  it("folds Arabic letter variants and strips ال/بال/وال clitics", () => {
    expect(normalizeToken("العضلات")).toBe("عضلات");
    expect(normalizeToken("بالنوم")).toBe("نوم");
    expect(normalizeToken("والاستشفاء")).toBe("استشفاء");
    expect(normalizeToken("أفضل")).toBe(""); // stopword after fold
  });

  it("light-stems English plurals/gerunds and drops stopwords", () => {
    expect(normalizeToken("Muscles")).toBe("muscle");
    expect(normalizeToken("training")).toBe("train");
    expect(normalizeToken("the")).toBe("");
    expect(normalizeToken("guide")).toBe("");
  });
});

describe("extractConcepts — the synonym canon bridges reworded topics", () => {
  it("maps ساعة/المدة/وقت and hours/duration onto one dur concept", () => {
    const sig = extractConcepts("كم ساعة النوم والمدة المثالية ووقت");
    expect(sig.has("dur")).toBe(true);
    expect(extractConcepts("optimal sleep duration hours").has("dur")).toBe(true);
  });

  it("maps حرق/خسارة/نزول and burn/loss onto one lose concept", () => {
    expect(extractConcepts("حرق الدهون وخسارة الوزن").has("lose")).toBe(true);
    expect(extractConcepts("fat burning vs weight loss").has("lose")).toBe(true);
  });

  it("canonicalConcept is identity for non-members", () => {
    expect(canonicalConcept("سكوات")).toBe("سكوات");
    expect(canonicalConcept("نوم")).toBe("sleep");
  });

  it("cross-language: النوم and sleep collapse to the same concept", () => {
    expect(extractConcepts("النوم والاستشفاء").has("sleep")).toBe(true);
    expect(extractConcepts("sleep and recovery").has("sleep")).toBe(true);
  });
});

describe("jaccardSimilarity", () => {
  it("is 1 for identical sets, 0 for disjoint, fractional otherwise", () => {
    expect(jaccardSimilarity(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
    expect(jaccardSimilarity(new Set(["a"]), new Set(["b"]))).toBe(0);
    expect(jaccardSimilarity(new Set(["a", "b", "c"]), new Set(["a", "b", "d"]))).toBeCloseTo(2 / 4);
  });
});

// ─────────────────────────────────────────────────────────────────
// Search intent
// ─────────────────────────────────────────────────────────────────

describe("detectSearchIntent — AR + EN", () => {
  it("classifies Arabic question openers (the \\b trap is fixed)", () => {
    // JS \b never fires between two Arabic letters — without the negative
    // lookahead these fell through to "descriptive" and the
    // same-domain+same-intent gate silently weakened.
    expect(detectSearchIntent("كم ساعة نوم يحتاج الرياضي")).toBe("question");
    expect(detectSearchIntent("هل الكرياتين آمن للكلى؟")).toBe("question");
    expect(detectSearchIntent("ماذا تأكل قبل التمرين")).toBe("question");
  });

  it("does NOT treat كم prefixed inside another word as a question", () => {
    expect(detectSearchIntent("كمية البروتين اليومية وأثرها")).toBe("descriptive");
  });

  it("classifies how-to, comparison, myth, plan and number-list intents", () => {
    expect(detectSearchIntent("كيف تزيد وزن الديدلفت تدريجيًا")).toBe("how-to");
    expect(detectSearchIntent("How to increase your deadlift")).toBe("how-to");
    expect(detectSearchIntent("الفرق بين الواي والكازين بروتين")).toBe("comparison");
    expect(detectSearchIntent("Whey vs casein protein")).toBe("comparison");
    expect(detectSearchIntent("خرافة الكارديو صباحًا على معدة فارغة")).toBe("myth");
    expect(detectSearchIntent("أخطاء شائعة في تمرين السكوات")).toBe("myth");
    expect(detectSearchIntent("برنامج تدريب ثلاثة أيام للمبتدئين")).toBe("plan");
    expect(detectSearchIntent("جدول التغذية الأسبوعي للتضخيم")).toBe("plan");
    expect(detectSearchIntent("8 foods every lifter should eat")).toBe("number-list");
    expect(detectSearchIntent("دليل شامل لاختيار الأحذية")).toBe("descriptive");
  });

  it("does NOT classify a protein title as a plan (روتين inside البروتين)", () => {
    // Regression vector: the bare-substring plan pattern matched روتين
    // inside البروتين — every protein article was a "plan".
    expect(detectSearchIntent("أفضل مصادر البروتين للرياضيين")).toBe("descriptive");
    expect(detectSearchIntent("بروتين الواي بعد التمرين")).toBe("descriptive");
  });
});

// ─────────────────────────────────────────────────────────────────
// Domain taxonomy
// ─────────────────────────────────────────────────────────────────

describe("classifyPrimaryDomain — the 11 fitness-identity domains", () => {
  const cases: Array<[string, DomainId]> = [
    ["كم ساعة نوم يحتاج الرياضي", "recovery"],
    ["المدة المثالية للنوم لاستشفاء العضلات", "recovery"],
    ["best creatine dose for strength", "supplements"],
    ["حرق دهون البطن بعجز السعرات", "fat-loss"],
    ["برنامج تمارين منزلية بدون معدات", "training"],
    ["ألم الركبة عند السكوات: الوقاية", "injury-prevention"],
    ["sarcopenia muscle loss after 60", "metabolic-aging"],
    ["خرافات التغذية الشائعة", "mistakes-myths"],
    ["قائمة مشتريات الجيم للمبتدئين", "practical-guides"],
  ];
  for (const [text, domain] of cases) {
    it(`classifies «${text}» → ${domain}`, () => {
      expect(classifyPrimaryDomain(text)).toBe(domain);
    });
  }

  it("the taxonomy stays inside the Alkemos fitness identity (11 domains)", () => {
    expect(FITNESS_DOMAINS.length).toBe(11);
    expect(domainEssencePairs("recovery")).toContainEqual(["sleep", "dur"]);
  });
});

// ─────────────────────────────────────────────────────────────────
// The semantic collision gate — owner vectors + distinct-intent guards
// ─────────────────────────────────────────────────────────────────

describe("findSemanticTopicCollision — the owner's complaint vectors", () => {
  it("OWNER VECTOR: «كم ساعة نوم يحتاج الرياضي؟» vs «المدة المثالية للنوم…» collides (same-essence)", () => {
    // The owner order's canonical example: zero shared words with the
    // published title, yet the SAME reader question (sleep DURATION).
    // Pure Jaccard scores this pair at ~0.25 — below every threshold —
    // so the {sleep, dur} essence pair is what must catch it.
    const res = findSemanticTopicCollision(
      "كم ساعة نوم يحتاج الرياضي؟",
      "كم ساعة نوم يحتاج الرياضي؟",
      [{ title: "المدة المثالية للنوم لأفضل استشفاء عضلي", focusKeyword: "" }],
    );
    expect(res.collision).toBe(true);
    expect(res.reason).toBe("same-essence");
  });

  it("EN twin of the owner vector: 'how many hours do athletes need to sleep' vs 'ideal sleep duration for recovery'", () => {
    const res = findSemanticTopicCollision(
      "How many hours of sleep do athletes need?",
      "sleep hours for athletes",
      [{ title: "Ideal sleep duration for muscle recovery", focusKeyword: "" }],
    );
    expect(res.collision).toBe(true);
  });

  it("PARAPHRASE: reworded chest-home-workout title with synonym swap collides", () => {
    const res = findSemanticTopicCollision(
      "تمارين الصدر في المنزل بدون أجهزة",
      "تمارين الصدر المنزلية",
      [{ title: "أفضل تمارين الصدر المنزلية للمبتدئين", focusKeyword: "" }],
    );
    expect(res.collision).toBe(true);
    expect(res.reason).toBe("paraphrase");
  });

  it("SAME DOMAIN + SAME INTENT: two 'best carbs' how-to guides collide at low Jaccard", () => {
    const res = findSemanticTopicCollision(
      "أفضل مصادر الكربوهيدرات قبل التمرين",
      "أفضل مصادر الكربوهيدرات قبل التمرين",
      [{ title: "أفضل الكربوهيدرات للطاقة في التمرين", focusKeyword: "" }],
    );
    expect(res.collision).toBe(true);
    expect(res.reason).toBe("same-domain-same-intent");
  });

  it("fat-loss essence: «حرق دهون البطن» vs «خسارة وزن البطن» collides", () => {
    const res = findSemanticTopicCollision(
      "تمارين حرق دهون البطن",
      "حرق دهون البطن",
      [{ title: "خطة خسارة وزن البطن والكرش", focusKeyword: "" }],
    );
    expect(res.collision).toBe(true);
  });

  it("injury essence: «ألم الركبة عند الجري» vs «آلام الركبة بعد التمرين» collides", () => {
    const res = findSemanticTopicCollision(
      "ألم الركبة عند الجري",
      "ألم الركبة عند الجري",
      [{ title: "أسباب آلام الركبة بعد التمرين وعلاجها بالتدريب", focusKeyword: "" }],
    );
    expect(res.collision).toBe(true);
  });
});

describe("findSemanticTopicCollision — the distinct-intent guards (must NOT collide)", () => {
  // Phase-178 consolidated intents — the editorial law that keeps three
  // sleep ANGLES alive. The semantic gate must not become a machine that
  // blocks every same-domain topic.
  const hoursTitle = "كم ساعة نوم يحتاجها الرياضي لبناء العضلات؟ دليل للنتائج";
  const hoursKw = "كم ساعة نوم لبناء العضلات";
  const impact = {
    title: "كيف يؤثر النوم والاستشفاء على بناء العضلات في الجيم بسرعة؟",
    focusKeyword: "تأثير النوم على بناء العضلات",
  };
  const science = {
    title: "دليل علمي: تأثير النوم على بناء العضلات وهرمونات النمو",
    focusKeyword: "علم النوم وهرمونات النمو",
  };

  it("hours (count) stays distinct from impact (effect)", () => {
    const res = findSemanticTopicCollision(hoursTitle, hoursKw, [impact]);
    expect(res.collision).toBe(false);
  });

  it("hours (count) stays distinct from science (mechanism)", () => {
    const res = findSemanticTopicCollision(hoursTitle, hoursKw, [science]);
    expect(res.collision).toBe(false);
  });

  it("sleep timing vs sleep duration stay distinct (no dur concept in the twin)", () => {
    const res = findSemanticTopicCollision(
      "النوم قبل التمرين أم بعده؟",
      "النوم قبل التمرين أم بعده",
      [{ title: "المدة المثالية للنوم لاستشفاء العضلات", focusKeyword: "" }],
    );
    expect(res.collision).toBe(false);
  });

  it("stretching-for-recovery vs sleep-duration stay distinct (single shared concept)", () => {
    const res = findSemanticTopicCollision(
      "تمارين الإطالة قبل النوم لتحسين الاستشفاء",
      "تمارين الإطالة قبل النوم",
      [{ title: "كم ساعة نوم يحتاج الرياضي؟", focusKeyword: "" }],
    );
    expect(res.collision).toBe(false);
  });

  it("different domains never essence-collide (knee pain vs knee sleeves choice)", () => {
    const res = findSemanticTopicCollision(
      "أفضل ركبة مطاطية للتدريب",
      "أفضل ركبة مطاطية",
      [{ title: "علاج ألم الركبة عند السكوات", focusKeyword: "" }],
    );
    expect(res.collision).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Coverage balancing (flexible — never a forced equal split)
// ─────────────────────────────────────────────────────────────────

describe("computeDomainCoverage / undercoveredDomains / saturatedDomains", () => {
  it("weights recent sleep articles heavily and surfaces the gap domains", () => {
    const recent = [
      { title: "كم ساعة نوم يحتاج الرياضي؟", focusKeyword: "" },
      { title: "المدة المثالية للنوم", focusKeyword: "" },
      { title: "النوم وهرمون النمو", focusKeyword: "" },
      { title: "تأثير النوم على العضلات", focusKeyword: "" },
    ];
    // The directive's production window (limit 5): recovery is the
    // saturated head and must NOT appear among the under-covered set.
    const under = undercoveredDomains(recent, 5).map((d) => d.id);
    expect(under.length).toBe(5);
    expect(under).not.toContain("recovery");
    const saturated = saturatedDomains(recent, 1).map((d) => d.id);
    expect(saturated).toContain("recovery");
  });

  it("coverage counts every domain with weight ≥ 0 and orders ascending", () => {
    const cov = computeDomainCoverage([{ title: "حرق الدهون", focusKeyword: "" }]);
    expect(cov.length).toBe(11);
    expect(cov.find((c) => c.domain.id === "fat-loss")!.weight).toBeGreaterThan(0);
  });
});

describe("buildDiversityDirective — bilingual prompt block", () => {
  const recent = [
    { title: "كم ساعة نوم يحتاج الرياضي؟", focusKeyword: "" },
    { title: "النوم والاستشفاء", focusKeyword: "" },
  ];

  it("AR directive names the under-covered domains first and the fitness identity law", () => {
    const ar = buildDiversityDirective("ar", recent);
    expect(ar).toContain("خطة تنويع التغطية");
    expect(ar).toContain("التعافي"); // listed as saturated
    expect(ar).toContain("لا موضوعات الطب العام");
  });

  it("EN directive names the least-covered domains and the identity law", () => {
    const en = buildDiversityDirective("en", recent);
    expect(en).toContain("COVERAGE DIVERSITY PLAN");
    expect(en).toContain("no general medicine");
  });
});

// ─────────────────────────────────────────────────────────────────
// LRU angle rotation
// ─────────────────────────────────────────────────────────────────

describe("pickLeastRecentlyUsedAngle / recommendedAngleOrder / angleUsedRecently", () => {
  const ids = ["deep-dive", "practical-guide", "myth-bust", "comparison", "plan"];

  it("never-used angles win first (registry order breaks ties)", () => {
    expect(pickLeastRecentlyUsedAngle(ids, ["deep-dive", "myth-bust"], "deep-dive")).toBe(
      "practical-guide",
    );
  });

  it("all-used → the angle with the OLDEST last use wins", () => {
    // newest-first history covering ALL five ids: plan (idx 4) is the
    // oldest last use → the LRU head.
    expect(
      pickLeastRecentlyUsedAngle(
        ids,
        ["deep-dive", "practical-guide", "myth-bust", "comparison", "plan"],
        "deep-dive",
      ),
    ).toBe("plan");
  });

  it("empty history keeps the legacy random fallback", () => {
    expect(pickLeastRecentlyUsedAngle(ids, [], "fallback-x")).toBe("fallback-x");
  });

  it("recommendedAngleOrder puts never-used angles before recently used ones", () => {
    const order = recommendedAngleOrder(ids, ["deep-dive"]);
    expect(order.indexOf("practical-guide")).toBeLessThan(order.indexOf("deep-dive"));
  });

  it("angleUsedRecently slices the newest-first window", () => {
    expect(angleUsedRecently("deep-dive", ["deep-dive", "comparison"], 2)).toBe(true);
    expect(angleUsedRecently("deep-dive", ["comparison", "deep-dive"], 1)).toBe(false);
  });
});
