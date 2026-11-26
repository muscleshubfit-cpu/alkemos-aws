"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck, Unplug } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, SectionCard, EmptyState } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { runStoreProductGuards, type StoreGuardFinding } from "@/lib/store-guards";
import { isValidAsin } from "@/lib/store-link";

/**
 * STORE EDITOR VIEW (ALKEMOS-STORE-PHASE1 §1.2 — owner order 2026-11-26).
 * The English-product editor behind /admin/store/new and /admin/store/[id]
 * (the blog-editor pattern, store-shaped):
 *
 *   - CONTENT FIELDS ARE ENGLISH ONLY (store law §0 — the interface is
 *     operator-language but the fields feed an EN-only store).
 *   - LIVE GUARD FEEDBACK: every keystroke re-runs the store guards
 *     (image law v2 §0 · halal blocklist · claims · commission rates ·
 *     ASIN shape · stored-tagged links) — blocking findings refuse the
 *     save server-side too (the same module runs there).
 *   - STORELINKVERIFY: one button → GET /api/admin/store/verify?asin=…
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

export function StoreEditorView({ mode, productId }: { mode: "new" | "edit"; productId?: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [saving, setSaving] = useState(false);
  const [verify, setVerify] = useState<{ status: string; message: string; url: string | null } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const [loaded, setLoaded] = useState(mode === "new");

  useEffect(() => {
    const url = mode === "edit" && productId ? `/api/admin/store/products?id=${productId}` : "/api/admin/store/products";
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

  const findings: StoreGuardFinding[] = useMemo(
    () =>
      runStoreProductGuards({
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
      const res = await fetch("/api/admin/store/products", {
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
          router.push(`/admin/store/${body.id}`);
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
      const res = await fetch(`/api/admin/store/verify?asin=${encodeURIComponent(form.asin.trim())}`);
      const body = (await res.json()) as { status: string; message: string; url: string | null };
      setVerify(body);
    } catch {
      setVerify({ status: "error", message: isAr ? "فشل التحقق" : "Verify request failed", url: null });
    } finally {
      setVerifying(false);
    }
  }, [form.asin, isAr]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!loaded) return <EmptyState text={isAr ? "جارٍ التحميل…" : "Loading…"} />;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
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
            <Link href="/admin/store">
              <ArrowLeft className="size-4" /> {isAr ? "لوحة المتجر" : "Store dashboard"}
            </Link>
          </Button>
        }
      />

      <SectionCard title={isAr ? "بيانات المنتج" : "Product data"}>
        <div className="grid gap-4 md:grid-cols-2">
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
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>{isAr ? "العنوان (إنجليزي)" : "Title (EN)"}</span>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>{isAr ? "الملخص (إنجليزي — يظهر بالبطاقة)" : "Summary (EN — the card text)"}</span>
            <textarea
              className="min-h-20 rounded-md border bg-background px-3 py-2"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>{isAr ? "المحتوى التحريري (إنجليزي فريد — لا نسخ أمازون؛ الأرضية الإرشادية 300 كلمة)" : "Editorial content (unique EN — no Amazon copy; 300-word advisory floor)"}</span>
            <textarea
              className="min-h-64 rounded-md border bg-background px-3 py-2"
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>image_url {isAr ? "(مملوكة/مرخصة فقط — أو اتركه فارغًا للأيقونة)" : "(owned/licensed only — or leave empty for the carved icon)"}</span>
            <Input
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://alkemos.com/store-products/…"
              className="font-mono"
            />
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
  );
}
