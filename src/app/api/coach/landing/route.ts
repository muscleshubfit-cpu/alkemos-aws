import { NextRequest, NextResponse } from "next/server";
import { requireCoach, authRequired, type AuthUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { coachLandingBodySchema } from "@/lib/validation/schemas";
import { coachSlugFromName } from "@/lib/slug";
import { revalidateCoachLanding } from "@/lib/coach-landing-revalidate";
import type { Database } from "@/lib/supabase/types";

// 0049 SOFT-ROLL LAW: certificates is sent only on the FIRST attempt —
// the retry payload (migration not applied yet) omits it.
type CoachPageUpsert = Database["public"]["Tables"]["coach_pages"]["Insert"];
type CoachPageBaseUpsert = Omit<CoachPageUpsert, "certificates">;

/**
 * MULTI-COACH PHASE 2B — coach public landing page (self-promoted,
 * NOT in menus — owner answer 3 of the multi-coach design).
 *
 * GET  /api/coach/landing          → own page (or null) + suggested slug
 * PUT  /api/coach/landing          → upsert own page (coach = owner)
 *
 * The landing table (coach_pages) is created by migration 0031 — until
 * the owner runs it, GET returns page:null (the editor shows an empty
 * form and PUT reports the migration as missing).
 *
 * 0046 REVIEW LAW (owner: coaches write their own public content):
 * every coach PUT sends the page to review_status='pending' (review_note
 * cleared, reviewed_at cleared) — the public page stays hidden until the
 * admin approves it in /admin/coach-pages. The ADMIN's own saves keep
 * 'approved' (he IS the reviewer). Before migration 0046 exists the
 * review columns are skipped gracefully (42703 → 503 with a clear
 * message telling the owner to run it).
 *
 * Wave 2A (2026-09-17): the body passes the central zod gate — types +
 * ceilings equal to this editor's own maxLengths (headline 140 · bio
 * 4000 · specialties 80/item, 800 total) + unknown-key stripping; the
 * safe* helpers below stay the SOLE URL/phone/photo policy (zod bounds
 * the media arrays' COUNT only — hostile items are dropped by the
 * policy exactly as before). The legacy invalid_slug class is
 * re-derived verbatim on gate failure; oversize/type violations are
 * the only new 400s.
 */

const SLUG_RE = /^[a-z0-9-]{3,40}$/;

/** 0037 — safe external URL: https only, no spaces, sane length. */
function safeSocialUrl(raw: unknown): string {
  const s = String(raw ?? "").trim().slice(0, 300);
  if (!s) return "";
  if (!/^https:\/\/[^\s]+$/i.test(s)) return "";
  return s;
}

/**
 * 0037 — safe media URL for coach-uploaded PHOTOS: accepts https:// OR a
 * same-origin public-storage path (/storage/v1/object/public/coach-public/…)
 * produced by supabase.storage.getPublicUrl(). Anything else is dropped.
 */
function safeMediaUrl(raw: unknown): string {
  const s = String(raw ?? "").trim().slice(0, 500);
  if (!s) return "";
  if (s.startsWith("/storage/v1/object/public/coach-public/") && !s.includes("..")) return s;
  if (!/^https:\/\/[^\s]+$/i.test(s)) return "";
  return s;
}

/** 0037 — results photos: [{url, caption?}] max 6, https URLs only. */
function safeResultsPhotos(raw: unknown): Array<{ url: string; caption: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((item) => {
      const rec = (item ?? {}) as Record<string, unknown>;
      const url = safeMediaUrl(rec.url);
      const caption = String(rec.caption ?? "").trim().slice(0, 120);
      return url ? { url, caption } : null;
    })
    .filter((x): x is { url: string; caption: string } => x !== null);
}

/**
 * 0049 — coach certificates: [{url, title}] max 8. Same URL law as the
 * 0037 photos (same-origin public bucket path or https://); the title is
 * the certificate NAME the coach typed (≤120 chars). Empty array =
 * optional section skipped — the public page hides it.
 */
function safeCertificates(raw: unknown): Array<{ url: string; title: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 8)
    .map((item) => {
      const rec = (item ?? {}) as Record<string, unknown>;
      const url = safeMediaUrl(rec.url);
      const title = String(rec.title ?? "").trim().slice(0, 120);
      return url ? { url, title } : null;
    })
    .filter((x): x is { url: string; title: string } => x !== null);
}

/**
 * 0037 — coach's own WhatsApp number → NORMALIZED INTERNATIONAL DIGITS
 * (wa.me shape, e.g. 2010XXXXXXXX from 010XXXXXXXX / +20 10… / 20…).
 * Accepts any country: only Egyptian-style local 01XXXXXXXXX is
 * rewritten (→ 20…); everything else is kept as digits. 8–16 digits.
 * Empty string = not set. The number is NEVER rendered on the public
 * landing page — it is served only to the coach's OWN activated
 * clients through /api/my/coach-whatsapp (active-subscription gated).
 */
