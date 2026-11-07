"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getBlogPost, getRelatedPosts, getLinkedPost, parseTableOfContents, renderMarkdown, getCategoryLabel, effectiveCategory, type BlogPost, type BlogPostCard, type BlogFaq } from "@/lib/blog";
import { deferIdle } from "@/lib/defer-idle";
import { stripFaqSectionFromBody, stripTitleHeadingFromBody } from "@/lib/blog-msa";
// PHASE 189 (SEO-GEO-10): clamp the share title through the same SERP
// law as <title> — the zero-dep module keeps the client bundle clean of
// the AI provider chain that blog-pipeline.ts imports.
import { clampMetaTitle } from "@/lib/blog-meta-title";
import { sizedRemoteImage } from "@/lib/remote-image-size";
import { resolveAuthor } from "@/lib/authors";
import { canonicalShareUrl } from "@/lib/share-url";
import { BlogMembershipCard, SocialShare, ReadingProgress, TableOfContents } from "./BlogComponents";
import { AdSenseAd } from "@/components/AdSenseAd";

/** Display polish for FAQ card questions: the pipeline's lifted questions
 *  are raw search queries ("how much protein do i need…") — capitalize the
 *  first letter and the standalone lowercase "i" so cards read like
 *  questions, not query strings. Arabic questions pass through unchanged. */
function displayFaqQuestion(q: string): string {
  return q.replace(/\bi\b/g, "I").replace(/^([a-z])/, (c) => c.toUpperCase());
}

