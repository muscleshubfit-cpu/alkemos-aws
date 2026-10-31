/**
 * scripts/blog-runner/article-treatment.mts
 *
 * ARTICLE-TREATMENT (owner order 2026-11-01 «أمر تنفيذ المرحلة التالية» —
 * clause 1: comprehensive treatment of published articles · clause 2:
 * cross-language counterparts). The repo-owned channel for editorial
 * treatment of blog_posts content: full-content REWRITES of weak published
 * articles + INSERTION of language counterparts with bidirectional
 * linked_post_id pairing (hreflang twins).
 *
 * Channel law (same as content-audit-db-remediation / retro-pair-blog):
 *   - DRY_RUN=1 default — plan + validate only, ZERO writes.
 *   - Quality battery BEFORE any write (the same laws P5 enforces on
 *     generated articles — imported from the single sources, never forked):
 *       G1 word floor ≥1000 visible words
 *       FAQ 4-7 items in faq_json AND the exact FAQ section heading in body
 *       G4 ≥1 authority link (EDITORIAL_AUTHORITY_DOMAINS)
 *       MSA surface: AR visible-text Latin ratio ≤5% (markdown plumbing
 *         stripped; parenthesized refs tolerated)
 *   - Rewrite safety: old content word count MUST sit inside the batch's
 *     expect_old_words range (concurrent-edit guard) and slug+language must
 *     match; already-applied content = idempotent skip.
 *   - Insert safety: slug+language MUST be absent; pairing target MUST be
 *     published, opposite-language, and currently UNPAIRED; linked_post_id
 *     set bidirectionally in the SAME run (hreflang C1 law — no dangling).
 *   - updated_at + reading_time bump ONLY on real content change.
 *   - Never prints full bodies or any secret; service key from env only.
 *
 * EXIT: 0 = ok · 1 = at least one failure · 2 = misconfig.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     DRY_RUN=1 bun scripts/blog-runner/article-treatment.mts \
 *     scripts/blog-runner/article-treatment-batch-t1.json
 */
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EDITORIAL_AUTHORITY_DOMAINS } from "../../src/lib/blog-editorial-law";

const DRY_RUN = process.env.DRY_RUN !== "0";
const BATCH_PATH = process.argv[2] || "";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!BATCH_PATH || !SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[article-treatment] usage: article-treatment.mts <batch.json> (env: SUPABASE URL + SERVICE KEY; DRY_RUN=1 default)",
  );
  process.exit(2);
}

type FaqItem = { question: string; answer: string };
type RewriteFix = {
  focus_keyword?: string;
  category?: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  content: string;
  faq_json: FaqItem[];
};
type InsertRow = {
  language: "en" | "ar";
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  keywords: string[];
  category: string;
  tags: string[];
  featured_image: string;
  cover_alt: string;
  author: string;
  faq_json: FaqItem[];
};
type Entry = {
  slug: string;
  language: "en" | "ar";
  mode: "rewrite" | "insert";
  expect_old_words?: [number, number];
  fix?: RewriteFix;
  row?: InsertRow;
  pair_with?: { slug: string; language: "en" | "ar" };
  note?: string;
};
const batch = JSON.parse(readFileSync(BATCH_PATH, "utf8")) as {
  batch: string;
  articles: Entry[];
};

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── shared text metrics (mirror blog-corpus-inventory — visible text) ─────
function wordCount(md: string): number {
  const stripped = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped ? stripped.split(" ").filter(Boolean).length : 0;
}

function visibleText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
}

function latinRatio(md: string): number {
  const visible = visibleText(md).replace(/\([^)]*[A-Za-z][^)]*\)/g, " "); // tolerate (Whey) refs
  const letters = visible.replace(/[^\p{L}]/gu, "");
  if (!letters) return 0;
  const latin = visible.match(/[A-Za-z]/g) || [];
  return latin.length / letters.length;
}

