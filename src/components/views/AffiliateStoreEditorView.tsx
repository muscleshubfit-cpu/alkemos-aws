"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Image as ImageIcon, Save, ShieldCheck, Unplug } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, SectionCard, EmptyState } from "@/components/admin/ui";
import { AffiliateStoreProductImage } from "@/components/affiliate-store/AffiliateStoreProductImage";
import { OaDisclosureLine } from "@/components/affiliate-store/disclosure";
import { AFFILIATE_STORE_BUY_CTA_LABEL } from "@/lib/affiliate-store-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  checkAffiliateStoreImageUrlShape,
  runAffiliateStoreProductGuards,
  type AffiliateStoreGuardFinding,
} from "@/lib/affiliate-store-guards";
import { isValidAsin } from "@/lib/affiliate-store-link";

/**
 * STORE EDITOR VIEW (ALKEMOS-STORE-PHASE1 §1.2 — owner order 2026-11-26).
 * The English-product editor behind /admin/affiliate-store/new and /admin/affiliate-store/[id]
 * (the blog-editor pattern, store-shaped):
 *
 *   - CONTENT FIELDS ARE ENGLISH ONLY (store law §0 — the interface is
 *     operator-language but the fields feed an EN-only store).
 *   - LIVE VISUAL PREVIEW (VISIBILITY-PREVIEW 2026-11-26 — owner order
 *     «معاينة مرئية حقيقية للمنتج أثناء الإضافة والتحرير»): the sticky
 *     panel mirrors the PUBLIC surfaces — the rail card + the product
 *     page header (image or carved icon · title · brand · summary ·
 *     editorial score · featured badge · leaf category · the buy-unit
 *     state · the honest no-price law) and re-renders on EVERY keystroke
 *     (it derives from the same form state — no separate sync).
 *   - OPEN PUBLIC PAGE: the button opens /affiliate-store/{leaf}/{slug}
 *     in a new tab (404 while pending — the page goes live at publish,
 *     the 0097 law; the preview above is the honest pre-publish mirror).
 *   - DIRECT-IMAGE VALIDATION (owner order «التأكد من أنه رابط صورة مباشر
 *     وليس رابط صفحة عادية»): the shape guard (page/doc extensions
 *     BLOCK, extension-less WARN) + the "Verify image" probe
 *     (HEAD → content-type image/* — a 200 text/html answer is a PAGE).
 *   - LIVE GUARD FEEDBACK: every keystroke re-runs the store guards
 *     (image law v2 §0 · halal blocklist · claims · commission rates ·
 *     ASIN shape · stored-tagged links) — blocking findings refuse the
 *     save server-side too (the same module runs there).
 *   - STORELINKVERIFY: one button → GET /api/admin/affiliate-store/verify?asin=…
 *     (server-side HEAD probe, honest unverified≠dead).
 *   - THE SCREENING CHECKLIST shows for supplements/food categories
 *     (wave 2) — SUPPLEMENTS-FOOD-SCREENING-EN.md §4 as an editor-side
 *     review list; the gates stay (owner review, never bypassed).
 *   - 0097: save keeps the product pending; review → publish happen on
 *     the dashboard (no publish bypass from the editor).
 */

type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  icon_key: string | null;
  productCount: number;
  children: CategoryNode[];
};

type ProductRow = {
  id: string;
  category_id: string;
  asin: string | null;
  slug: string;
  title: string;
  summary: string;
  content: string;
  brand: string | null;
  image_url: string | null;
  editorial_rating: number | null;
  is_featured: boolean;
  review_status: string;
  is_published: boolean;
};

type LinkRow = { surface_type: string; surface_key: string };

type FormState = {
  category_id: string;
  asin: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  brand: string;
  image_url: string;
  image_alt: string;
  editorial_rating: string;
  is_featured: boolean;
  links: LinkRow[];
};

const EMPTY_FORM: FormState = {
  category_id: "",
  asin: "",
  slug: "",
  title: "",
  summary: "",
  content: "",
  brand: "",
  image_url: "",
  image_alt: "",
  editorial_rating: "",
  is_featured: false,
  links: [],
};

