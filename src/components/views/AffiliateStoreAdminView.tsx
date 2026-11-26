"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, EyeOff, RefreshCw, Star, UploadCloud } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, SectionCard, SegmentedTabs, StatTile, EmptyState } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * STORE ADMIN VIEW (PHASE 527 — owner order 2026-11-27).
 * The dashboard behind /admin/affiliate-store under the AUTO-PUBLISH
 * law (527-L2): the 0097 dual-approval pipeline (pending → owner
 * review → publish) is RETIRED — a product saves and is LIVE
 * immediately (the store guards: real image + valid ASIN + clean
 * content are the only gate, enforced server-side on every save).
 *
 * WHAT THE ADMIN SEES:
 *   - Stats: total / live / hidden / featured / blocked-from-save
 *     (products whose last save was refused by the guards — they keep
 *     their previous state; the editor surfaces the findings).
 *   - The product list with thumbnails: every row shows the product's
 *     real image, its category, its ASIN, and its live URL.
 *   - Per-row actions: Unpublish (hide) / Republish · Feature toggle ·
 *     Edit (the editor's save keeps a published product live — «أي
 *     تعديل وحفظ لمنتج منشور ينعكس تلقائيًا»).
 *   - The category tree with activation toggles (waves 2/3 = inactive
 *     by law until the owner's go-live order).
 */

type GuardFinding = { rule: string; severity: "block" | "warn"; message: string };

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  asin: string | null;
  image_url: string | null;
  review_status: string;
  is_published: boolean;
  is_featured: boolean;
  updated_at: string;
  category: { id: string; slug: string; name: string; is_active: boolean } | null;
};

type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  productCount: number;
  children: CategoryNode[];
};

type Stats = {
  total: number;
  published: number;
  pending: number;
  reviewed: number;
  featured: number;
  withoutAsin: number;
  categoriesActive: number;
  categoriesInactive: number;
};

type State = {
  stats: Stats;
  products: ProductRow[];
  categories: CategoryNode[];
  clicks: Array<{ day: string; clicks: number }>;
};

const TABS: Array<{ key: string; ar: string; en: string }> = [
  { key: "all", ar: "كل المنتجات", en: "All products" },
  { key: "live", ar: "المنشورة", en: "Live" },
  { key: "hidden", ar: "المخفية", en: "Hidden" },
  { key: "categories", ar: "الفئات والموجات", en: "Categories & waves" },
];