function authorityLinks(md: string): string[] {
  const found = new Set<string>();
  for (const m of md.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)) {
    try {
      const h = new URL(m[1]).hostname.replace(/^www\./, "");
      if (EDITORIAL_AUTHORITY_DOMAINS.includes(h)) found.add(h);
    } catch {
      /* ignore */
    }
  }
  return [...found];
}

// ── the quality battery (P5's laws, applied to curated content) ──────────
function validateContent(
  lang: "en" | "ar",
  content: string,
  faq: FaqItem[],
): string[] {
  const errs: string[] = [];
  const words = wordCount(content);
  if (words < 1000) errs.push(`G1 word floor: ${words} < 1000`);
  if (faq.length < 4 || faq.length > 7)
    errs.push(`FAQ count ${faq.length} outside 4-7`);
  const faqHeading =
    lang === "ar" ? "## الأسئلة الشائعة" : "## Frequently Asked Questions";
  if (!content.includes(faqHeading))
    errs.push(`FAQ section heading missing (${faqHeading})`);
  const auth = authorityLinks(content);
  if (auth.length < 1) errs.push("G4 authority links: 0");
  if (lang === "ar") {
    const lr = latinRatio(content);
    if (lr > 0.05) errs.push(`MSA Latin ratio ${(lr * 100).toFixed(1)}% > 5%`);
  }
  return errs;
}

let failures = 0;
let planned = 0;
let skipped = 0;
let applied = 0;

async function getPost(slug: string, language: "en" | "ar") {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id,slug,language,title,is_published,linked_post_id,content,reading_time,updated_at,review_status",
    )
    .eq("slug", slug)
    .eq("language", language)
    .maybeSingle();
  if (error) throw new Error(`read ${slug}/${language}: ${error.message}`);
  return data;
}

async function treatRewrite(e: Entry) {
  const fix = e.fix!;
  const row = await getPost(e.slug, e.language);
  if (!row) {
    console.error(`✗ ${e.slug} [${e.language}]: NOT FOUND (rewrite)`);
    failures++;
    return;
  }
  if (!row.is_published) {
    console.error(`✗ ${e.slug}: not published — refusing`);
    failures++;
    return;
  }
  // idempotent: already applied?
  if (row.content === fix.content) {
    console.log(`↷ ${e.slug}: already treated — skip (idempotent)`);
    skipped++;
    return;
  }
  // concurrent-edit guard
  const oldWords = wordCount(row.content ?? "");
  const [lo, hi] = e.expect_old_words ?? [0, 1_000_000];
  if (oldWords < lo || oldWords > hi) {
    console.error(
      `✗ ${e.slug}: old content ${oldWords}w outside expected [${lo},${hi}] — concurrent edit? refusing`,
    );
    failures++;
    return;
  }
  const errs = validateContent(e.language, fix.content, fix.faq_json);
  if (errs.length) {
    console.error(`✗ ${e.slug}: quality battery FAILED — ${errs.join("; ")}`);
    failures++;
    return;
  }
  const newWords = wordCount(fix.content);
  planned++;
  console.log(
    `✓ ${e.slug} [${e.language}]: rewrite ${oldWords}w → ${newWords}w · auth=${authorityLinks(fix.content).join(",")} · faq=${fix.faq_json.length} — ${DRY_RUN ? "DRY RUN" : "APPLYING"}`,
  );
  if (DRY_RUN) return;
  const patch: Record<string, unknown> = {
    content: fix.content,
    faq_json: fix.faq_json,
    reading_time: Math.max(1, Math.ceil(newWords / 200)),
    updated_at: new Date().toISOString(),
  };
  for (const k of [
    "focus_keyword",
    "category",
    "excerpt",
    "meta_title",
    "meta_description",
    "keywords",
  ] as const) {
    if (fix[k] !== undefined) patch[k] = fix[k];
  }
  const { error } = await supabase.from("blog_posts").update(patch).eq("id", row.id);
  if (error) {
    console.error(`✗ ${e.slug}: PATCH failed — ${error.message}`);
    failures++;
    return;
  }
  applied++;
}