const SURFACE_TYPES = [
  { key: "tool", label: "Tool (EN)" },
  { key: "equipment_hub", label: "Equipment hub (EN)" },
  { key: "program", label: "Program (EN)" },
  { key: "blog", label: "Blog article (EN)" },
  { key: "collection", label: "Collection (EN)" },
];

/** Wave-2 screening checklist (SUPPLEMENTS-FOOD-SCREENING-EN.md §4). */
const SCREENING_STEPS: Array<{ ar: string; en: string }> = [
  {
    ar: "١) لوحة المكونات الكاملة: كلمات المنع (خنزير/كحول) + أعلام المصدر الحيواني المجهول",
    en: "1) Full ingredient panel: blocklist words (pork/alcohol) + unknown-origin animal flags",
  },
  {
    ar: "٢) تصنيف أمازون للـASIN + سياسة المكملات بالبائع (المنتج حي وأهل للعرض)",
    en: "2) Amazon classification of the ASIN + seller supplement policy (product live and eligible)",
  },
  {
    ar: "٣) انضباط الادعاءات: بنية/وظيفة منسوبة للمصنّع فقط — لا ادعاءات مرض ولا شعار FDA",
    en: "3) Claims discipline: manufacturer-attributed structure/function only — no disease claims, no FDA marks",
  },
  {
    ar: "٤) قرار الحالات الحدية للمالك (جيلاتين/كحول بالمكونات…) قبل أي نشر",
    en: "4) Owner decision on borderline cases (gelatin/alcohol in ingredients…) before any publish",
  },
];

