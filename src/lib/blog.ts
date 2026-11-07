"use client";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sizedRemoteImage } from "@/lib/remote-image-size";
import { matchesBlogSearch } from "./blog-search";

// §12.40 (P2-14): re-exported so the blog domain keeps one public surface
// for the search law (the pure implementation lives in ./blog-search —
// importable from tests and server code without the Supabase client).
export { matchesBlogSearch };

/** FAQ item stored in blog_posts.faq_json (JSONB array of {question, answer}). */
export type BlogFaq = { question: string; answer: string };

export type BlogPost = {
 id: string;
 language: "en" | "ar";
 title: string;
 slug: string;
 excerpt: string | null;
 content: string;
 meta_title: string | null;
 meta_description: string | null;
 focus_keyword: string | null;
 keywords: string[];
 category: string;
 tags: string[];
 featured_image: string | null;
 cover_alt: string | null;
 reading_time: number;
 author: string;
 published_at: string | null;
 updated_at: string;
 is_published: boolean;
 faq_json: BlogFaq[] | null;
 schema_json: Record<string, unknown> | null;
 linked_post_id: string | null;
 created_at: string;
 // 0097 (audit Phase 2 · item 1): the honest review state. 'pending' =
 // published awaiting the owner's review; 'reviewed' = actually
 // reviewed (last_reviewed_at then carries the real timestamp).
 // OPTIONAL on the client shape: rows fetched during the deploy/migration
 // transition window lack the columns (undefined = pending — same honest
 // default the DB default encodes). The generated supabase types.ts Row
 // keeps them REQUIRED — that is the DB truth.
 review_status?: string;
 last_reviewed_at?: string | null;
};

// PHASE 192 (fork fix): the registry moved to src/lib/blog-categories.ts —
// the client list carried 10 ids while blog-server.ts's fork carried 8
// (fitness/wellness missing), so the server category-page gate 404'd
// exactly the ids the client stored. Both sides now re-export ONE list.
export {
  BLOG_CATEGORIES,
  VALID_CATEGORY_IDS,
  normalizeCategory,
  effectiveCategory,
  getCategoryLabel,
} from "./blog-categories";

/**
 * Phase 134 (perf): the LIST/CARD shape — everything the blog list,
 * landing "latest articles" and coaching sections actually render.
 * Deliberately EXCLUDES the heavy fields (`content` ~10-30KB per post,
 * `schema_json`, `faq_json`) so list queries never ship article bodies.
 * The /blog HTML was 476KB precisely because the list selected "*" and
 * serialized 27 full articles into the RSC payload.
 */
export type BlogPostCard = Pick<
  BlogPost,
  | "id"
  | "language"
  | "title"
  | "slug"
  | "excerpt"
  | "focus_keyword"
  | "keywords"
  | "category"
  | "tags"
  | "featured_image"
  | "cover_alt"
  | "reading_time"
  | "author"
  | "published_at"
  | "created_at"
>;

export async function listBlogPosts(lang: "en" | "ar", category?: string, search?: string): Promise<BlogPostCard[]> {
 // PHASE 182: fetch the Supabase client chunk on demand — blog.ts is in
 // the public first-load graph (LanguageToggle / LandingView / blog pages).
 if (!isSupabaseConfigured) return [];
 const { supabase } = await import("@/lib/supabase/client");
 if (!supabase) return [];
 try {
  // Phase 134: card fields only — `content`/`schema_json`/`faq_json` are
  // for the ARTICLE page (fetched per-slug), never for lists.
  let query = supabase
  .from("blog_posts")
  .select(
    "id, language, title, slug, excerpt, focus_keyword, keywords, category, tags, featured_image, cover_alt, reading_time, author, published_at, created_at",
  )
  .eq("is_published", true)
  .eq("language", lang)
  .order("published_at", { ascending: false });

  if (category && category !== "all") {
  query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
  return [];
  }

  let posts = (data ?? []) as BlogPostCard[];

  // §12.40: client-side search (Supabase text search requires pg_trgm) —
  // delegated to the shared matchesBlogSearch predicate (single law).
  if (search && search.trim()) {
    posts = posts.filter((p) => matchesBlogSearch(p, search));
  }

  return posts;
 } catch {
  return [];
 }
}

export async function getBlogPost(lang: "en" | "ar", slug: string): Promise<BlogPost | null> {
 if (!isSupabaseConfigured) return null;
 const { supabase } = await import("@/lib/supabase/client");
 if (!supabase) return null;
 try {
  const { data, error } = await supabase
  .from("blog_posts")
  .select("*")
  .eq("language", lang)
  .eq("slug", slug)
  .eq("is_published", true)
  .maybeSingle();

  if (error) {
  return null;
  }
  return (data as BlogPost) || null;
 } catch {
  return null;
 }
}

