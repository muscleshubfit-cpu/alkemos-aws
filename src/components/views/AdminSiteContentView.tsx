"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  adminFetchSiteContent,
  adminResetSiteContent,
  adminUpsertSiteContent,
  type SiteContentAudit,
} from "@/lib/site-content/admin";
import {
  HOME_COPY_GROUPS,
  HOME_FAQ_DEFAULT,
  HOME_TEXT_FIELDS,
} from "@/lib/site-content/home";
import {
  FAQ_PAGE_DEFAULT,
  STATIC_PAGE_DEFAULTS,
} from "@/lib/site-content/static-pages";
import type {
  SiteFaqItem,
  StaticPageContent,
} from "@/lib/site-content/core";

/**
 * ADMIN — SITE CONTENT EDITOR (SITE-CONTENT-281, owner task order
 * 2026-09-27).
 *
 * WHAT THE OWNER SEES: the site's static marketing copy (homepage
 * sections + about/privacy/terms/faq pages) as ordinary bilingual
 * forms. A save writes the `site_content` table (RLS admin-only) and
 * goes live on the site within ~5 minutes (the ISR window) — no git
 * commit, no CI run, no deploy.
 *
 * THE HONEST-FALLBACK MODEL (the same law the whole system rides):
 *   - Every field opens PREFILLED with what the site renders today
 *     (a saved override, else the built-in default).
 *   - Clearing a field (both languages) = «back to the built-in
 *     default» — empty values are never stored, the row is deleted.
 *   - A field that saves only ONE language overrides that language
 *     while the other keeps rendering its built-in default.
 *   - Broken/missing data can never blank a page — the resolver falls
 *     back to the code defaults (validation below mirrors it).
 *
 * NOT editable here (by design — they restate VERIFIED numbers and
 * policies from their single sources): prices/tier limits (memberships.ts),
 * the EVO fair-use quota line, the refund-policy line, library counts
 * ({exercises}/{foods} tokens stay live), and interactive tool labels.
 */

type TextDraft = Record<string, { en: string; ar: string }>;
type FaqDraft = { en: SiteFaqItem[]; ar: SiteFaqItem[] };
type FaqPageDraft = { en: { title: string; items: SiteFaqItem[] }; ar: { title: string; items: SiteFaqItem[] } };
type PageDraft = Record<"about" | "privacy" | "terms", { en: StaticPageContent; ar: StaticPageContent }>;

type TabId = "home" | "about" | "privacy" | "terms" | "faq";

const TABS: { id: TabId; ar: string; en: string }[] = [
  { id: "home", ar: "الصفحة الرئيسية", en: "Homepage" },
  { id: "about", ar: "عن المنصة", en: "About" },
  { id: "privacy", ar: "الخصوصية", en: "Privacy" },
  { id: "terms", ar: "الشروط", en: "Terms" },
  { id: "faq", ar: "أسئلة /faq", en: "FAQ page" },
];

const TEXT_LIMIT = 600;
const LONG_LIMIT = 4000;
const ANSWER_LIMIT = 4000;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textOf(value: unknown, fallback: string): string {
  const s = asString(value).trim();
  return s.length > 0 ? s : fallback;
}

function faqOf(value: unknown, fallback: SiteFaqItem[]): SiteFaqItem[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const items: SiteFaqItem[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) return fallback;
    const { q, a } = raw as Record<string, unknown>;
    if (typeof q !== "string" || typeof a !== "string") return fallback;
    if (q.trim().length === 0 || a.trim().length === 0) return fallback;
    items.push({ q, a });
  }
  return items;
}

function pageOf(value: unknown, fallback: StaticPageContent): StaticPageContent {
  if (typeof value !== "object" || value === null) return fallback;
  const { title, sections } = value as Record<string, unknown>;
  if (typeof title !== "string" || !Array.isArray(sections)) return fallback;
  const parsed: StaticPageContent["sections"] = [];
  for (const raw of sections) {
    if (typeof raw !== "object" || raw === null) return fallback;
    const s = raw as Record<string, unknown>;
    if (typeof s.heading !== "string" || !Array.isArray(s.paragraphs)) return fallback;
    parsed.push({
      heading: s.heading,
      paragraphs: s.paragraphs.filter((p): p is string => typeof p === "string"),
      list: Array.isArray(s.list) ? (s.list.filter((li) => typeof li === "string") as string[]) : undefined,
      links: Array.isArray(s.links)
        ? (s.links.filter(
            (l): l is { label: string; href: string } =>
              typeof l === "object" && l !== null &&
              typeof (l as Record<string, unknown>).label === "string" &&
              typeof (l as Record<string, unknown>).href === "string",
          ))
        : undefined,
    });
  }
  return { title, sections: parsed };
}