function safeWhatsappPhone(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 20);
  if (!digits) return "";
  let n = digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (/^0[125]\d{9}$/.test(n)) n = `20${n.slice(1)}`; // EG local 01/02/05xxxxxxxxx
  if (n.length < 8 || n.length > 16) return "";
  return n;
}

export async function GET(request: NextRequest) {
  let user: AuthUser;
  if (authRequired) {
    const auth = await requireCoach(request);
    if (auth instanceof Response) return auth;
    user = auth;
  } else {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("coach_pages")
    .select("*")
    .eq("coach_id", user.id)
    .maybeSingle();

  if (error) {
    const code = (error as { code?: string }).code;
    // 42P01 = table missing (0031 not run yet) → treat as "no page yet"
    if (code !== "42P01" && code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // I-6 (UX-TEST-REPORT-2026-09-21 §5-6 — owner «ابدأ التحسينات»
  // 2026-09-22): the FIRST-TIME suggested slug derives from the coach's
  // profile name when it carries a latin core (coachSlugFromName — the
  // ONE-SLUG-LAW module), with a bounded uniqueness walk (base → -2/-3/-4)
  // against coach_pages. An Arabic-only name (or an exhausted walk) keeps
  // the legacy coach-<id6> net. The coach edits the suggestion freely and
  // PUT still enforces SLUG_RE + the slug_taken 409.
  let suggested = `coach-${user.id.slice(0, 6).toLowerCase()}`;
  if (!data) {
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const base = coachSlugFromName(prof?.full_name ?? "");
    if (base) {
      let candidate = base;
      for (let n = 2; n <= 4; n++) {
        const { count } = await supabaseAdmin
          .from("coach_pages")
          .select("slug", { count: "exact", head: true })
          .eq("slug", candidate);
        if (!count) break;
        candidate = `${base}-${n}`;
      }
      suggested = candidate;
    }
  }

  return NextResponse.json({
    page: data ?? null,
    suggestedSlug: data?.slug ?? suggested,
  });
}

export async function PUT(request: NextRequest) {
  let user: AuthUser;
  if (authRequired) {
    const auth = await requireCoach(request);
    if (auth instanceof Response) return auth;
    user = auth;
  } else {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  // Wave 2A zod gate — legacy invalid_slug re-derived verbatim on failure.
  const parsed = coachLandingBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = (body ?? {}) as Record<string, unknown>;
    if (!SLUG_RE.test(String(raw.slug ?? "").trim().toLowerCase())) {
      return NextResponse.json(
        { error: "invalid_slug", message: "الرابط يجب أن يكون 3-40 حرفًا إنجليزيًا صغيرًا أو أرقامًا أو شرطة (-)" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const rawBody = parsed.data;
  const slug = rawBody.slug.trim().toLowerCase();
  const headline = (rawBody.headline ?? "").slice(0, 140);
  const bio = (rawBody.bio ?? "").slice(0, 4000);
  // specialties arrive as an array of strings → stored one-per-line
  const specialties = Array.isArray(rawBody.specialties)
    ? rawBody.specialties.map((s: string) => s.slice(0, 80)).filter(Boolean).join("\n").slice(0, 800)
    : (rawBody.specialties ?? "").slice(0, 800);
  // English copy (migration 0032) — optional, same limits as the AR fields
  const headlineEn = (rawBody.headline_en ?? "").slice(0, 140);
  const bioEn = (rawBody.bio_en ?? "").slice(0, 4000);
  const specialtiesEn = Array.isArray(rawBody.specialties_en)
    ? rawBody.specialties_en.map((s: string) => s.slice(0, 80)).filter(Boolean).join("\n").slice(0, 800)
    : (rawBody.specialties_en ?? "").slice(0, 800);
  const isPublished = rawBody.is_published === true;
  // 0037 — public profile enrichment
  const photoUrl = safeMediaUrl(rawBody.photo_url);
  const resultsPhotos = safeResultsPhotos(rawBody.results_photos);
  const certificates = safeCertificates(rawBody.certificates);
  const instagramUrl = safeSocialUrl(rawBody.instagram_url);
  const facebookUrl = safeSocialUrl(rawBody.facebook_url);
  const tiktokUrl = safeSocialUrl(rawBody.tiktok_url);
  const youtubeUrl = safeSocialUrl(rawBody.youtube_url);
  const whatsappPhone = safeWhatsappPhone(rawBody.whatsapp_phone);

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "invalid_slug", message: "الرابط يجب أن يكون 3-40 حرفًا إنجليزيًا صغيرًا أو أرقامًا أو شرطة (-)" },
      { status: 400 },
    );
  }

  // The owner (admin) might edit his page too — both roles pass requireCoach.
  // Guard the profile role anyway: only staff may own a landing page.
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!prof || (prof.role !== "coach" && prof.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden — staff only" }, { status: 403 });
  }

  // 0046 REVIEW LAW — a coach edit always re-enters moderation. The admin
  // IS the reviewer, so his own saves publish straight away.
  const isAdminSave = (prof as { role: string }).role === "admin";
  const reviewFields = {
    review_status: isAdminSave ? "approved" : "pending",
    review_note: "",
    reviewed_at: isAdminSave ? new Date().toISOString() : null,
  };

  // 0049 SOFT-ROLL LAW: the certificates column may not exist yet (owner
  // hasn't run migration 0049). First attempt includes it; on a
  // missing-column failure (PostgREST PGRST204 / Postgres 42703) retry
  // ONCE without certificates — every other field saves exactly as
  // before, certificates are simply not persisted until the migration
  // runs. Zero disruption between deploy and migration.
  const basePayload: CoachPageBaseUpsert = {
    coach_id: user.id,
    slug,
    headline,
    bio,
    specialties,
    headline_en: headlineEn,
    bio_en: bioEn,
    specialties_en: specialtiesEn,
    is_published: isPublished,
    photo_url: photoUrl,
    results_photos: resultsPhotos,
    instagram_url: instagramUrl,
    facebook_url: facebookUrl,
    tiktok_url: tiktokUrl,
    youtube_url: youtubeUrl,
    whatsapp_phone: whatsappPhone,
    updated_at: new Date().toISOString(),
    ...reviewFields,
  };

  let { data, error } = await supabaseAdmin
    .from("coach_pages")
    .upsert({ ...basePayload, certificates }, { onConflict: "coach_id" })
    .select()
    .maybeSingle();

  const firstCode = (error as { code?: string } | null)?.code;
  if (error && (firstCode === "PGRST204" || firstCode === "42703")) {
    ({ data, error } = await supabaseAdmin
      .from("coach_pages")
      .upsert(basePayload, { onConflict: "coach_id" })
      .select()
      .maybeSingle());
  }

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "slug_taken", message: "هذا الرابط مستخدم بالفعل — اختر رابطًا آخر" },
        { status: 409 },
      );
    }
    if (code === "42P01") {
      return NextResponse.json(
        { error: "migration_missing", message: "جدول الصفحات غير موجود — شغّل هجرة 0031 في Supabase أولًا" },
        { status: 503 },
      );
    }
    if (code === "42703") {
      // Undefined column → 0032 EN columns, 0037 enrichment or 0046 review
      // columns missing.
      return NextResponse.json(
        { error: "migration_missing", message: "أعمدة الصفحة غير موجودة — شغّل هجرات 0032 و 0037 و 0046 و 0049 في Supabase أولًا (raw links في المحادثة)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 0049 — a coach save re-entered moderation → ring the ADMIN's bell so
  // the review queue is discovered without polling /admin/coach-pages.
  // One unread reminder PER COACH at a time (dedupe by type suffix) keeps
  // things quiet while a coach iterates on drafts; once read, the next
  // save re-notifies. Rows are targeted at admin profiles (private —
  // other coaches see nothing); falls back to a staff broadcast if no
  // admin profile exists. Best-effort: never fails the coach's save.
  if (!isAdminSave) {
    const notifType = `coach_page_pending:${user.id}`;
    const coachName =
      ((prof as { full_name?: string | null } | null)?.full_name || "").trim() || "مدرب";
    const { data: unread } = await supabaseAdmin
      .from("admin_notifications")
      .select("id")
      .eq("type", notifType)
      .eq("read", false)
      .limit(1);
    if (!unread || unread.length === 0) {
      const { data: admins } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(5);
      const targets = ((admins ?? []) as Array<{ id: string }>).map((a) => a.id);
      const rows = (targets.length > 0 ? targets : [null]).map((tid) => ({
        type: notifType,
        title: "صفحة مدرب بانتظار مراجعتك",
        body: `«${coachName}» حدّث صفحته العامة — محتاجة موافقة قبل ظهورها للجميع.`,
        link: "/admin/coach-pages",
        target_role: "admin",
        target_coach_id: tid,
        payload: { coach_name: coachName },
        read: false,
      }));
      const { error: notifErr } = await supabaseAdmin
        .from("admin_notifications")
        .insert(rows);
      if (notifErr) {
        console.error("[coach/landing] admin notification failed:", notifErr.message);
      }
    }
  }

  // CACHE-POLICY-AUDIT 2026-10-22: the public landing mirrors ride
  // ISR 86400 + CF edge 43200 with no other invalidation — refresh both
  // language mirrors for THIS slug right after the successful write.
  // Fail-soft (the helper never throws): a coach save going to
  // moderation hides the old public render immediately, and an admin
  // save (self-approved) publishes immediately — the 0046 review law's
  // intent, no longer leaking through the stacked TTLs. The old slug
  // on a rename self-heals inside the 24h ISR window (unchanged).
  const cacheRefresh = await revalidateCoachLanding(slug);

  return NextResponse.json({ page: data, cache_refresh: cacheRefresh });
}