export async function getRelatedPosts(
 post: Pick<BlogPost, "id" | "language" | "category">,
 limit = 3,
): Promise<BlogPostCard[]> {
 if (!isSupabaseConfigured) return [];
 const { supabase } = await import("@/lib/supabase/client");
 if (!supabase) return [];
 try {
  // Phase 134: card fields only (list context — bodies never ship here).
  const { data, error } = await supabase
  .from("blog_posts")
  .select(
    "id, language, title, slug, excerpt, focus_keyword, keywords, category, tags, featured_image, cover_alt, reading_time, author, published_at, created_at",
  )
  .eq("is_published", true)
  .eq("language", post.language)
  .eq("category", post.category)
  .neq("id", post.id)
  .limit(limit);

  if (error) {
  return [];
  }
  return (data ?? []) as BlogPostCard[];
 } catch {
  return [];
 }
}

export async function getLinkedPost(
 post: Pick<BlogPost, "linked_post_id">,
): Promise<BlogPostCard | null> {
 if (!post.linked_post_id || !isSupabaseConfigured) return null;
 const { supabase } = await import("@/lib/supabase/client");
 if (!supabase) return null;
 try {
  // Phase 134: card fields only — the linked teaser renders title + link.
  const { data, error } = await supabase
  .from("blog_posts")
  .select(
    "id, language, title, slug, excerpt, focus_keyword, keywords, category, tags, featured_image, cover_alt, reading_time, author, published_at, created_at",
  )
  .eq("id", post.linked_post_id)
  .eq("is_published", true)
  .maybeSingle();

  if (error) {
  return null;
  }
  return (data as BlogPostCard) || null;
 } catch {
  return null;
 }
}

/* ------------------------------------------------------------------ */
/* Homepage blog carousels — latest + featured selection (Phase 118). */
/* ------------------------------------------------------------------ */
/* F-4 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed 2026-11-07): */
/* the law moved VERBATIM to the directive-free ./blog-home-carousel.ts so */
/* the SERVER home routes can run the selection for the #learn island's   */
/* initial props (the matchesBlogSearch/blog-search.ts precedent). This   */
/* client module re-exports it — one public surface for every importer.   */
export {
  HOME_LATEST_COUNT,
  HOME_FEATURED_COUNT,
  selectHomeBlogCarousels,
} from "./blog-home-carousel";