function faqPageOf(
  value: unknown,
  fallback: { title: string; items: SiteFaqItem[] },
): { title: string; items: SiteFaqItem[] } {
  if (typeof value !== "object" || value === null) return fallback;
  const { title, items } = value as Record<string, unknown>;
  if (typeof title !== "string" || title.trim().length === 0) return fallback;
  const parsed = faqOf(items, fallback.items);
  return { title, items: parsed };
}

function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function AdminSiteContentView() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [tab, setTab] = useState<TabId>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [audits, setAudits] = useState<Record<string, SiteContentAudit>>({});

  const [texts, setTexts] = useState<TextDraft>({});
  const [homeFaq, setHomeFaq] = useState<FaqDraft>({ en: [], ar: [] });
  const [pages, setPages] = useState<PageDraft>({
    about: { en: STATIC_PAGE_DEFAULTS.about.en, ar: STATIC_PAGE_DEFAULTS.about.ar },
    privacy: { en: STATIC_PAGE_DEFAULTS.privacy.en, ar: STATIC_PAGE_DEFAULTS.privacy.ar },
    terms: { en: STATIC_PAGE_DEFAULTS.terms.en, ar: STATIC_PAGE_DEFAULTS.terms.ar },
  });
  const [faqPage, setFaqPage] = useState<FaqPageDraft>({
    en: { title: FAQ_PAGE_DEFAULT.en.title, items: FAQ_PAGE_DEFAULT.en.items },
    ar: { title: FAQ_PAGE_DEFAULT.ar.title, items: FAQ_PAGE_DEFAULT.ar.items },
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { values, audits: stamps } = await adminFetchSiteContent();
    const nextTexts: TextDraft = {};
    for (const field of HOME_TEXT_FIELDS) {
      const entry = values[field.key];
      nextTexts[field.key] = {
        en: textOf(entry?.en, field.defaultEn),
        ar: textOf(entry?.ar, field.defaultAr),
      };
    }
    setTexts(nextTexts);
    setHomeFaq({
      en: faqOf(values["home.faq"]?.en, HOME_FAQ_DEFAULT.en),
      ar: faqOf(values["home.faq"]?.ar, HOME_FAQ_DEFAULT.ar),
    });
    setPages({
      about: {
        en: pageOf(values["page.about"]?.en, STATIC_PAGE_DEFAULTS.about.en),
        ar: pageOf(values["page.about"]?.ar, STATIC_PAGE_DEFAULTS.about.ar),
      },
      privacy: {
        en: pageOf(values["page.privacy"]?.en, STATIC_PAGE_DEFAULTS.privacy.en),
        ar: pageOf(values["page.privacy"]?.ar, STATIC_PAGE_DEFAULTS.privacy.ar),
      },
      terms: {
        en: pageOf(values["page.terms"]?.en, STATIC_PAGE_DEFAULTS.terms.en),
        ar: pageOf(values["page.terms"]?.ar, STATIC_PAGE_DEFAULTS.terms.ar),
      },
    });
    setFaqPage({
      en: { title: faqPageOf(values["page.faq"]?.en, FAQ_PAGE_DEFAULT.en).title, items: faqPageOf(values["page.faq"]?.en, FAQ_PAGE_DEFAULT.en).items },
      ar: { title: faqPageOf(values["page.faq"]?.ar, FAQ_PAGE_DEFAULT.ar).title, items: faqPageOf(values["page.faq"]?.ar, FAQ_PAGE_DEFAULT.ar).items },
    });
    setAudits(stamps);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    for (const field of HOME_TEXT_FIELDS) {
      const draft = texts[field.key];
      if (!draft) continue;
      if (textOf(draft.en, field.defaultEn) !== field.defaultEn) return true;
      if (textOf(draft.ar, field.defaultAr) !== field.defaultAr) return true;
    }
    if (JSON.stringify(homeFaq.en) !== JSON.stringify(HOME_FAQ_DEFAULT.en)) return true;
    if (JSON.stringify(homeFaq.ar) !== JSON.stringify(HOME_FAQ_DEFAULT.ar)) return true;
    for (const page of ["about", "privacy", "terms"] as const) {
      if (JSON.stringify(pages[page].en) !== JSON.stringify(STATIC_PAGE_DEFAULTS[page].en)) return true;
      if (JSON.stringify(pages[page].ar) !== JSON.stringify(STATIC_PAGE_DEFAULTS[page].ar)) return true;
    }
    if (JSON.stringify(faqPage.en) !== JSON.stringify({ title: FAQ_PAGE_DEFAULT.en.title, items: FAQ_PAGE_DEFAULT.en.items })) return true;
    if (JSON.stringify(faqPage.ar) !== JSON.stringify({ title: FAQ_PAGE_DEFAULT.ar.title, items: FAQ_PAGE_DEFAULT.ar.items })) return true;
    return false;
  }, [texts, homeFaq, pages, faqPage]);

  const setText = (key: string, locale: "en" | "ar", value: string) => {
    setTexts((prev) => ({ ...prev, [key]: { ...prev[key], [locale]: value } }));
  };

  /* ── Validation (mirrors the resolver's own rules) ── */
  const validate = (): string | null => {
    for (const field of HOME_TEXT_FIELDS) {
      const draft = texts[field.key];
      if (!draft) continue;
      const limit = field.multiline ? LONG_LIMIT : TEXT_LIMIT;
      if (draft.en.length > limit || draft.ar.length > limit) {
        return isAr
          ? `نص طويل جداً في «${isAr ? field.labelAr : field.labelEn}» (الحد ${limit} حرفاً)`
          : `Too long in "${field.labelEn}" (limit ${limit} chars)`;
      }
    }
    for (const locale of ["en", "ar"] as const) {
      for (const item of homeFaq[locale]) {
        if (!item.q.trim() || !item.a.trim()) {
          return isAr ? "سؤال أو إجابة فارغة في أسئلة الصفحة الرئيسية" : "An empty question/answer in the homepage FAQ";
        }
        if (item.a.length > ANSWER_LIMIT) {
          return isAr ? "إجابة أسئلة الصفحة الرئيسية أطول من الحد" : "A homepage FAQ answer exceeds the limit";
        }
      }
    }
    return null;
  };

  /* ── Cache refresh (CACHE-POLICY-AUDIT 2026-10-22) ──
   * The editor saves directly from the browser to Supabase — this
   * fire-and-forget call makes the server invalidate the data-cache
   * tag + the ten consuming pages' ISR + the Cloudflare edge copies
   * (edge_ttl=43200) right after a successful save/reset. Never blocks
   * the UI; a failure only warns in the console (the 300s TTL + edge
   * TTL remain the safety net). The blog editor's exact pattern. */
  const refreshCacheAfterSave = () => {
    void fetch("/api/admin/site-content/revalidate", {
      method: "POST",
    }).catch((e) => {
      console.warn("[site-content-cache-refresh] post-save revalidation failed", e);
    });
  };

  /* ── Save (per tab scope) ── */
  const save = async () => {
    const problem = validate();
    if (problem) {
      setStatus({ ok: false, text: problem });
      return;
    }
    setSaving(true);
    setStatus(null);
    let failures = 0;

    if (tab === "home") {
      for (const field of HOME_TEXT_FIELDS) {
        const draft = texts[field.key];
        if (!draft) continue;
        const en = textOf(draft.en, field.defaultEn);
        const ar = textOf(draft.ar, field.defaultAr);
        const isDefault = en === field.defaultEn && ar === field.defaultAr;
        if (isDefault && audits[field.key]) {
          if (!(await adminResetSiteContent([field.key]))) failures++;
          continue;
        }
        if (isDefault) continue;
        if (!(await adminUpsertSiteContent(field.key, en, ar))) failures++;
      }
      const faqIsDefault =
        JSON.stringify(homeFaq.en) === JSON.stringify(HOME_FAQ_DEFAULT.en) &&
        JSON.stringify(homeFaq.ar) === JSON.stringify(HOME_FAQ_DEFAULT.ar);
      if (faqIsDefault && audits["home.faq"]) {
        if (!(await adminResetSiteContent(["home.faq"]))) failures++;
      } else if (!faqIsDefault) {
        if (!(await adminUpsertSiteContent("home.faq", homeFaq.en, homeFaq.ar))) failures++;
      }
    } else {
      const key = `page.${tab}`;
      if (tab === "faq") {
        const isDefault =
          JSON.stringify(faqPage.en) === JSON.stringify({ title: FAQ_PAGE_DEFAULT.en.title, items: FAQ_PAGE_DEFAULT.en.items }) &&
          JSON.stringify(faqPage.ar) === JSON.stringify({ title: FAQ_PAGE_DEFAULT.ar.title, items: FAQ_PAGE_DEFAULT.ar.items });
        if (isDefault && audits[key]) {
          if (!(await adminResetSiteContent([key]))) failures++;
        } else if (!isDefault) {
          if (!(await adminUpsertSiteContent(key, faqPage.en, faqPage.ar))) failures++;
        }
      } else {
        const draft = pages[tab];
        const isDefault =
          JSON.stringify(draft.en) === JSON.stringify(STATIC_PAGE_DEFAULTS[tab].en) &&
          JSON.stringify(draft.ar) === JSON.stringify(STATIC_PAGE_DEFAULTS[tab].ar);
        if (isDefault && audits[key]) {
          if (!(await adminResetSiteContent([key]))) failures++;
        } else if (!isDefault) {
          if (!(await adminUpsertSiteContent(key, draft.en, draft.ar))) failures++;
        }
      }
    }

    if (failures === 0) refreshCacheAfterSave();
    await load();
    setSaving(false);
    setStatus(
      failures === 0
        ? { ok: true, text: isAr ? "تم الحفظ — يظهر على الموقع فورًا (أو خلال ~5 دقائق إن تعذر الإبطال)." : "Saved — live on the site immediately (or within ~5 minutes if invalidation was skipped)." }
        : { ok: false, text: isAr ? `فشل حفظ ${failures} عنصراً — أعد المحاولة.` : `Failed to save ${failures} item(s) — try again.` },
    );
  };

  const resetTab = async () => {
    const keys =
      tab === "home"
        ? [...HOME_TEXT_FIELDS.map((f) => f.key), "home.faq"]
        : [`page.${tab}`];
    if (!(await adminResetSiteContent(keys))) {
      setStatus({ ok: false, text: isAr ? "فشل إعادة الضبط." : "Reset failed." });
      return;
    }
    refreshCacheAfterSave();
    await load();
    setStatus({ ok: true, text: isAr ? "أُعيدت القيم المدمجة الافتراضية — وظهرت فورًا على الموقع." : "Built-in defaults restored — live on the site immediately." });
  };

  /* ── Render helpers ── */

  const localeHead = (locale: "en" | "ar") => (
    <p className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
      {locale === "en" ? "English" : "العربية"}
    </p>
  );

  const fieldRow = (key: string, labelEn: string, labelAr: string, multiline: boolean, hintEn?: string, hintAr?: string, tokens = false) => {
    const draft = texts[key] ?? { en: "", ar: "" };
    const limit = multiline ? LONG_LIMIT : TEXT_LIMIT;
    const stamp = audits[key];
    return (
      <div key={key} className="rounded-xl border border-[#e8e8ed] bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1d1d1f]">{isAr ? labelAr : labelEn}</p>
          {stamp && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {isAr ? "معدَّل" : "edited"} · {formatStamp(stamp.updated_at)}
            </Badge>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            {localeHead("en")}
            {multiline ? (
              <Textarea
                dir="ltr"
                value={draft.en}
                maxLength={limit}
                rows={4}
                onChange={(e) => setText(key, "en", e.target.value)}
                className="w-full text-sm"
              />
            ) : (
              <Input dir="ltr" value={draft.en} maxLength={limit} onChange={(e) => setText(key, "en", e.target.value)} className="w-full text-sm" />
            )}
          </div>
          <div className="space-y-1.5">
            {localeHead("ar")}
            {multiline ? (
              <Textarea
                dir="rtl"
                value={draft.ar}
                maxLength={limit}
                rows={4}
                onChange={(e) => setText(key, "ar", e.target.value)}
                className="w-full text-sm"
              />
            ) : (
              <Input dir="rtl" value={draft.ar} maxLength={limit} onChange={(e) => setText(key, "ar", e.target.value)} className="w-full text-sm" />
            )}
          </div>
        </div>
        {(hintEn || tokens) && (
          <p className="mt-2 text-xs font-normal text-[#86868b]">
            {isAr ? hintAr ?? hintEn : hintEn}
            {tokens
              ? isAr
                ? " — يمكن استخدام {exercises} و{foods} لإظهار الأعداد الحية للمكتبات."
                : " — you may use {exercises} and {foods} to show the live library sizes."
              : ""}
          </p>
        )}
      </div>
    );
  };

  const faqEditor = (
    draft: SiteFaqItem[],
    locale: "en" | "ar",
    onChange: (items: SiteFaqItem[]) => void,
  ) => (
    <div className="space-y-3">
      {draft.map((item, i) => (
        <div key={i} className="rounded-xl border border-[#e8e8ed] bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#6e6e73]">#{i + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-[#ff3b30]"
              onClick={() => onChange(draft.filter((_, j) => j !== i))}
            >
              {isAr ? "حذف" : "Remove"}
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              dir={locale === "ar" ? "rtl" : "ltr"}
              value={item.q}
              maxLength={TEXT_LIMIT}
              placeholder={isAr ? "السؤال" : "Question"}
              onChange={(e) => onChange(draft.map((it, j) => (j === i ? { ...it, q: e.target.value } : it)))}
              className="text-sm font-medium"
            />
            <Textarea
              dir={locale === "ar" ? "rtl" : "ltr"}
              value={item.a}
              maxLength={ANSWER_LIMIT}
              rows={3}
              placeholder={isAr ? "الإجابة" : "Answer"}
              onChange={(e) => onChange(draft.map((it, j) => (j === i ? { ...it, a: e.target.value } : it)))}
              className="text-sm"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...draft, { q: "", a: "" }])}
      >
        + {isAr ? "سؤال جديد" : "New question"}
      </Button>
    </div>
  );

  const staticPageEditor = (page: "about" | "privacy" | "terms") => {
    const draft = pages[page];
    const update = (locale: "en" | "ar", next: StaticPageContent) =>
      setPages((prev) => ({ ...prev, [page]: { ...prev[page], [locale]: next } }));
    const stamp = audits[`page.${page}`];

    const renderLocale = (locale: "en" | "ar") => {
      const value = draft[locale] as StaticPageContent;
      const set = (next: StaticPageContent) => update(locale, next);
      return (
        <div className="space-y-3">
          {localeHead(locale)}
          <div className="rounded-xl border border-[#e8e8ed] bg-white p-3">
            <Label className="mb-1.5 block text-xs text-[#6e6e73]">{isAr ? "عنوان الصفحة" : "Page title"}</Label>
            <Input
              dir={locale === "ar" ? "rtl" : "ltr"}
              value={value.title}
              maxLength={TEXT_LIMIT}
              onChange={(e) => set({ ...value, title: e.target.value })}
              className="text-sm font-semibold"
            />
          </div>
          {value.sections.map((section, i) => (
            <div key={i} className="rounded-xl border border-[#e8e8ed] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6e6e73]">
                  {isAr ? `قسم ${i + 1}` : `Section ${i + 1}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-[#ff3b30]"
                  onClick={() => set({ ...value, sections: value.sections.filter((_, j) => j !== i) })}
                >
                  {isAr ? "حذف" : "Remove"}
                </Button>
              </div>
              <Input
                dir={locale === "ar" ? "rtl" : "ltr"}
                value={section.heading}
                maxLength={TEXT_LIMIT}
                placeholder={isAr ? "عنوان القسم" : "Section heading"}
                onChange={(e) =>
                  set({
                    ...value,
                    sections: value.sections.map((s, j) => (j === i ? { ...s, heading: e.target.value } : s)),
                  })
                }
                className="mb-2 text-sm font-medium"
              />
              {section.paragraphs.map((p, k) => (
                <div key={k} className="mb-2 flex gap-2">
                  <Textarea
                    dir={locale === "ar" ? "rtl" : "ltr"}
                    value={p}
                    maxLength={LONG_LIMIT}
                    rows={3}
                    placeholder={isAr ? "فقرة" : "Paragraph"}
                    onChange={(e) =>
                      set({
                        ...value,
                        sections: value.sections.map((s, j) =>
                          j === i ? { ...s, paragraphs: s.paragraphs.map((pp, l) => (l === k ? e.target.value : pp)) } : s,
                        ),
                      })
                    }
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs text-[#ff3b30]"
                    onClick={() =>
                      set({
                        ...value,
                        sections: value.sections.map((s, j) =>
                          j === i ? { ...s, paragraphs: s.paragraphs.filter((_, l) => l !== k) } : s,
                        ),
                      })
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-2 h-7"
                onClick={() =>
                  set({
                    ...value,
                    sections: value.sections.map((s, j) => (j === i ? { ...s, paragraphs: [...s.paragraphs, ""] } : s)),
                  })
                }
              >
                + {isAr ? "فقرة" : "Paragraph"}
              </Button>
              {section.list && (
                <div className="mb-2">
                  <Label className="mb-1 block text-xs text-[#6e6e73]">
                    {isAr ? "قائمة (سطر لكل عنصر)" : "List (one item per line)"}
                  </Label>
                  <Textarea
                    dir={locale === "ar" ? "rtl" : "ltr"}
                    value={section.list.join("\n")}
                    maxLength={LONG_LIMIT}
                    rows={Math.min(8, section.list.length + 1)}
                    onChange={(e) =>
                      set({
                        ...value,
                        sections: value.sections.map((s, j) =>
                          j === i ? { ...s, list: e.target.value.split("\n") } : s,
                        ),
                      })
                    }
                    className="text-sm"
                  />
                </div>
              )}
              {section.links && (
                <div className="space-y-2">
                  <Label className="block text-xs text-[#6e6e73]">
                    {isAr ? "روابط القسم (داخلية فقط)" : "Section links (internal only)"}
                  </Label>
                  {section.links.map((link, k) => (
                    <div key={k} className="flex gap-2">
                      <Input
                        dir={locale === "ar" ? "rtl" : "ltr"}
                        value={link.label}
                        maxLength={TEXT_LIMIT}
                        placeholder={isAr ? "النص" : "Label"}
                        onChange={(e) =>
                          set({
                            ...value,
                            sections: value.sections.map((s, j) =>
                              j === i
                                ? { ...s, links: s.links?.map((l, l2) => (l2 === k ? { ...l, label: e.target.value } : l)) }
                                : s,
                            ),
                          })
                        }
                        className="text-sm"
                      />
                      <Input
                        dir="ltr"
                        value={link.href}
                        maxLength={TEXT_LIMIT}
                        placeholder="/tools"
                        onChange={(e) =>
                          set({
                            ...value,
                            sections: value.sections.map((s, j) =>
                              j === i
                                ? { ...s, links: s.links?.map((l, l2) => (l2 === k ? { ...l, href: e.target.value } : l)) }
                                : s,
                            ),
                          })
                        }
                        className="w-40 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ ...value, sections: [...value.sections, { heading: "", paragraphs: [""] }] })}
          >
            + {isAr ? "قسم جديد" : "New section"}
          </Button>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <p className="text-xs font-normal text-[#86868b]">
          {isAr
            ? "في الفقرات يمكن استخدام {exercises} و{foods} لإظهار الأعداد الحية لمكتبة التمارين وقاعدة الأطعمة — تبقى محدّثة تلقائياً. روابط الأقسام داخلية فقط (تبدأ بـ /)."
            : "Inside paragraphs you may use {exercises} and {foods} to show the live exercise/food library sizes — they stay auto-updated. Section links are internal only (must start with /)."}
        </p>
        {stamp && (
          <Badge variant="secondary" className="text-[10px] font-normal">
            {isAr ? "معدَّل" : "edited"} · {formatStamp(stamp.updated_at)}
          </Badge>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {renderLocale("en")}
          {renderLocale("ar")}
        </div>
      </div>
    );
  };

  const faqPageEditor = () => {
    const stamp = audits["page.faq"];
    const setTitle = (locale: "en" | "ar", title: string) =>
      setFaqPage((prev) => ({ ...prev, [locale]: { ...prev[locale], title } }));
    const setItems = (locale: "en" | "ar", items: SiteFaqItem[]) =>
      setFaqPage((prev) => ({ ...prev, [locale]: { ...prev[locale], items } }));
    return (
      <div className="space-y-4">
        {stamp && (
          <Badge variant="secondary" className="text-[10px] font-normal">
            {isAr ? "معدَّل" : "edited"} · {formatStamp(stamp.updated_at)}
          </Badge>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#e8e8ed] bg-white p-4">
            {localeHead("en")}
            <Input dir="ltr" value={faqPage.en.title} maxLength={TEXT_LIMIT} onChange={(e) => setTitle("en", e.target.value)} className="mt-1 text-sm font-semibold" />
          </div>
          <div className="rounded-xl border border-[#e8e8ed] bg-white p-4">
            {localeHead("ar")}
            <Input dir="rtl" value={faqPage.ar.title} maxLength={TEXT_LIMIT} onChange={(e) => setTitle("ar", e.target.value)} className="mt-1 text-sm font-semibold" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            {localeHead("en")}
            <div className="mt-2">{faqEditor(faqPage.en.items, "en", (items) => setItems("en", items))}</div>
          </div>
          <div>
            {localeHead("ar")}
            <div className="mt-2">{faqEditor(faqPage.ar.items, "ar", (items) => setItems("ar", items))}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "نصوص الموقع" : "Site content"}
        sub={
          isAr
            ? "عدِّل نصوص الصفحة الرئيسية والصفحات الثابتة بالعربية والإنجليزية — يظهر التعديل على الموقع خلال ~5 دقائق دون أي نشر أو كود. أفراغ الحقل يعيده للنص المدمج."
            : "Edit the homepage and static-page copy in Arabic and English — changes go live within ~5 minutes, no deploy and no code. Clearing a field restores the built-in text."
        }
        actions={
          <div className="flex items-center gap-2">
            {dirty && <Badge variant="secondary">{isAr ? "تغييرات غير محفوظة" : "unsaved"}</Badge>}
            <Button type="button" variant="outline" size="sm" disabled={saving || loading} onClick={() => void resetTab()}>
              {isAr ? "إعادة الافتراضي" : "Reset to default"}
            </Button>
            <Button type="button" size="sm" disabled={saving || loading} onClick={() => void save()}>
              {saving ? (isAr ? "جارٍ الحفظ…" : "Saving…") : isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      />

      {status && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            status.ok
              ? "border-[#d1e7dd] bg-[#f0faf3] text-[#0f5132]"
              : "border-[#f5c2c7] bg-[#fdf0f0] text-[#842029]"
          }`}
        >
          {status.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#e8e8ed] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[#1d1d1f] text-white"
                : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[#6e6e73]">
          {isAr ? "جارٍ تحميل النصوص…" : "Loading content…"}
        </p>
      ) : tab === "home" ? (
        <div className="space-y-6">
          {HOME_COPY_GROUPS.map((group) => (
            <div key={group.key} className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
                {isAr ? group.labelAr : group.labelEn}
              </h2>
              {group.fields.map((f) =>
                fieldRow(f.key, f.labelEn, f.labelAr, !!f.multiline, f.hintEn, f.hintAr),
              )}
            </div>
          ))}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
              {isAr ? "أسئلة الصفحة الرئيسية (5 أسئلة + JSON-LD)" : "Homepage FAQ (5 questions + JSON-LD)"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                {localeHead("en")}
                <div className="mt-2">{faqEditor(homeFaq.en, "en", (items) => setHomeFaq((prev) => ({ ...prev, en: items })))}</div>
              </div>
              <div>
                {localeHead("ar")}
                <div className="mt-2">{faqEditor(homeFaq.ar, "ar", (items) => setHomeFaq((prev) => ({ ...prev, ar: items })))}</div>
              </div>
            </div>
          </div>
        </div>
      ) : tab === "faq" ? (
        faqPageEditor()
      ) : (
        staticPageEditor(tab)
      )}
    </div>
  );
}
