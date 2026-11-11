"use client";

import { useI18n } from "@/lib/i18n";
import { articleLinksForTool } from "@/lib/tool-article-links";

/**
 * ToolArticleLinks — Report 15 §5-B1 (owner execution order 2026-11-12).
 *
 * The "how to use your result" guide strip on the 8 standalone tool
 * pages: marble cards linking to the PUBLISHED guides that interpret the
 * tool's result (both directions live in src/lib/tool-article-links.ts —
 * the single pair source; article pages render the reverse strip from the
 * same data). Rendered on a client page but with NO state/effects, so the
 * links are in the SSR HTML crawlers see.
 *
 * Placement law: rendered once per tool page, above <OtherTools/>. The
 * pairs arrive pre-filtered by the data module — an unknown toolSlug
 * renders nothing (fail-quiet, never a broken section).
 */
export function ToolArticleLinks({ toolSlug }: { toolSlug: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const pairs = articleLinksForTool(toolSlug);

  if (pairs.length === 0) return null;

  return (
    <section className="mt-12" aria-label={isAr ? "أدلة مقروءة" : "Written guides"}>
      <h3 className="text-lg font-semibold tracking-tight">
        {isAr ? "كيف تستخدم نتيجتك — أدلة مقروءة" : "How to use your result — written guides"}
      </h3>
      <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
        {isAr
          ? "أدلة مفصلة تفسّر رقمك خطوة بخطوة، مأخوذة من مكتبة مقالاتنا المنشورة."
          : "Detailed guides that interpret your number step by step, from the published article library."}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {pairs.map((p) => (
          <a
            key={`${p.toolSlug}-${p.articleSlugEn}`}
            href={isAr ? `/ar/blog/${p.articleSlugAr}` : `/blog/${p.articleSlugEn}`}
            className="marble-card block p-5 transition-opacity hover:opacity-90"
          >
            <p className="text-base font-semibold leading-snug text-[var(--text)]">
              {isAr ? p.anchorAr : p.anchorEn}
            </p>
            <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr ? p.blurbAr : p.blurbEn}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
