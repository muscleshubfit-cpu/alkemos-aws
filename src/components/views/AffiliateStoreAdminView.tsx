"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, ExternalLink, RefreshCw, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, SectionCard, SegmentedTabs, StatTile, EmptyState } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * STORE ADMIN VIEW (ALKEMOS-STORE-PHASE1 §1.2 — owner order 2026-11-26).
 * The dashboard behind /admin/affiliate-store: the honest 0097 pipeline
 * (pending → owner review → publish), the product list, and the
 * category tree (wave 1 active / waves 2–3 awaiting the owner's
 * activation orders).
 *
 * WHAT THE ADMIN SEES (persisted facts only):
 *   - Stats: total / published / pending review / reviewed / featured /
 *     products without ASIN (no buy button until captured) / category waves.
 *   - The pending-review queue FIRST (the owner's real inbox).
 *   - Products with per-row actions: review ✓ → publish (requires
 *     reviewed + all store guards green) → unpublish / feature.
 *   - The category tree with activation toggles (waves 2/3 = inactive
 *     by law until the owner's go-live order).
 *
 * WHAT THE ADMIN CAN DO: the narrow action set of /api/admin/affiliate-store —
 * review, publish, unpublish, feature, category-activate. Creation and
 * editing live in the AffiliateStoreEditorView (/admin/affiliate-store/new, /admin/affiliate-store/[id]).
 */

type GuardFinding = { rule: string; severity: "block" | "warn"; message: string };

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  asin: string | null;
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
  { key: "pending", ar: "بانتظار مراجعتك", en: "Pending your review" },
  { key: "all", ar: "كل المنتجات", en: "All products" },
  { key: "categories", ar: "الفئات والموجات", en: "Categories & waves" },
];

export function AffiliateStoreAdminView() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState("pending");
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
            action === "review"
              ? isAr
                ? "تمت المراجعة — يمكنك النشر الآن"
                : "Reviewed — you can publish now"
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

  const pending = useMemo(
    () => (state?.products ?? []).filter((p) => p.review_status === "pending"),
    [state],
  );
  const visible = useMemo(() => {
    if (tab === "pending") return pending;
    return state?.products ?? [];
  }, [tab, pending, state]);

  const flatCategories = useMemo(() => {
    const out: CategoryNode[] = [];
    for (const main of state?.categories ?? []) {
      out.push(main);
      out.push(...main.children);
    }
    return out;
  }, [state]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title={isAr ? "متجر منتجات الأفلييت — Alkemos Affiliate Store" : "Alkemos Affiliate Store"}
        sub={
          isAr
            ? "سير 0097: مراجعة المالك قبل أي نشر · المتجر إنجليزي · النسب الداخلية لا تُعرض للزوار"
            : "The 0097 flow: your review gates every publish · EN store · internal-only rates"
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
          <StatTile label={isAr ? "منشور" : "Published"} value={state.stats.published} />
          <StatTile label={isAr ? "بانتظار المراجعة" : "Pending review"} value={state.stats.pending} />
          <StatTile label={isAr ? "بلا ASIN" : "No ASIN yet"} value={state.stats.withoutAsin} />
        </div>
      ) : (
        <EmptyState text={isAr ? "جارٍ التحميل…" : "Loading…"} />
      )}

      <div className="mt-6">
        <SegmentedTabs
          tabs={TABS.map((t) => ({
            key: t.key,
            label: isAr ? t.ar : t.en,
            count: t.key === "pending" ? pending.length : t.key === "all" ? state?.stats.total : undefined,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab !== "categories" ? (
        <SectionCard
          title={
            tab === "pending"
              ? isAr
                ? "صندوق مراجعتك (نمط 0097)"
                : "Your review inbox (the 0097 flow)"
              : isAr
                ? "كل المنتجات"
                : "All products"
          }
        >
          {visible.length === 0 ? (
            <EmptyState
              text={
                tab === "pending"
                  ? isAr
                    ? "لا منتجات بانتظار المراجعة — الدفعة التأسيسية تُزرع بميجريشن 0116"
                    : "Nothing pending — the founding batch is seeded by migration 0116"
                  : isAr
                    ? "لا منتجات"
                    : "No products"
              }
            />
          ) : (
            <ul className="divide-y">
              {visible.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2 py-3">
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
                            : "published"
                          : isAr
                            ? "غير منشور"
                            : "draft"}
                      </Badge>
                      <Badge variant={p.review_status === "reviewed" ? "default" : "outline"}>
                        {p.review_status === "reviewed"
                          ? isAr
                            ? "تمت المراجعة"
                            : "reviewed"
                          : isAr
                            ? "بانتظار المراجعة"
                            : "pending review"}
                      </Badge>
                      {p.category && <span>{p.category.name}</span>}
                      <span className="font-mono">{p.asin ?? "—"}</span>
                      {p.is_featured && (
                        <Star className="size-3 fill-current text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.review_status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === `review:${p.id}`}
                        onClick={() => void act("review", p.id)}
                      >
                        <CheckCircle2 className="size-4" />
                        {isAr ? "اعتماد المراجعة" : "Mark reviewed"}
                      </Button>
                    )}
                    {p.review_status === "reviewed" && !p.is_published && (
                      <Button
                        size="sm"
                        disabled={busy === `publish:${p.id}`}
                        onClick={() => void act("publish", p.id)}
                      >
                        <ExternalLink className="size-4" />
                        {isAr ? "نشر" : "Publish"}
                      </Button>
                    )}
                    {p.is_published && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === `unpublish:${p.id}`}
                        onClick={() => void act("unpublish", p.id)}
                      >
                        <EyeOff className="size-4" />
                        {isAr ? "إلغاء النشر" : "Unpublish"}
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
                          <Eye className="size-4" />
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
                        ? "نشطة (موجة 1)"
                        : "active (wave 1)"
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
