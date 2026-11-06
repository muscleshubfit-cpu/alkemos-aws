"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { cn } from "@/lib/utils";
import { useNav, type View } from "@/hooks/use-nav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { openEvoFloatingChat } from "@/lib/evo-chat-events";
import { ShieldCheck, Users } from "lucide-react";

/**
 * AppLayout — the shell for ALL authenticated surfaces.
 *
 * 2026-08-30 OWNER DIRECTIVE — STAFF CONSOLE IDENTITY:
 * «اعاده تنسيق صفحة الادمن وصفحة المدرب لانها حاليا بتتعرض كأنهم اعضاء»
 * The old shell rendered staff and members with the IDENTICAL look
 * (member-blue nav, plain sidebar, welcome line) — the admin console
 * and coach console now carry their own identity: a dark console banner
 * (🛡 لوحة الأدمن / 👥 لوحة المدرب) with a role chip, above the content
 * on BOTH desktop and mobile, section-labelled sidebar, staff-colored
 * active states: admin = dark #1d1d1f, coach = violet #8b5cf6 (member
 * blue #0071e3 untouched).
 *
 * PHASE 142 (owner: «يجب الفصل بين ادمن / مدرب موقع / مدرب مستقل»):
 * THREE staff consoles, no shared B2B money nav —
 *  - ADMIN on (app) surfaces: the client-management tools only (the
 *    per-client manager /coach/<id> + his public page + client support)
 *    plus ONE link back to his /admin console. The old admin block
 *    (blog-admin, admin-referrals, admin-payments, 4 extra links,
 *    admin-home button) DUPLICATED the AdminShell sidebar — removed;
 *    the admin manages the site from /admin, not from here.
 *  - SITE COACH (coach_kind='site'): B2C follow-up console — his
 *    assigned site members, public page, client support, coach help.
 *    NO wallet / affiliate / ads / invite (that is B2B money — a site
 *    coach is staff, not a paying partner).
 *  - B2B COACH (independent partner): keeps the full business nav
 *    (wallet, affiliate, ads, invite) exactly as before.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const { profile, isCoach, isAdmin, isSiteCoach } = useAuth();
  const { view, navigate } = useNav();
  const isAr = lang === "ar";

  type NavItem = { to: View; label: string; emoji: string; action?: "evo-chat" };
  const clientNav: NavItem[] = [
    { to: "dashboard", label: t("nav.dashboard"), emoji: "🏠" },
    // EVO CHAT SURFACE LAW (2026-08-27): opens the floating widget — the
    // /chat page no longer exists (next.config redirects it to /evo).
    { to: "chat", label: t("nav.coach"), emoji: "💬", action: "evo-chat" },
    { to: "questionnaires", label: t("nav.questionnaires"), emoji: "📋" },
    { to: "progress", label: t("nav.progress"), emoji: "📊" },
    { to: "plans", label: t("nav.plans"), emoji: "📄" },
    { to: "support", label: t("nav.support"), emoji: "🔧" },
    { to: "referral", label: t("nav.referral"), emoji: "🎁" },
    { to: "memberships", label: t("nav.pricing"), emoji: "👑" },
  ];
  // STAFF NAV — B2B COACH (independent partner): clients first — the
  // questionnaire review queue inside each client page is the coach's
  // entry point (owner directive: نقطة اطلاع الكوتش على الاستبيانات).
  const coachNav: NavItem[] = [
    { to: "coach", label: t("nav.clients"), emoji: "👥" },
    // Phase 51 (owner: «صفحته العامة مش موجودة فى الداشبورد، موجودة فى
    // القائمة الرئيسية فقط») — the public-page editor moves INTO the
    // staff sidebar. Coaches AND the admin may own a landing page
    // (admin saves auto-approve — he IS the reviewer).
    { to: "coach-landing", label: isAr ? "صفحتي العامة" : "My Public Page", emoji: "🌐" },
    { to: "coach-support", label: t("nav.support.coach"), emoji: "🔧" },
    // COACH WALLET (0035): the B2B coach pays THE SITE a monthly fixed fee
    // per client from this balance — top-up via InstaPay / Vodafone
    // Cash / PayPal + receipt → admin review. Activation debits it.
    { to: "coach-wallet", label: isAr ? "محفظتي" : "My Wallet", emoji: "👛" },
    // PHASE 67 (owner decree 2026-09-01): a referred COACH is part of the
    // affiliate system — every client activation he pays for earns his
    // inviter 20%. This is HIS earnings mirror (staff version of /referral).
    { to: "coach-affiliate", label: isAr ? "أفيليت المدربين" : "Coach Affiliate", emoji: "🤝" },
    // «أعلن معنا» (0037): fixed-duration ad packages — the featured card
    // runs on the homepage «مدربون مميزون» strip. Wallet debited.
    { to: "coach-ads", label: isAr ? "أعلن معنا" : "Advertise", emoji: "📣" },
    // «دعم المدربين» (0037): the coach → site support channel, separate
    // from the site's client support (client support belongs to coach).
    { to: "coach-help", label: isAr ? "دعم المدربين" : "Coach Support", emoji: "🛟" },
  ];
  // PHASE 142 — SITE COACH nav: B2C follow-up console. NO wallet /
  // affiliate / ads — those are B2B-partner money surfaces (a site coach
  // is staff following up site members; billing never touches him).
  const siteCoachNav: NavItem[] = [
    { to: "coach", label: isAr ? "أعضائي للمتابعة" : "My members", emoji: "🎯" },
    { to: "coach-landing", label: isAr ? "صفحتي العامة" : "My Public Page", emoji: "🌐" },
    { to: "coach-support", label: t("nav.support.coach"), emoji: "🔧" },
    { to: "coach-help", label: isAr ? "دعم المدربين" : "Coach Support", emoji: "🛟" },
  ];
  // PHASE 142 — ADMIN nav inside (app) surfaces: ONLY the client
  // management tools (the /coach admin-mode listing + per-client
  // manager). Everything else lives in HIS console (/admin, AdminShell)
  // — one link back replaces the old duplicated admin block.
  const adminAppNav: NavItem[] = [
    { to: "coach", label: t("nav.clients"), emoji: "👥" },
    { to: "coach-landing", label: isAr ? "صفحتي العامة" : "My Public Page", emoji: "🌐" },
    { to: "coach-support", label: t("nav.support.coach"), emoji: "🔧" },
  ];
  const staffNav = isAdmin
    ? adminAppNav
    : isSiteCoach
      ? siteCoachNav
      : coachNav;
  const nav = isCoach ? staffNav : clientNav;

  // ── STAFF CONSOLE IDENTITY (2026-08-30 · Phase 142 split) ──
  const consoleMeta = isAdmin
    ? {
        title: isAr ? "لوحة الأدمن" : "Admin Console",
        sub: isAr ? "إدارة كاملة للموقع" : "Full site management",
        chip: isAr ? "أدمن" : "Admin",
        // admin accent = console dark
        activeCls: "bg-[#1d1d1f] text-white",
        blockCls: "bg-[#1d1d1f]",
        bannerCls: "border-[#1d1d1f] bg-[#1d1d1f]",
        icon: <ShieldCheck className="h-5 w-5" />,
      }
    : isSiteCoach
      ? {
          title: isAr ? "لوحة مدرب الموقع" : "Site Coach Console",
          sub: isAr ? "متابعة أعضاء الموقع المعيّنين لك" : "Follow-up of your assigned site members",
          chip: isAr ? "مدرب موقع" : "Site coach",
          // site-coach accent = green (B2C follow-up staff)
          activeCls: "bg-[#248a3d] text-white",
          blockCls: "bg-[#248a3d]",
          bannerCls: "border-[#248a3d] bg-[#248a3d]",
          icon: <Users className="h-5 w-5" />,
        }
      : {
          title: isAr ? "لوحة المدرب المستقل" : "Coach Console",
          sub: isAr ? "إدارة عملائك وأعمالك" : "Manage your clients & business",
          chip: isAr ? "مدرب مستقل" : "B2B coach",
          // B2B coach accent = violet
          activeCls: "bg-[#8b5cf6] text-white",
          blockCls: "bg-[#8b5cf6]",
          bannerCls: "border-[#8b5cf6] bg-[#8b5cf6]",
          icon: <Users className="h-5 w-5" />,
        };

  // Sidebar section labels (staff only): business surfaces vs site admin.
  const sectionLabel = (label: string) => (
    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
      {label}
    </p>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1d1d1f]">
      {!isSupabaseConfigured && (
        <div className="bg-[#1d1d1f] px-3 py-1.5 text-center text-xs font-normal text-white">
          {isAr
            ? "وضع تجريبي — لا تتوفر بيانات Supabase. تُخزَّن البيانات محليًا في هذا المتصفح فقط."
            : "Demo mode — no Supabase credentials. Data stored locally only."}
        </div>
      )}
      <SiteHeader variant="app" />

      {/* STAFF CONSOLE BANNER — the admin/coach instantly knows he is in
          HIS work surface, not the member app. */}
      {isCoach && (
        <div
          className={cn(
            "border-b",
            consoleMeta.bannerCls,
          )}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
            <div className="flex items-center gap-2.5 text-white">
              {consoleMeta.icon}
              <div className="leading-tight">
                <p className="text-sm font-bold">{consoleMeta.title}</p>
                <p className="text-[11px] text-white/70">{consoleMeta.sub}</p>
              </div>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white">
              {profile?.full_name || consoleMeta.chip}
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-12">
        {/* Mobile: Large navigation buttons at top (after welcome) */}
        {/* Desktop: sidebar nav on the left */}
        <div className="flex gap-8 md:gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden w-48 shrink-0 md:block">
            <nav className="sticky top-24 space-y-1">
              {/* Console identity block (staff) */}
              {isCoach && (
                <div
                  className={cn(
                    "mb-2 rounded-xl p-3 text-white",
                    consoleMeta.blockCls,
                  )}
                >
                  <div className="flex items-center gap-2">
                    {consoleMeta.icon}
                    <p className="text-xs font-bold">{consoleMeta.title}</p>
                  </div>
                </div>
              )}

              {/* Section: the staff console's items (Phase 142: one nav
                  per role — no mixed admin+coach blocks here anymore). */}
              {isCoach && sectionLabel(isAr ? "العملاء والخدمة" : "Clients & service")}
              {(isCoach ? staffNav : nav).map((item) => {
                const active = view === item.to;
                return (
                  <button
                    key={item.to}
                    onClick={() =>
                      item.action === "evo-chat" ? openEvoFloatingChat() : navigate(item.to)
                    }
                    className={cn(
                      "block w-full cursor-pointer rounded-lg px-3 py-2 text-start text-sm font-normal transition-colors",
                      active
                        ? isCoach
                          ? cn(consoleMeta.activeCls, "font-medium")
                          : "bg-[#f5f5f7] font-medium text-[#1d1d1f]"
                        : "text-[#6e6e73] hover:text-[#1d1d1f]",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* PHASE 142 — the admin's ONE way back to his console: the
                  old admin block (blog/referrals/payments/4 links/home)
                  duplicated the AdminShell sidebar; everything lives at
                  /admin now. Site/B2B coaches never see this. */}
              {isAdmin && (
                <>
                  {sectionLabel(isAr ? "إدارة الموقع" : "Site management")}
                  <a
                    href="/admin/dashboard"
                    className="block w-full rounded-lg border border-[#1d1d1f]/20 px-3 py-2 text-start text-sm font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
                  >
                    🏛 {isAr ? "الرئيسية — لوحة الأدمن" : "Admin home"}
                  </a>
                </>
              )}
            </nav>
          </aside>

          {/* Main content */}
          <main id="main-content" className="min-w-0 flex-1">
            {/* Mobile: Large nav buttons at top of every page */}
            <div className="mb-8 md:hidden">
              {/* Welcome message — members only; staff already have the
                  console banner above (no duplicate greeting). */}
              {!isCoach && profile && (
                <p className="mb-4 text-sm font-normal text-[#6e6e73]">
                  {isAr ? "أهلًا" : "Welcome"}, <span className="font-medium text-[#1d1d1f]">{profile.full_name}</span>
                </p>
              )}
              {/* Large nav buttons — 2 columns, scrollable */}
              <div className="grid grid-cols-2 gap-3 overflow-x-auto pb-2">
                {nav.map((item) => {
                  const active = view === item.to;
                  return (
                    <button
                      key={item.to}
                      onClick={() =>
                        item.action === "evo-chat" ? openEvoFloatingChat() : navigate(item.to)
                      }
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? isCoach
                            ? consoleMeta.activeCls
                            : "bg-[#0071e3] text-white"
                          : "bg-[#f5f5f7] text-[#1d1d1f]",
                      )}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
                {isAdmin && (
                  <a
                    href="/admin/dashboard"
                    className="flex items-center gap-2 rounded-2xl bg-[#1d1d1f] px-4 py-3 text-sm font-medium text-white transition-colors"
                  >
                    <span className="text-base">🏛</span>
                    <span className="truncate">{isAr ? "الرئيسية — لوحة الأدمن" : "Admin home"}</span>
                  </a>
                )}
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