/** Parse markdown content into headings for Table of Contents */
export function parseTableOfContents(content: string): Array<{ level: number; text: string; id: string }> {
 const lines = content.split("\n");
 const toc: Array<{ level: number; text: string; id: string }> = [];
 for (const line of lines) {
 const match = line.match(/^(#{2,3})\s+(.+)/);
 if (match) {
 const level = match[1].length;
 const text = match[2].trim();
 const id = text
 .toLowerCase()
 .replace(/[^\w\u0600-\u06FF\s-]/g, "")
 .replace(/\s+/g, "-")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
 toc.push({ level, text, id });
 }
 }
 return toc;
}

/**
 * Escape HTML special characters in text content. Used before interpolating
 * user/AI-generated text into HTML to prevent stored XSS.
 *
 * The order matters: & must be escaped first so we don't double-escape
 * entities we just produced.
 */
function escapeHtml(s: string): string {
 return s
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&#39;");
}

/**
 * Validate that a URL is safe to use in an href/src attribute.
 * Allows http, https, mailto, tel, and fragment (#...) links.
 * Rejects javascript:, data:, vbscript:, and anything else.
 */
export function isSafeUrl(url: string): boolean {
 const trimmed = url.trim();
 if (!trimmed) return false;
 if (trimmed.startsWith("#")) return true;
 if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return true;
 // Relative URLs (no scheme) are also safe
 if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return true;
 return false;
}

/** Convert markdown to HTML (basic — for production use a proper parser) */
export function renderMarkdown(content: string): string {
 // 1. Extract code blocks first (their content is escaped, not markdown-parsed)
 const codeBlocks: string[] = [];
 let html = content.replace(/```([\s\S]*?)```/g, (_, code) => {
 const escaped = escapeHtml(code.trim());
 codeBlocks.push(`<pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>${escaped}</code></pre>`);
 return `\u0000CODEBLOCK${codeBlocks.length - 1}\u0000`;
 });

 // 2. Extract inline code (`code`) — also escaped, not parsed
 const inlineCodes: string[] = [];
 html = html.replace(/`([^`\n]+)`/g, (_, code) => {
 const escaped = escapeHtml(code);
 inlineCodes.push(`<code class="bg-muted px-1.5 py-0.5 rounded text-sm">${escaped}</code>`);
 return `\u0000INLINE${inlineCodes.length - 1}\u0000`;
 });

 // 3. Escape the rest of the content (prevents XSS from raw <script>, onerror=, etc.)
 html = escapeHtml(html);

 // 4. Headings with IDs (text is already escaped)
 html = html.replace(/^### (.+)$/gm, (_, text) => {
 const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "-");
 return `<h3 id="${id}" class="text-lg font-bold mt-6 mb-2">${text}</h3>`;
 });
 html = html.replace(/^## (.+)$/gm, (_, text) => {
 const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "-");
 return `<h2 id="${id}" class="text-xl font-bold mt-8 mb-3">${text}</h2>`;
 });
 // PHASE 187 — single-H1 law (2026-09-13 deep-audit P0-1): the article
 // template owns the page's ONLY <h1> (post.title in the hero). Live
 // audit: 22/69 published articles carried `# Title` as the body's first
 // line → two <h1> tags on one page. The renderer now demotes any body
 // `# ` heading to <h2> (hard backstop — one H1 per page forever,
 // whatever the data); the title-duplicating line itself is stripped at
 // render time by stripTitleHeadingFromBody (blog-msa.ts — same pattern
 // as the Phase-178 FAQ strip) so the reader never sees the title twice.
 html = html.replace(/^# (.+)$/gm, (_, text) => {
 const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "-");
 return `<h2 id="${id}" class="text-xl font-bold mt-8 mb-3">${text}</h2>`;
 });

 // 5. Bold
 html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

 // 6. Italic
 html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

 // 7. Blockquotes
 html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-s-4 border-primary ps-4 py-2 my-4 text-muted-foreground italic">$1</blockquote>');

 // 8. Ordered lists
 html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="ms-6 list-decimal">$2</li>');
 html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ol class="space-y-1 my-4">${match}</ol>`);

 // 9. Unordered lists
 html = html.replace(/^-\s+(.+)$/gm, '<li class="ms-6 list-disc">$1</li>');

 // 10. Tables (basic) — cells already escaped
 // CONTENT-AUDIT P0-2 (2026-09-28, audit 1.2): the old rule matched EVERY
 // pipe-bearing line, including the markdown separator row (`| --- | --- |`),
 // which then rendered as a VISIBLE `<tr><td>---</td>...` row inside the
 // table (live-audit: 4 AR articles, 17 visible separator cells). A row
 // whose cells are all colon/dash filler is separator syntax, never data -
 // dropped here so every stored article renders clean regardless of when
 // it was written (render-time law: DB rows untouched).
 html = html.replace(/\|(.+)\|/g, (_, body) => {
 const cells = body.split("|").map((c: string) => c.trim()).filter(Boolean);
 const isSeparatorRow =
   cells.length > 0 && cells.every((c: string) => /^:?-{3,}:?$/.test(c));
 if (isSeparatorRow) return "";
 return `<tr>${cells.map((c: string) => `<td class="p-2 border border-border">${c}</td>`).join("")}</tr>`;
 });
 html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table class="w-full text-sm border-collapse my-4"><tbody>${match}</tbody></table>`);

 // 10.5 Images — ![alt](url) MUST be converted BEFORE the link rule.
 // OWNER BUG (2026-08-28): with no image rule, the link regex below
 // consumed "[alt](url)" inside "![alt](url)" and every body image
 // rendered as a bare text link (the "!" left as stray punctuation).
 // alt/url are already HTML-escaped by step 3, so they are safe to
 // interpolate. Unsafe schemes → drop the image entirely.
 html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt, url) => {
 if (!isSafeUrl(url)) return ""; // strip unsafe images completely
 // P2-13 (§12.38 — plan item 13 «صور المدونة: width/height إلزامي
 // (CLS)»): Pexels body images resize at RENDER time via the
 // Phase-139 CDN params (full 1200×627 JPEG → 896px webp) and carry
 // explicit width/height attributes so the browser reserves the 2:1
 // box before load (zero CLS). The URL arrives HTML-ESCAPED (step 3)
 // — unescape entities before URL parsing (else &amp; round-trips into
 // junk %3B params), re-escape for the attribute on the way out.
 // Non-Pexels hosts pass through with the lazy attribute as before —
 // no invented dimensions for unknowns.
 const rawUrl = url.replace(/&amp;/g, "&");
 const sized = sizedRemoteImage(rawUrl, 896, 2);
 if (sized && sized !== rawUrl) {
 const attrSafe = sized.replace(/&/g, "&amp;");
 return `<img src="${attrSafe}" alt="${alt}" width="896" height="448" loading="lazy" class="my-6 w-full h-auto rounded-2xl" />`;
 }
 return `<img src="${url}" alt="${alt}" loading="lazy" class="my-6 w-full rounded-2xl" />`;
 });

 // 11. Links — validate URL scheme to prevent javascript: etc.
 html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
 if (!isSafeUrl(url)) return text; // strip unsafe links to plain text
 return `<a href="${url}" rel="noopener noreferrer" class="text-primary hover:underline">${text}</a>`;
 });

 // 12. Paragraphs
 html = html.replace(/^(?!<[hbluiol])(.+)$/gm, '<p class="my-3 leading-relaxed">$1</p>');

 // 13. Restore code blocks and inline code
 html = html.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)]);
 html = html.replace(/\u0000INLINE(\d+)\u0000/g, (_, i) => inlineCodes[Number(i)]);

 return html;
}