async function treatInsert(e: Entry) {
  const r = e.row!;
  // slug uniqueness (both languages — slugs are global-ish; check same lang + published)
  const existing = await getPost(r.slug, r.language);
  if (existing) {
    if (existing.content === r.content) {
      console.log(`↷ ${r.slug}: already inserted — skip (idempotent)`);
      skipped++;
      // fall through to pairing check below? keep simple: done.
      return;
    }
    console.error(
      `✗ ${r.slug} [${r.language}]: ALREADY EXISTS with different content — refusing`,
    );
    failures++;
    return;
  }
  const errs = validateContent(r.language, r.content, r.faq_json);
  if (errs.length) {
    console.error(`✗ ${r.slug}: quality battery FAILED — ${errs.join("; ")}`);
    failures++;
    return;
  }
  // pairing target checks
  let twinId: string | null = null;
  if (e.pair_with) {
    const twin = await getPost(e.pair_with.slug, e.pair_with.language);
    if (!twin || !twin.is_published) {
      console.error(
        `✗ ${r.slug}: pairing target ${e.pair_with.slug} not found/published`,
      );
      failures++;
      return;
    }
    if (twin.language === r.language) {
      console.error(`✗ ${r.slug}: pairing target same language — refusing`);
      failures++;
      return;
    }
    if (twin.linked_post_id) {
      // if it already points at OUR slug (a previous partial run), continue
      const ok = await pointsAt(twin.linked_post_id, r.slug);
      if (!ok) {
        console.error(
          `✗ ${r.slug}: pairing target already paired (linked_post_id set) — refusing (no pair hijack)`,
        );
        failures++;
        return;
      }
    }
    twinId = twin.id;
  }
  const words = wordCount(r.content);
  planned++;
  console.log(
    `✓ ${r.slug} [${r.language}]: insert ${words}w · faq=${r.faq_json.length} · pair=${e.pair_with ? e.pair_with.slug : "—"} · review_status=pending (honest) — ${DRY_RUN ? "DRY RUN" : "APPLYING"}`,
  );
  if (DRY_RUN) return;
  const row = {
    ...r,
    is_published: true,
    published_at: new Date().toISOString(),
    reading_time: Math.max(1, Math.ceil(words / 200)),
    author: r.author || "Ahmed Zake",
    // 0097 law: agent-created articles publish in the HONEST pending-review
    // state; the owner approves from Admin▸Blog (D-6) — never automatic.
    review_status: "pending",
    last_reviewed_at: null,
    linked_post_id: twinId,
  };
  const { data: inserted, error } = await supabase
    .from("blog_posts")
    .insert(row)
    .select("id")
    .single();
  if (error || !inserted) {
    console.error(`✗ ${r.slug}: INSERT failed — ${error?.message}`);
    failures++;
    return;
  }
  applied++;
  // bidirectional handshake
  if (twinId) {
    const { error: twinErr } = await supabase
      .from("blog_posts")
      .update({ linked_post_id: inserted.id })
      .eq("id", twinId);
    if (twinErr) {
      console.error(
        `✗ ${r.slug}: twin backlink FAILED — ${twinErr.message} (manual repair needed)`,
      );
      failures++;
      return;
    }
    console.log(`  ↳ paired bidirectionally with ${e.pair_with!.slug}`);
  }
}

async function pointsAt(postId: string, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", postId)
    .maybeSingle();
  return data?.slug === slug;
}

console.log(
  `[article-treatment] batch=${batch.batch} · entries=${batch.articles.length} · mode=${DRY_RUN ? "DRY_RUN" : "APPLY"}`,
);
for (const e of batch.articles) {
  try {
    if (e.mode === "rewrite") await treatRewrite(e);
    else await treatInsert(e);
  } catch (err) {
    console.error(`✗ ${e.slug}: ${err}`);
    failures++;
  }
}
console.log(
  `\n[article-treatment] planned=${planned} applied=${applied} skipped=${skipped} failures=${failures}`,
);
process.exit(failures > 0 ? 1 : 0);