export function AffiliateStoreEditorView({ mode, productId }: { mode: "new" | "edit"; productId?: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [saving, setSaving] = useState(false);
  const [verify, setVerify] = useState<{ status: string; message: string; url: string | null } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [imageVerify, setImageVerify] = useState<{
    status: string;
    message: string;
    contentType: string | null;
  } | null>(null);
  const [verifyingImage, setVerifyingImage] = useState(false);
  const router = useRouter();
  const [loaded, setLoaded] = useState(mode === "new");

  useEffect(() => {
    const url = mode === "edit" && productId ? `/api/admin/affiliate-store/products?id=${productId}` : "/api/admin/affiliate-store/products";
    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { product: ProductRow | null; links: LinkRow[]; categories: CategoryNode[] }) => {
        setCategories(data.categories ?? []);
        if (data.product) {
          setForm({
            category_id: data.product.category_id,
            asin: data.product.asin ?? "",
            slug: data.product.slug,
            title: data.product.title,
            summary: data.product.summary,
            content: data.product.content,
            brand: data.product.brand ?? "",
            image_url: data.product.image_url ?? "",
            image_alt: "",
            editorial_rating:
              data.product.editorial_rating !== null && data.product.editorial_rating !== undefined
                ? String(data.product.editorial_rating)
                : "",
            is_featured: data.product.is_featured,
            links: (data.links ?? []).map((l) => ({
              surface_type: l.surface_type,
              surface_key: l.surface_key,
            })),
          });
        }
        setLoaded(true);
      })
      .catch(() => toast.error(isAr ? "تعذر تحميل بيانات المنتج" : "Failed to load product"));
  }, [mode, productId, isAr]);

  const leafGroups = useMemo(() => {
    // Leaf categories grouped by main (the product URL uses the leaf slug).
    return categories.map((main) => ({
      mainId: main.id,
      mainName: main.name,
      mainSlug: main.slug,
      leaves: main.children,
    }));
  }, [categories]);

  const selectedMain = useMemo(
    () => leafGroups.find((g) => g.leaves.some((l) => l.id === form.category_id))?.mainSlug,
    [leafGroups, form.category_id],
  );
  const isScreeningCategory =
    selectedMain === "sports-supplements-vitamins" || selectedMain === "healthy-foods-sports-snacks";

  /* ── LIVE PREVIEW derivations (VISIBILITY-PREVIEW 2026-11-26) ──
   * Everything the public surfaces will render, derived from the SAME
   * form state — updates on every keystroke, zero separate sync. */
  const selectedGroup = useMemo(
    () => leafGroups.find((g) => g.leaves.some((l) => l.id === form.category_id)),
    [leafGroups, form.category_id],
  );
  const selectedLeaf = useMemo(
    () => selectedGroup?.leaves.find((l) => l.id === form.category_id) ?? null,
    [selectedGroup, form.category_id],
  );
  const publicUrl =
    selectedLeaf && form.slug ? `/affiliate-store/${selectedLeaf.slug}/${form.slug}` : null;
  const imageShape = useMemo(() => checkAffiliateStoreImageUrlShape(form.image_url), [form.image_url]);

  const findings: AffiliateStoreGuardFinding[] = useMemo(
    () =>
      runAffiliateStoreProductGuards({
        asin: form.asin || null,
        title: form.title || null,
        summary: form.summary || null,
        content: form.content || null,
        image_url: form.image_url || null,
        image_alt: form.image_alt || null,
        price_usd: null,
      }),
    [form],
  );
  const blocking = findings.filter((f) => f.severity === "block");
  const warnings = findings.filter((f) => f.severity === "warn");

  const save = useCallback(async () => {
    if (!form.category_id) {
      toast.error(isAr ? "اختر فئة فرعية" : "Pick a (leaf) category");
      return;
    }
    if (blocking.length > 0) {
      toast.error(
        isAr ? "الحرّاس يرفضون الحفظ — صحّح البنود الحاجبة" : "Guards refuse the save — fix the blocking findings",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/affiliate-store/products", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mode === "edit" ? productId : undefined,
          category_id: form.category_id,
          asin: form.asin.trim() || null,
          slug: form.slug.trim(),
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          brand: form.brand.trim() || null,
          image_url: form.image_url.trim() || null,
          image_alt: form.image_alt.trim() || null,
          editorial_rating: form.editorial_rating.trim() === "" ? null : Number(form.editorial_rating),
          is_featured: form.is_featured,
          links: form.links.filter((l) => l.surface_key.trim()),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Save failed");
      } else {
        toast.success(
          mode === "new"
            ? isAr
              ? "حُفظ بانتظار مراجعتك (سير 0097) — راجعه ثم انشره من اللوحة"
              : "Saved pending your review (0097) — review then publish from the dashboard"
            : isAr
              ? "حُفظ التعديل"
              : "Saved",
        );
        if (mode === "new" && body.id) {
          router.push(`/admin/affiliate-store/${body.id}`);
        }
      }
    } catch {
      toast.error(isAr ? "فشل الاتصال" : "Request failed");
    } finally {
      setSaving(false);
    }
  }, [form, blocking, isAr, mode, productId]);

  const runVerify = useCallback(async () => {
    setVerifying(true);
    setVerify(null);
    try {
      const res = await fetch(`/api/admin/affiliate-store/verify?asin=${encodeURIComponent(form.asin.trim())}`);
      const body = (await res.json()) as { status: string; message: string; url: string | null };
      setVerify(body);
    } catch {
      setVerify({ status: "error", message: isAr ? "فشل التحقق" : "Verify request failed", url: null });
    } finally {
      setVerifying(false);
    }
  }, [form.asin, isAr]);

  const runImageVerify = useCallback(async () => {
    setVerifyingImage(true);
    setImageVerify(null);
    try {
      const res = await fetch(
        `/api/admin/affiliate-store/verify?image=${encodeURIComponent(form.image_url.trim())}`,
      );
      const body = (await res.json()) as { status: string; message: string; contentType: string | null };
      setImageVerify(body);
    } catch {
      setImageVerify({
        status: "error",
        message: isAr ? "فشل التحقق من الصورة" : "Image verify request failed",
        contentType: null,
      });
    } finally {
      setVerifyingImage(false);
    }
  }, [form.image_url, isAr]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!loaded) return <EmptyState text={isAr ? "جارٍ التحميل…" : "Loading…"} />;

  /* ── THE LIVE PREVIEW PANEL (VISIBILITY-PREVIEW 2026-11-26) ──
   * Mirrors the PUBLIC surfaces from the current form state: the rail
   * card + the product page header, honest about the no-price law
   * (§3.4-6 — prices only from the Phase-4 Amazon API) and the buy
   * unit (built from ASIN + env tag at render; no ASIN → no unit). */
  const previewPanel = (
    <aside
      data-affiliate-store-preview=""
      className="order-first space-y-4 xl:sticky xl:top-6 xl:order-none"
      aria-label={isAr ? "معاينة حية للمنتج" : "Live product preview"}
    >
      <div className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4">
        <h3 className="text-sm font-semibold tracking-tight">
          {isAr ? "المعاينة الحية" : "Live preview"}
          <span className="ms-2 text-xs font-normal text-muted-foreground">
            {isAr ? "تتحدث مع كل ضغطة مفتاح" : "updates on every keystroke"}
          </span>
        </h3>

        {/* 1) The RAIL CARD replica (homepage rail · store grid · related) */}
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          {isAr ? "البطاقة (السكة/الشبكة)" : "Rail / grid card"}
        </p>
        <div className="mt-1 flex gap-3 rounded-xl border border-[var(--edge)] bg-[var(--bg)] p-3">
          <span className="shrink-0 self-start">
            <AffiliateStoreProductImage
              imageUrl={form.image_url || null}
              imageAlt={form.title || "product image"}
              categoryIconKey={selectedLeaf?.icon_key ?? null}
              categoryName={selectedLeaf?.name ?? "store"}
              size={64}
              className="rounded-lg object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-medium leading-snug">
              {form.title || (isAr ? "عنوان المنتج…" : "Product title…")}
            </span>
            {form.brand && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{form.brand}</span>
            )}
            <span className="mt-1 block text-sm text-muted-foreground">
              {form.summary || (isAr ? "الملخص…" : "Summary…")}
            </span>
          </span>
        </div>

        {/* 2) The PRODUCT PAGE header replica */}
        <p className="mt-4 text-xs font-medium text-muted-foreground">
          {isAr ? "رأس صفحة المنتج العامة" : "Public product page header"}
        </p>
        <div className="mt-1 rounded-xl border border-[var(--edge)] bg-[var(--bg)] p-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0">
              <AffiliateStoreProductImage
                imageUrl={form.image_url || null}
                imageAlt={form.title || "product image"}
                categoryIconKey={selectedLeaf?.icon_key ?? null}
                categoryName={selectedLeaf?.name ?? "store"}
                size={96}
                eager
                className="rounded-xl object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">
                {form.title || (isAr ? "العنوان…" : "Title…")}
              </p>
              {form.brand && <p className="mt-0.5 text-xs text-muted-foreground">{form.brand}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {isAr ? "الفئة: " : "Category: "}
                {selectedGroup ? `${selectedGroup.mainName} › ${selectedLeaf?.name ?? ""}` : isAr ? "— اختر فئة —" : "— pick a category —"}
              </p>
              {form.editorial_rating !== "" && !Number.isNaN(Number(form.editorial_rating)) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Alkemos Editorial Score: {Number(form.editorial_rating).toFixed(1)}/10
                </p>
              )}
              {form.is_featured && (
                <span className="mt-1.5 inline-block rounded-full border border-[var(--edge)] px-2 py-0.5 text-[10px] font-medium">
                  ★ Featured
                </span>
              )}
            </div>
          </div>

          {/* The buy unit (م-1 attached) — the honest pre-publish mirror */}
          <div className="mt-3 border-t border-[var(--edge)] pt-3">
            {isValidAsin(form.asin) ? (
              <>
                <OaDisclosureLine className="mb-1" />
                <span
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold opacity-90"
                  aria-hidden="true"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  {AFFILIATE_STORE_BUY_CTA_LABEL}
                </span>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {isAr
                    ? "الوسم يُدمج خادميًا وقت العرض — تحقق منه بزر التحقق أعلاه"
                    : "the Associates tag merges server-side at render — check it with StoreLinkVerify above"}
                </p>
              </>
            ) : (
              <p className="rounded-lg border border-[var(--edge)] bg-[var(--card)] p-3 text-xs text-muted-foreground">
                {isAr
                  ? "لا يوجد ASIN صالح — صفحة المنتج تُعرض بلا زر شراء حتى يُضبط (قانون SOP §5.1)"
                  : "No valid ASIN — the public page renders WITHOUT a buy unit until one is set (SOP §5.1)."}
              </p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              {isAr
                ? "السعر: لا يُعرض على Alkemos — أمازون تقدم السعر الحي (المرحلة 4/Creators API)"
                : "Price: never shown on Alkemos — Amazon serves the live price (Phase-4 Creators API)."}
            </p>
          </div>
        </div>

        {/* 3) The open-public-page button (404 while pending — honest) */}
        <div className="mt-4">
          {publicUrl ? (
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={publicUrl} target="_blank" rel="noopener">
                <ExternalLink className="size-4" />
                {isAr ? "افتح صفحة المنتج العامة" : "Open the public product page"}
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full" disabled>
              <ExternalLink className="size-4" />
              {isAr ? "اختر الفئة وSlug لعرض الرابط" : "Pick a category + slug to get the link"}
            </Button>
          )}
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
            {isAr
              ? "المنتجات غير المنشورة تعطي 404 — الصفحة تحيى بنشرها (سير 0097) والمعاينة أعلاه هي مرآتها قبل النشر"
              : "Unpublished products 404 on the public page — it goes live at publish (0097); the preview above is the honest pre-publish mirror."}
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title={
          mode === "new"
            ? isAr
              ? "منتج متجر جديد (إنجليزي)"
              : "New store product (EN)"
            : isAr
              ? "تحرير منتج المتجر"
              : "Edit store product"
        }
        sub={
          isAr
            ? "المحتوى إنجليزي حصرًا · الحفظ يبقي المنتج بانتظار مراجعتك (0097) · لا صور أمازون ولا نساء"
            : "English-only content · saving keeps it pending your review (0097) · no Amazon images, no women"
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/affiliate-store">
              <ArrowLeft className="size-4" /> {isAr ? "لوحة المتجر" : "Store dashboard"}
            </Link>
          </Button>
        }
      />

      {/* VISIBILITY-PREVIEW 2026-11-26: two-column shell — the form
          (min-w-0 guards grid blowout) + the sticky live-preview rail.
          SHELL-WIDTH LAW (live-check fix): the admin content area is
          ~800px, so the rail goes side-by-side only from xl up (at lg
          the form column collapsed to ~436px and the md:grid-cols-2
          fields overflowed their cells — the helpers collided); below
          xl the preview rides FIRST (the operator opens an edit and
          immediately sees the public mirror) and the fields keep their
          full-width two-column grid. */}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
      <SectionCard title={isAr ? "بيانات المنتج" : "Product data"}>
        {/* xl:grid-cols-1 — single-column fields while the preview rail
            is side-by-side (the SHELL-WIDTH LAW above); md:grid-cols-2
            keeps the two-column layout on stacked (below-xl) widths. */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <label className="grid gap-1 text-sm">
            <span>{isAr ? "الفئة الفرعية (ورقة الرابط)" : "Leaf category (URL segment)"}</span>
            <select
              className="rounded-md border bg-background px-3 py-2"
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
            >
              <option value="">{isAr ? "— اختر —" : "— pick —"}</option>
              {leafGroups.map((g) => (
                <optgroup key={g.mainId} label={g.mainName}>
                  {g.leaves.map((leaf) => (
                    <option key={leaf.id} value={leaf.id}>
                      {leaf.name} {leaf.is_active ? "" : "•"}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              {isAr
                ? "«•» = فئة غير نشطة (موجة 2/3) — منتجاتها تُراجع الآن وتُنشر عند تفعيل الفئة"
                : "• = inactive category (wave 2/3) — review now, publish when activated"}
            </span>
          </label>
          <label className="grid gap-1 text-sm">
            <span>ASIN (amazon.com)</span>
            <Input
              value={form.asin}
              onChange={(e) => set("asin", e.target.value.toUpperCase().trim())}
              placeholder="B0C1234567"
              className="font-mono"
            />
            <span className="text-xs text-muted-foreground">
              {form.asin && !isValidAsin(form.asin)
                ? isAr
                  ? "⛔ صيغة ASIN غير قياسية (B + 9 خانات أو 10 أرقام)"
                  : "⛔ non-standard ASIN (B + 9 chars, or 10 digits)"
                : isAr
                  ? "المفتاح الوحيد المخزن لوجهة الشراء — يُتحقق منه قبل النشر"
                  : "The only stored purchase key — verified before publish"}
            </span>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Slug (EN, lowercase-hyphens)</span>
            <Input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="cast-iron-kettlebell-16kg"
              className="font-mono"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{isAr ? "العلامة التجارية" : "Brand"}</span>
            <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-1">
            <span>{isAr ? "العنوان (إنجليزي)" : "Title (EN)"}</span>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-1">
            <span>{isAr ? "الملخص (إنجليزي — يظهر بالبطاقة)" : "Summary (EN — the card text)"}</span>
            <textarea
              className="min-h-20 rounded-md border bg-background px-3 py-2"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-1">
            <span>{isAr ? "المحتوى التحريري (إنجليزي فريد — لا نسخ أمازون؛ الأرضية الإرشادية 300 كلمة)" : "Editorial content (unique EN — no Amazon copy; 300-word advisory floor)"}</span>
            <textarea
              className="min-h-64 rounded-md border bg-background px-3 py-2"
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2 xl:col-span-1">
            <span>image_url {isAr ? "(مملوكة/مرخصة فقط — أو اتركه فارغًا للأيقونة)" : "(owned/licensed only — or leave empty for the carved icon)"}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={form.image_url}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="https://alkemos.com/affiliate-store-products/…"
                className="min-w-0 flex-1 font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={verifyingImage || !form.image_url.trim()}
                onClick={() => void runImageVerify()}
              >
                {verifyingImage ? <Unplug className="size-4 animate-pulse" /> : <ImageIcon className="size-4" />}
                {isAr ? "تحقق من الصورة" : "Verify image"}
              </Button>
            </div>
            <span
              className={`
                text-xs
                ${imageShape.verdict === "block" ? "text-destructive" : imageShape.verdict === "warn" ? "text-amber-600" : "text-muted-foreground"}
              `}
            >
              {imageShape.verdict === "ok" ? "✓" : imageShape.verdict === "warn" ? "⚠" : "⛔"}{" "}
              {imageShape.message}
            </span>
            {imageVerify && (
              <span className="text-xs">
                <Badge
                  variant={
                    imageVerify.status === "ok"
                      ? "default"
                      : imageVerify.status === "dead" || imageVerify.status === "shape-block"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {imageVerify.status}
                </Badge>{" "}
                <span className="text-muted-foreground">{imageVerify.message}</span>
              </span>
            )}
          </label>
          <label className="grid gap-1 text-sm">
            <span>image_alt {isAr ? "(وصف الصورة — يُفحص بقانون الصور)" : "(image description — screened by the image law)"}</span>
            <Input
              value={form.image_alt}
              onChange={(e) => set("image_alt", e.target.value)}
              placeholder="cast iron kettlebell on a neutral background"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Alkemos Editorial Score (0.0–9.9)</span>
            <Input
              value={form.editorial_rating}
              onChange={(e) => set("editorial_rating", e.target.value)}
              placeholder="8.5"
              inputMode="decimal"
            />
            <span className="text-xs text-muted-foreground">
              {isAr
                ? "تقييم تحريري داخلي موسوم — ليس تقييم أمازون"
                : "labeled internal editorial score — never an Amazon rating"}
            </span>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
            />
            <span>{isAr ? "ضمن المختارات (Featured)" : "Featured (the /store rail)"}</span>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="StoreLinkVerify">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={verifying || !form.asin}
            onClick={() => void runVerify()}
          >
            {verifying ? (
              <Unplug className="size-4 animate-pulse" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {isAr ? "تحقق من رابط الشراء" : "Verify the purchase link"}
          </Button>
          {verify && (
            <div className="text-sm">
              <Badge variant={verify.status === "ok" ? "default" : verify.status === "dead" ? "destructive" : "secondary"}>
                {verify.status}
              </Badge>{" "}
              <span className="text-muted-foreground">{verify.message}</span>
              {verify.url && (
                <a href={verify.url} target="_blank" rel="noopener" className="ms-2 underline">
                  {isAr ? "افتح الرابط" : "open"}
                </a>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isAr
            ? "فحص HEAD خادمي (متابعة التحويلات، مهلة قصيرة، إعادة واحدة) — «unverified» ليست «dead»: أمازون يرفض كثيرًا فحوص HEAD؛ الفحص الأسبوعي الآلي للمنتجات المنشورة بند المرحلة 2."
            : "Server-side HEAD probe (redirect-following, short timeout, one retry) — unverified ≠ dead: Amazon often rejects HEAD; the weekly automated sweep of published products is the Phase-2 item."}
        </p>
      </SectionCard>

      {isScreeningCategory && (
        <SectionCard
          title={isAr ? "قائمة غربلة المكملات/الأغذية (§4 — إطار الغربلة المعتمد)" : "Supplements/foods screening checklist (§4 — the approved framework)"}
        >
          <ol className="list-decimal space-y-1 ps-5 text-sm">
            {SCREENING_STEPS.map((step) => (
              <li key={step.en}>
                {isAr ? step.ar : step.en}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            {isAr
              ? "البوابات لا تُتجاوز: مراجعتك (0097) تبقى بوابة النشر، والكلمات المحظورة ترفض آليًا."
              : "No gate bypass: your 0097 review stays the publish gate, and blocklist words refuse automatically."}
          </p>
        </SectionCard>
      )}

      <SectionCard title={isAr ? "أسطح الربط الداخلية (إنجليزية حصرًا — تُستخدم بالمرحلة 2)" : "Internal surface bindings (EN only — consumed in Phase 2)"}>
        <ul className="space-y-2">
          {form.links.map((link, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border bg-background px-2 py-1 text-sm"
                value={link.surface_type}
                onChange={(e) =>
                  set(
                    "links",
                    form.links.map((l, j) => (j === i ? { ...l, surface_type: e.target.value } : l)),
                  )
                }
              >
                {SURFACE_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Input
                className="max-w-56 font-mono text-sm"
                value={link.surface_key}
                placeholder="bmi-calculator / dumbbell / …"
                onChange={(e) =>
                  set(
                    "links",
                    form.links.map((l, j) => (j === i ? { ...l, surface_key: e.target.value } : l)),
                  )
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => set("links", form.links.filter((_, j) => j !== i))}
              >
                {isAr ? "حذف" : "remove"}
              </Button>
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => set("links", [...form.links, { surface_type: "tool", surface_key: "" }])}
        >
          + {isAr ? "سطح" : "surface"}
        </Button>
      </SectionCard>

      <SectionCard title={isAr ? "الحرّاس الحية" : "Live store guards"}>
        <div className="mb-3">
          <Button onClick={() => void save()} disabled={saving || blocking.length > 0}>
            <Save className="size-4" />
            {saving
              ? isAr
                ? "يحفظ…"
                : "Saving…"
              : mode === "new"
                ? isAr
                  ? "حفظ (بانتظار مراجعتك)"
                  : "Save (pending your review)"
                : isAr
                  ? "حفظ التعديل"
                  : "Save"}
          </Button>
        </div>
        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isAr ? "كل الحرّاس خضراء (لا بنود حالية)" : "All guards green (no current findings)."}
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {[...blocking, ...warnings].map((f, i) => (
              <li key={`${f.rule}-${i}`} className={f.severity === "block" ? "text-destructive" : "text-amber-600"}>
                {f.severity === "block" ? "⛔" : "⚠"} [{f.rule}] {f.message}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
        </div>
        {previewPanel}
      </div>
    </div>
  );
}