export function BlogArticlePage({
  lang,
  slug,
  initialPost,
  publishedAt,
  updatedAt,
  lastReviewedAt,
  mirrorHref,
}: {
  lang: "en" | "ar";
  slug: string;
  initialPost?: BlogPost | null;
  /** Phase SEO-GEO-4 (2026-09-08): real DB published_at + updated_at from
   *  the server, used for the visible byline + the Article schema. */
  publishedAt?: string;
  updatedAt?: string;
  /** AUDIT_REPORT §9-المرحلة 2, item 1 (0097 — 2026-09-29): the REAL
   *  human-review timestamp (blog_posts.last_reviewed_at). undefined =
   *  null = review pending → the byline shows the honest "AI-generated ·
   *  medical review pending" line and the "Last reviewed" date row is
   *  omitted (the old code passed the auto updated_at as a review date —
   *  audit C2/F2: a fabricated E-E-A-T claim on every article). */
  lastReviewedAt?: string | null;
  /** F-1 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6): server-computed
   *  cross-language mirror URL for the footer bridge link. Blog twins pair
   *  via linked_post_id with LANGUAGE-SPECIFIC slugs, so the footer's
   *  prefix swap cannot derive it — the server route resolves the twin
   *  (fallback: the opposite-language blog list, the LanguageToggle
   *  precedent) and hands it down here so the link is crawlable in the
   *  raw HTML, not only after a client lookup. */
  mirrorHref?: string;
}) {
  const isAr = lang === "ar";
  // M28 fix: accept initialPost as a prop from the server component.
  // If provided, use it immediately (server-rendered content in initial HTML).
  // If not (e.g. fallback), fetch client-side as before.
  const [post, setPost] = useState<BlogPost | null>(initialPost ?? null);
  const [linked, setLinked] = useState<BlogPostCard | null>(null);
  const [related, setRelated] = useState<BlogPostCard[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    if (initialPost) {
      // Already have the post from server — just fetch related + linked
      // PHASE 182: both are BELOW-FOLD sections whose fetch pulls the
      // Supabase client chunk — defer to idle (≤2.5s) so the article's
      // LCP window stays free of that bandwidth.
      deferIdle(() => {
        void (async () => {
          const [rel, lnk] = await Promise.all([
            getRelatedPosts(initialPost),
            getLinkedPost(initialPost),
          ]);
          setRelated(rel);
          setLinked(lnk);
        })();
      }, 2500);
      return;
    }
    // No initial post — fetch client-side (fallback path)
    (async () => {
      setLoading(true);
      const p = await getBlogPost(lang, slug);
      setPost(p);
      if (p) {
        const [rel, lnk] = await Promise.all([
          getRelatedPosts(p),
          getLinkedPost(p),
        ]);
        setRelated(rel);
        setLinked(lnk);
      }
      setLoading(false);
    })();
  }, [lang, slug, initialPost]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0 && scrolled / height >= 0.7) {
        setShowCTA(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)]">
        <p className="text-base font-normal text-[var(--muted-foreground)]">{isAr ? "المقال غير موجود" : "Article not found"}</p>
        <a href={isAr ? "/ar/blog" : "/blog"} className="text-base font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline">
          {isAr ? "العودة للمدونة ›" : "Back to blog ›"}
        </a>
      </div>
    );
  }

  // PHASE 178 — FAQ single-display law: when the post carries faq_json
  // cards, the markdown body's own FAQ section is stripped BEFORE the TOC
  // and body render, so the section appears exactly once (the 2026-09-12
  // live audit: 72/72 published articles rendered identical Q&A twice —
  // legacy bodies kept their FAQ section next to the cards). Pure,
  // deterministic, idempotent (no heading → body unchanged).
  const hasFaqCards = Array.isArray(post.faq_json) && post.faq_json.length > 0;
  // PHASE 187 — single-H1 law (deep-audit P0-1): drop the body's leading
  // `# Title` line when it duplicates the article title (normalized: AR
  // diacritics / hyphen variants / case fold). The template hero below is
  // the page's ONLY <h1>; renderMarkdown additionally demotes any `# `
  // heading to <h2> as the hard backstop — so no body content can ever
  // produce a second H1.
  const faqStripped = hasFaqCards ? stripFaqSectionFromBody(post.content) : post.content;
  const bodyContent = stripTitleHeadingFromBody(faqStripped, post.title);
  const toc = parseTableOfContents(bodyContent);
  const htmlContent = renderMarkdown(bodyContent);
  const baseUrl = "https://alkemos.com";
  // SHARE URL LAW (Phase 230 single source — Phase 231 unification): the
  // article share URL is the deterministic canonical URL built by
  // canonicalShareUrl("/blog/<slug>", lang) — identical output to the
  // retired inline construction, from the SAME source every other surface
  // uses (locale-aware, query/hash-free).
  const articleUrl = canonicalShareUrl(`/blog/${post.slug}`, lang);
  const linkedUrl = linked ? `${baseUrl}${linked.language === "ar" ? "/ar/blog" : "/blog"}/${linked.slug}` : null;

  // PHASE 189: same clamp as the page <title> — legacy stored meta_titles
  // with a trailing " — Alkemos" suffix must not leak into shared text
  // (WhatsApp/Facebook/X prefill) either; within-budget titles pass through
  // unchanged (Law 2), so the 64 clean rows are a no-op.
  const shareTitle = clampMetaTitle(post.meta_title || post.title || "", lang);
  const shareDescription = post.meta_description || post.excerpt || "";

  // Owner follow-up item 3 (2026-09-28): resolve the DB author string to
  // the registry profile (the SAME resolver the Article schema uses) so the
  // byline avatar and the JSON-LD Person.image can never diverge. Undefined
  // avatarUrl falls back to the letter circle below.
  const bylineAvatarUrl = resolveAuthor(post.author).avatarUrl;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]" dir={isAr ? "rtl" : "ltr"}>
      <ReadingProgress />

      {/* M41 fix: use SiteHeader (full nav) instead of minimal header.
          Blog readers can now navigate to exercises, foods, programs, etc.
          without manually editing the URL. */}
      <SiteHeader variant="landing" />

      {/* M42 fix: removed <link rel="alternate"> + <link rel="canonical"> tags
          from the body. These are now handled server-side in generateMetadata
          (blog/[slug]/page.tsx) so they appear in <head>, not <body>. */}

      {/* JSON-LD schemas are injected server-side in /app/(en)/blog/[slug]/page.tsx
          and /app/(ar)/ar/blog/[slug]/page.tsx (Article + Speakable + Breadcrumb,
          plus FAQPage built from faq_json — AUDIT_REPORT §9-0.2, 2026-09-29).
          We deliberately DO NOT duplicate them here — server-rendered JSON-LD
          is visible to crawlers without executing JavaScript, which is the
          correct SEO pattern. */}

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm font-normal text-[var(--muted-foreground)]">
          <a href="/" className="transition-opacity hover:opacity-70">{isAr ? "الرئيسية" : "Home"}</a>
          <span>/</span>
          <a href={isAr ? "/ar/blog" : "/blog"} className="transition-opacity hover:opacity-70">{isAr ? "المدونة" : "Blog"}</a>
          <span>/</span>
          <span className="truncate text-[var(--text)]">{post.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_220px]">
          {/* Article content */}
          <article>
            {/* Hero */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-normal text-[var(--muted-foreground)]">
                {/* P2-11 (§12.36): the article's category is a contextual
                    link into the crawlable category page. */}
                {/* CONTENT-AUDIT P1-8 (2026-09-28, audit §2.4): the chip
                    links the EFFECTIVE category — misfiled stored rows are
                    corrected at render time (see blog-categories.ts). */}
                <a
                  href={`${isAr ? "/ar/blog" : "/blog"}/category/${effectiveCategory(post.slug, post.category)}`}
                  className="rounded-full border border-[var(--edge)] bg-[var(--tint)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-2)] transition-colors hover:border-[var(--chrome-edge)]"
                >
                  {getCategoryLabel(effectiveCategory(post.slug, post.category), lang)}
                </a>
                <span>{post.reading_time} {isAr ? "دقائق قراءة" : "min read"}</span>
                {post.published_at && (
                  <span>
                    {new Date(post.published_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl"
                 data-speakable="headline">
                {post.title}
              </h1>
              <p className="mt-4 text-lg font-normal leading-relaxed text-[var(--muted-foreground)] md:text-xl"
                 data-speakable="summary">
                {post.excerpt}
              </p>
              {/* Phase SEO-GEO-4 (2026-09-08): visible publish date.
                  AUDIT_REPORT §9-المرحلة 2, item 1 (0097 — 2026-09-29):
                  the "Last reviewed" row is now emitted ONLY from the
                  REAL last_reviewed_at (a human actually reviewed the
                  article); before this, the row showed the DB updated_at
                  (an automated timestamp) as a review date on 97/97
                  articles — the audit's C2 fabricated-E-E-A-T finding.
                  When a review is pending, the honest "AI-generated ·
                  medical review pending" byline line below carries the
                  state instead, and updated_at (a content edit, not a
                  review) renders under its own honest "Updated" label. */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                {publishedAt && (
                  <span>
                    {isAr ? "نُشر في" : "Published"}{" "}
                    {new Date(publishedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                )}
                {lastReviewedAt && (
                  <>
                    <span className="text-[var(--muted-foreground)]">•</span>
                    <span>
                      {isAr ? "آخر مراجعة" : "Last reviewed"}{" "}
                      {new Date(lastReviewedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </>
                )}
                {!lastReviewedAt && updatedAt && updatedAt !== publishedAt && (
                  <>
                    <span className="text-[var(--muted-foreground)]">•</span>
                    <span>
                      {isAr ? "آخر تحديث" : "Updated"}{" "}
                      {new Date(updatedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                {/* Phase SEO-GEO-2 (2026-09-08): author byline now links to
                    the Ahmed Zake author profile page. E-E-A-T signal: human
                    name + job title + link to credentials = strongest trust
                    signal possible. The `Reviewed by Ahmed Zake` second line
                    matches the reviewedBy Person in the Article schema. */}
                {/* Owner follow-up item 3 (2026-09-28): the byline circle now
                    shows the founder's REAL photo — the registry avatarUrl
                    (square face crop of the site's studio portrait), resolved
                    from the DB author string by the same resolver the Article
                    schema uses, so byline + JSON-LD Person.image always match.
                    The letter circle stays as the graceful fallback for any
                    future author without an avatar. */}
                <Link
                  href={isAr ? "/ar/authors/ahmed-zake" : "/authors/ahmed-zake"}
                  className="group flex items-center gap-3"
                >
                  {bylineAvatarUrl ? (
                    <span className="relative block h-10 w-10 overflow-hidden rounded-full border border-[var(--edge)] bg-[var(--tint)] transition-opacity group-hover:opacity-80">
                      <Image
                        src={bylineAvatarUrl}
                        alt={post.author}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)] text-sm font-semibold text-[var(--text)] transition-opacity group-hover:opacity-80">
                      {post.author.charAt(0)}
                    </span>
                  )}
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--text)] group-hover:underline">
                      {post.author}
                    </span>
                    <span className="text-xs font-normal text-[var(--muted-foreground)]">
                      {/* AUDIT_REPORT §9-المرحلة 2, item 1 (0097 — 2026-09-29):
                          the "Reviewed by Ahmed Zake" line was previously
                          printed on EVERY article while P5 publishes with
                          ZERO human review (audit C2/F2 — a fabricated
                          E-E-A-T signal on YMYL health content). It now
                          appears ONLY after the owner actually reviewed the
                          article (review_status='reviewed'); the pending
                          state gets the audit's honest minimum wording:
                          «AI-generated · medical review pending». The
                          Article schema follows the same law (reviewedBy/
                          lastReviewed omitted until a real review exists). */}
                      {lastReviewedAt
                        ? isAr
                          ? "المؤسس والمدرب الرئيسي · راجعه Ahmed Zake"
                          : "Founder & Head Coach · Reviewed by Ahmed Zake"
                        : isAr
                          ? "المؤسس والمدرب الرئيسي · مولّد بالذكاء الاصطناعي · بانتظار المراجعة الطبية"
                          : "Founder & Head Coach · AI-generated · medical review pending"}
                    </span>
                  </span>
                </Link>
                {/* AUDIT_REPORT §9-0.1 (2026-09-29): the false sources-
                    citation byline (EN + AR strings, after the author
                    block) was REMOVED — audit F2 measured it on 97/97
                    pages while FACT GUARD forbids naming any source and
                    62/97 articles carry zero external links (an E-E-A-T
                    risk on YMYL health content). Honest citations
                    policy = Phase 2 of the audit plan. */}
              </div>
            </div>

            {/* Featured image — next/image (site image system) converts
                the Pexels CDN photo to lightweight responsive WebP at the
                edge (IMAGE SOURCE LAW v3: «حجم خفيف بنظام الموقع»). */}
            {post.featured_image && (
              <div className="relative mb-10 aspect-[2/1] overflow-hidden rounded-3xl">
                {/* PHASE 139: render-time Pexels resize (w=1080 webp, 2:1
                    crop) — the hero renders at ≤896 CSS px (mobile full
                    width × DPR ≈ 1080 device px); it used to download the
                    full 1200×627 JPEG. */}
                <Image
                  src={sizedRemoteImage(post.featured_image, 1080, 2) || post.featured_image}
                  alt={post.cover_alt || post.title}
                  fill
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Content — Apple-style typography */}
            {/* PHASE 173 (owner directive — links inside article content must
                be instantly discoverable): in-content links render in the
                Alkemos brand blue (#0071e3 = --primary, the documented
                link/CTA color) WITH a underline for accessible visual
                distinction. The arbitrary [&_a] variants previously forced
                muted-gray no-underline links (specificity .class a beats the
                renderer's .text-primary), which made in-content links
                visually indistinguishable from plain text. Hover deepens the
                decoration from 40% opacity to solid + keeps the brand color.
                URL/link LOGIC untouched — styling only. */}
            <div
              className="prose prose-sm max-w-none text-[var(--text)] [&_a]:font-medium [&_a]:text-[#0071e3] [&_a]:underline [&_a]:decoration-[#0071e3]/40 [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a]:transition-colors [&_a]:hover:text-[#0071e3] [&_a]:hover:decoration-[#0071e3] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_p]:my-5 [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-[var(--muted-2)] [&_p]:md:text-lg [&_p]:md:leading-relaxed [&_blockquote]:border-s-4 [&_blockquote]:border-[var(--chrome-edge)] [&_blockquote]:ps-5 [&_blockquote]:py-2 [&_blockquote]:my-6 [&_blockquote]:text-lg [&_blockquote]:font-normal [&_blockquote]:text-[var(--text)] [&_blockquote]:italic [&_code]:rounded [&_code]:bg-[var(--tint)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_pre]:my-6 [&_pre]:rounded-2xl [&_pre]:bg-black [&_pre]:p-5 [&_pre]:text-sm [&_pre]:text-white [&_pre]:overflow-x-auto [&_table]:my-6 [&_table]:w-full [&_td]:border [&_td]:border-[var(--edge)] [&_td]:p-3 [&_th]:border [&_th]:border-[var(--edge)] [&_th]:p-3 [&_th]:bg-[var(--tint)] [&_th]:text-start [&_th]:font-semibold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-2 [&_li]:text-base [&_li]:md:text-lg [&_li]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* AdSense — after article content */}
            <AdSenseAd format="auto" />

            {/* AUDIT_REPORT §9-0.1 (2026-09-29): the visible keyword-chips
                block (`#tag` spans rendering raw LSI keywords) was REMOVED
                from the template — audit F7 measured raw long-tail keywords
                stuffed as visible chips on 97/97 articles (reader-visible
                keyword stuffing). tags stay in the DB/type; they are simply
                no longer rendered on the article page. */}

            {/* Social share */}
            <SocialShare path={`/blog/${post.slug}`} title={shareTitle} description={shareDescription} lang={lang} />

            {/* Language alternate link */}
            {linkedUrl && linked && (
              <div className="marble-card my-8 p-6 text-center">
                <p className="text-sm font-normal text-[var(--muted-foreground)]">
                  {isAr ? "هذا المقال متاح أيضًا بالإنجليزية:" : "This article is also available in Arabic:"}
                </p>
                <a href={linkedUrl} className="btn-outline mt-2 inline-block px-6 py-2.5 text-sm">
                  {linked.title} ›
                </a>
              </div>
            )}

            {/* FAQ Section */}
            {post.faq_json && Array.isArray(post.faq_json) && post.faq_json.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
                </h2>
                <div className="mt-8 space-y-4">
                  {post.faq_json.map((faq: BlogFaq, i: number) => (
                    <div key={i} className="marble-card p-6">
                      <h3 className="text-base font-semibold tracking-tight">{displayFaqQuestion(faq.question)}</h3>
                      <p className="mt-2 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Membership card (replaces old BlogCTA + NewsletterBlock) */}
            {showCTA && <BlogMembershipCard lang={lang} />}

            {/* Related posts */}
            {related.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {isAr ? "مقالات ذات صلة" : "Related Articles"}
                </h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((rel) => (
                    <a
                      key={rel.id}
                      href={isAr ? `/ar/blog/${rel.slug}` : `/blog/${rel.slug}`}
                      className="marble-card group block overflow-hidden transition-opacity hover:opacity-90"
                    >
                      {rel.featured_image && (
                        <div className="relative aspect-video overflow-hidden">
                          {/* PHASE 139: render-time Pexels resize (w=600
                              webp) for the small related cards. */}
                          <Image
                            src={sizedRemoteImage(rel.featured_image, 600, 16 / 9) || rel.featured_image}
                            alt={rel.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <span className="text-xs font-normal text-[var(--muted-foreground)]">
                          {getCategoryLabel(effectiveCategory(rel.slug, rel.category), lang)}
                        </span>
                        <h3 className="mt-2 text-base font-semibold leading-tight tracking-tight">{rel.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm font-normal text-[var(--muted-foreground)]">{rel.excerpt}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar: Table of Contents */}
          <aside className="hidden lg:block">
            <TableOfContents items={toc} lang={lang} />
          </aside>
        </div>
      </main>

      {/* Access-point fix (2026-09-14): slim copyright line replaced by the
          SHARED marble footer — this public page now carries the same
          persistent link grid as the homepage (SiteFooter component).
          F-1 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07): mirrorHref hands
          the server-resolved language twin down to the footer's
          cross-language bridge link (see the props doc above). */}
      <SiteFooter mirrorHref={mirrorHref} />
    </div>
  );
}