export function AffiliateStoreAdminView() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliate-store", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState((await res.json()) as State);
    } catch {
      toast.error(isAr ? "تعذر تحميل بيانات المتجر" : "Failed to load store data");
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (action: string, id: string, extra: Record<string, unknown> = {}) => {
      setBusy(`${action}:${id}`);
      try {
        const res = await fetch("/api/admin/affiliate-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, id, ...extra }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          findings?: GuardFinding[];
        };
        if (!res.ok) {
          const findings = (body.findings ?? [])
            .map((f) => (f.severity === "block" ? "⛔" : "⚠") + " " + f.message)
            .join("\n");
          toast.error(body.error ?? "Action failed", { description: findings || undefined });
        } else {
          toast.success(
            action === "unpublish"
              ? isAr
                ? "تم إخفاء المنتج من المتجر"
                : "Hidden from the store"
              : action === "publish"
                ? isAr
                  ? "تم النشر وتحديث أسطح المتجر"
                  : "Published & store surfaces refreshed"
                : isAr
                  ? "تم التنفيذ"
                  : "Done",
          );
          await load();
        }
      } catch {
        toast.error(isAr ? "فشل الاتصال" : "Request failed");
      } finally {
        setBusy(null);
      }
    },
    [isAr, load],
  );

  const visible = useMemo(() => {
    const products = state?.products ?? [];
    if (tab === "live") return products.filter((p) => p.is_published);
    if (tab === "hidden") return products.filter((p) => !p.is_published);
    return products;
  }, [tab, state]);

  const blockedFromSave = useMemo(
    () => (state?.products ?? []).filter((p) => !p.image_url || !p.asin),
    [state],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title={isAr ? "متجر منتجات الأفلييت — Alkemos Affiliate Store" : "Alkemos Affiliate Store"}
        sub={
          isAr
            ? "قانون 527: الحفظ = نشر فوري · بوابة آلية (صورة + ASIN + محتوى نظيف) · الإخفاء بضغطة · المتجر إنجليزي · النسب الداخلية لا تُعرض للزوار"
            : "Law 527: save = publish instantly · automated gate (image + ASIN + clean content) · one-click hide · EN store · internal-only rates"
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" /> {isAr ? "تحديث" : "Refresh"}
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/affiliate-store/new">
                {isAr ? "+ منتج جديد" : "+ New product"}
              </Link>
            </Button>
          </div>
        }
      />

      {state ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label={isAr ? "إجمالي" : "Total"} value={state.stats.total} />
          <StatTile label={isAr ? "منشورة" : "Live"} value={state.stats.published} />
          <StatTile label={isAr ? "مختارة" : "Featured"} value={state.stats.featured} />
          <StatTile label={isAr ? "بلا صورة/ASIN" : "Missing image/ASIN"} value={blockedFromSave.length} />
        </div>
      ) : (
        <EmptyState text={isAr ? "جارٍ التحميل…" : "Loading…"} />
      )}

      {blockedFromSave.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed">
          {isAr
            ? `تنبيه 527-G2: ${blockedFromSave.length} منتجًا ينقصه صورة حقيقية أو ASIN — هذه المنتجات لا تظهر في واجهات المتجر العامة حتى استكمال بياناتها وحفظها (افتح المنتج وأضف الصورة وASIN ثم احفظ).`
            : `527-G2 notice: ${blockedFromSave.length} product(s) lack a real image or ASIN — they stay OFF all public store surfaces until completed (open the product, add the image + ASIN, save).`}
        </div>
      )}

      <div className="mt-6">
        <SegmentedTabs
          tabs={TABS.map((t) => ({
            key: t.key,
            label: isAr ? t.ar : t.en,
            count:
              t.key === "all"
                ? state?.stats.total
                : t.key === "live"
                  ? state?.stats.published
                  : t.key === "hidden"
                    ? (state?.stats.total ?? 0) - (state?.stats.published ?? 0)
                    : undefined,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab !== "categories" ? (
        <SectionCard
          title={
            tab === "live"
              ? isAr
                ? "المنتجات المنشورة (ظاهرة للزوار)"
                : "Live products (visitor-visible)"
              : tab === "hidden"
                ? isAr
                  ? "المنتجات المخفية"
                  : "Hidden products"
                : isAr
                  ? "كل المنتجات"
                  : "All products"
          }
        >
          {visible.length === 0 ? (
            <EmptyState
              text={
                tab === "hidden"
                  ? isAr
                    ? "لا منتجات مخفية"
                    : "Nothing hidden"
                  : isAr
                    ? "لا منتجات بعد — أنشئ أول منتج وسينشر تلقائيًا"
                    : "No products yet — create one and it publishes automatically"
              }
            />
          ) : (
            <ul className="divide-y">
              {visible.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  {/* 527: the real product image in the admin list too */}
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external product image
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="size-12 shrink-0 rounded-md border border-[var(--edge)] object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--edge)] text-[10px] text-muted-foreground">
                      {isAr ? "بلا صورة" : "no image"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/affiliate-store/${p.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={p.is_published ? "default" : "secondary"}>
                        {p.is_published
                          ? isAr
                            ? "منشور"
                            : "live"
                          : isAr
                            ? "مخفي"
                            : "hidden"}
                      </Badge>
                      {p.category && <span>{p.category.name}</span>}
                      <span className="font-mono">{p.asin ?? "—"}</span>
                      {p.is_featured && (
                        <Star className="size-3 fill-current text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.is_published ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === `unpublish:${p.id}`}
                        onClick={() => void act("unpublish", p.id)}
                      >
                        <EyeOff className="size-4" />
                        {isAr ? "إخفاء" : "Unpublish"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy === `publish:${p.id}`}
                        onClick={() => void act("publish", p.id)}
                      >
                        <UploadCloud className="size-4" />
                        {isAr ? "إعادة النشر" : "Publish"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === `feature:${p.id}`}
                      onClick={() => void act("feature", p.id, { featured: !p.is_featured })}
                      title={isAr ? "تبديل المختارات" : "Toggle featured"}
                    >
                      <Star
                        className={cn(
                          "size-4",
                          p.is_featured && "fill-current text-amber-500",
                        )}
                      />
                    </Button>
                    {p.is_published && p.category && (
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/affiliate-store/${p.category.slug}/${p.slug}`}
                          target="_blank"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : (
        <SectionCard
          title={isAr ? "شجرة الفئات (12 رئيسية × فروع · 3 موجات)" : "Category tree (12 mains × subs · 3 waves)"}
        >
          <ul className="space-y-4">
            {(state?.categories ?? []).map((main) => (
              <li key={main.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{main.name}</span>
                  <Badge variant={main.is_active ? "default" : "secondary"}>
                    {main.is_active
                      ? isAr
                        ? "نشطة"
                        : "active"
                      : isAr
                        ? "معطلة (بانتظار أمر التفعيل)"
                        : "inactive (awaiting activation order)"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === `category-activate:${main.id}`}
                    onClick={() =>
                      void act("category-activate", main.id, { active: !main.is_active })
                    }
                  >
                    {main.is_active
                      ? isAr
                        ? "تعطيل"
                        : "Deactivate"
                      : isAr
                        ? "تفعيل"
                        : "Activate"}
                  </Button>
                </div>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 ps-4 text-xs text-muted-foreground">
                  {main.children.map((sub) => (
                    <li key={sub.id}>
                      {sub.name}{" "}
                      <span className="font-mono">({sub.productCount})</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            {isAr
              ? "موجات 2/3 (المكملات والأغذية ثم الكتب والتحمل) تبقى معطلة حتى أمر تفعيلك؛ منتجاتها تُغربل بإطار الغربلة قبل أي إدخال."
              : "Waves 2/3 (supplements & foods, then books & endurance) stay inactive until your activation order; their products pass the screening framework before any entry."}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
