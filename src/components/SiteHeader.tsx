"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { openEvoFloatingChat } from "@/lib/evo-chat-events";
import {
  Menu,
  X,
  Home,
  FileText,
  Calculator,
  Dumbbell,
  Utensils,
  LayoutDashboard,
  ClipboardList,
  LineChart,
  MessageCircle,
  LifeBuoy,
  Gift,
  LogIn,
  LogOut,
  ShieldCheck,
  Bot,
  ChevronRight,
  ChevronDown,
  Bell,
  User,
  Sparkles,
  Users,
  Globe,
  Droplet,
  Target,
  Activity,
  Pizza,
  Megaphone,
  Wallet,
  ShieldQuestion,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeImg } from "@/components/ThemeImg";
import { useI18n } from "@/lib/i18n";
import { useNav, type View } from "@/hooks/use-nav";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";

// Wrapper for header — smaller bell icon
function NotificationBellHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="NotificationBellHeader">
      {isAdmin ? <AdminNotificationBell /> : <NotificationBell />}
    </div>
  );
}

/**
 * Site header — Apple-style clean bar.
 *
 * Layout: [MENU] [MARK] ...... [THEME] [LANG] [LOGIN/LOGOUT] [BELL]
 *
 * Phase 138 (owner directive 2026-09-07): the logo is the helmet MARK
 * only (no wordmark), anchored at the start side next to the menu button.
 * All utility buttons (theme / language / login / bell) are grouped
 * together on the end side. The hamburger opens a slide-in drawer for
 * full navigation.
 */

// ─── Menu data model (module scope — W1-4a/audit P-01, 2026-10-02) ────────
// The drawer's navigation arrays used to be rebuilt inside the component on
// EVERY render — ~11 groups × ~60 items re-allocated on each re-render
// (audit P-01: the context render storm re-rendered the header at every SPA
// navigation). The STATIC definition now lives at module scope — both
// languages, both href variants — and the component resolves the visible
// variant through a useMemo keyed ONLY on lang/role flags (stable across
// navigations). Item actions are DATA (a navigate() view target or the EVO
// widget flag), never closures, so the arrays never depend on `navigate`
// (whose identity changes with the pathname for the AR-mirror law).

type MenuItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  /** navigate() view target — resolved by handleItemClick at click time. */
  nav?: View;
  /** Opens the floating EVO widget (openEvoFloatingChat) at click time. */
  evo?: boolean;
};

type MenuGroup = {
  id: string;
  title: string;
  items: MenuItem[];
};

/** Static drawer item definition — both languages + both href variants. */
type MenuItemDef = {
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  hrefAr?: string;
  hrefEn?: string;
  nav?: View;
  evo?: boolean;
  /** ROLE SURFACE LAW: hidden from platform staff (coach/admin). */
  hideForCoach?: boolean;
  /** Admin sees the CMS surface instead of the public page. */
  adminHref?: string;
};

/** Static drawer group definition — `audience` decides visibility. */
type MenuGroupDef = {
  id: string;
  titleAr: string;
  titleEn: string;
  items: MenuItemDef[];
  audience:
    | "all" // every visitor, logged in or not
    | "nonStaff" // everyone EXCEPT platform staff (ROLE SURFACE LAW)
    | "member" // logged-in non-staff member
    | "b2bCoach" // logged-in B2B coach
    | "siteCoach" // logged-in site coach
    | "admin"; // logged-in admin
};

// Phase 202 (owner order 2026-09-15: «Header: اجعل الـNavigation واضحًا
// للخدمات الأساسية التي يأتي الزائر لاستخدامها: Training / Nutrition /
// Tools / AI / Coaching، مع تنظيم الخدمات الثانوية مثل For Coaches
// وAffiliate في مكان مناسب دون أن تهيمن على الواجهة»): the drawer is
// organised SERVICE-FIRST (the five core services a visitor comes to USE).
// Secondary services (Memberships / Affiliate / For Coaches) live in the
// slim «More» group + the footer — reachable, never dominant. Legal & basic
// pages (Privacy, Terms, About, FAQ, Contact) are intentionally NOT in the
// header — footer only (per Owner directive 2026-08-25).
const DRAWER_GROUP_DEFS: MenuGroupDef[] = [
  // Group 1: Home
  {
    id: "home",
    titleAr: "",
    titleEn: "",
    audience: "all",
    items: [
      { labelAr: "الرئيسية", labelEn: "Home", icon: Home, nav: "landing" },
    ],
  },
  // Group 2: Training — the training content services (exercises hub,
  // muscle-group hub, equipment hub, programs).
  {
    id: "training",
    titleAr: "التدريب",
    titleEn: "Training",
    audience: "all",
    items: [
      { labelAr: "مكتبة التمارين", labelEn: "Exercises", icon: Dumbbell, hrefAr: "/ar/exercises", hrefEn: "/exercises" },
      { labelAr: "حسب المجموعة العضلية", labelEn: "By Muscle Group", icon: Target, hrefAr: "/ar/muscles/chest", hrefEn: "/muscles/chest" },
      // Access-point fix (2026-09-14): the equipment hubs had ZERO nav
      // entries — the sample bodyweight hub joins the drawer (every
      // /equipment/[type] page cross-links the rest).
      { labelAr: "حسب المعدات", labelEn: "By Equipment", icon: Dumbbell, hrefAr: "/ar/equipment/bodyweight", hrefEn: "/equipment/bodyweight" },
      { labelAr: "برامج التدريب", labelEn: "Programs", icon: ClipboardList, hrefAr: "/ar/programs", hrefEn: "/programs" },
    ],
  },
  // Group 3: Nutrition — the nutrition content services (foods hub,
  // meal planner, ready-made diet plans, collections hub).
  {
    id: "nutrition",
    titleAr: "التغذية",
    titleEn: "Nutrition",
    audience: "all",
    items: [
      { labelAr: "مكتبة الأطعمة", labelEn: "Foods", icon: Utensils, hrefAr: "/ar/foods", hrefEn: "/foods" },
      { labelAr: "مخطط الوجبات", labelEn: "Meal Planner", icon: Pizza, hrefAr: "/ar/meal-planner", hrefEn: "/meal-planner" },
      // §12.33: the ready-made diet plans join the content libraries
      // under the owner's name.
      { labelAr: "مكتبة الخطط الغذائية الجاهزة", labelEn: "Diet Plans", icon: Pizza, hrefAr: "/ar/diet-plan", hrefEn: "/diet-plan" },
      // Phase SEO-GEO-1 (2026-09-08): the collections hub entry point.
      { labelAr: "مجموعات الأطعمة", labelEn: "Food Collections", icon: Pizza, hrefAr: "/ar/collections/high-protein-foods", hrefEn: "/collections/high-protein-foods" },
    ],
  },
  // Group 4: Tools (dropdown — expandable to show the 5 standalone tools
  // + the hub link). The AI planners live in the AI group below (they are
  // AI services — §12.31/§12.32 naming preserved).
  // Per Owner directive 2026-08-25: tools must be a dropdown menu showing
  // all individual tools, NOT a single link to /tools.
  // Access-point fix (2026-09-14): every tool href is locale-aware.
  {
    id: "tools",
    titleAr: "الأدوات",
    titleEn: "Tools",
    audience: "all",
    items: [
      { labelAr: "حاسبة مؤشر كتلة الجسم", labelEn: "BMI Calculator", icon: Activity, hrefAr: "/ar/tools/bmi-calculator", hrefEn: "/tools/bmi-calculator" },
      { labelAr: "حاسبة نسبة الدهون", labelEn: "Body Fat Calculator", icon: Target, hrefAr: "/ar/tools/body-fat-calculator", hrefEn: "/tools/body-fat-calculator" },
      { labelAr: "حاسبة السعرات", labelEn: "Calorie Calculator", icon: Calculator, hrefAr: "/ar/tools/calorie-calculator", hrefEn: "/tools/calorie-calculator" },
      { labelAr: "حاسبة الماكروز", labelEn: "Macro Calculator", icon: Calculator, hrefAr: "/ar/tools/macro-calculator", hrefEn: "/tools/macro-calculator" },
      { labelAr: "متتبع شرب الماء", labelEn: "Water Tracker", icon: Droplet, hrefAr: "/ar/tools/water-tracker", hrefEn: "/tools/water-tracker" },
      { labelAr: "كل الأدوات", labelEn: "All Tools", icon: Calculator, hrefAr: "/ar/tools", hrefEn: "/tools" },
    ],
  },
  // Group 5: AI — the AI services (both planners + EVO).
  // ROLE SURFACE LAW: EVO joins Coaching/Memberships in the
  // visitor-facing funnel — staff never see these entries.
  {
    id: "ai",
    titleAr: "الذكاء الاصطناعي",
    titleEn: "AI",
    audience: "all",
    items: [
      // §12.31: the AI meal planner under its full unified name.
      { labelAr: "مخطط الوجبات بالذكاء الاصطناعي", labelEn: "AI Meal Planner", icon: Sparkles, hrefAr: "/ar/ai-meal-planner", hrefEn: "/ai-meal-planner" },
      // §12.32: the AI workout planner.
      { labelAr: "مخطط التمارين بالذكاء الاصطناعي", labelEn: "AI Workout Planner", icon: Sparkles, hrefAr: "/ar/ai-workout-planner", hrefEn: "/ai-workout-planner" },
      // Phase 216 (P2-2 — owner decision 2026-09-16 «نفّذ الإصلاح»):
      // supersedes the 2026-09-14 freeze — the entry is language-aware
      // like the logo and the footer (SEO-GEO-6.4).
      { labelAr: "EVO AI Coach", labelEn: "EVO AI Coach", icon: Bot, hrefAr: "/ar/evo", hrefEn: "/evo", hideForCoach: true },
    ],
  },
  // Group 6: Coaching — a core service, its own drawer entry.
  // ROLE SURFACE LAW (2026-08-29): hidden from platform staff — the
  // owner/coach must not browse his own sales funnel in the header.
  {
    id: "coaching",
    titleAr: "",
    titleEn: "",
    audience: "nonStaff",
    items: [
      { labelAr: "التدريب الأونلاين", labelEn: "Coaching", icon: Users, hrefAr: "/ar/coaching", hrefEn: "/coaching" },
    ],
  },
  // Group 7: More services — the SECONDARY surfaces (Memberships,
  // Affiliate, For Coaches): reachable but never dominant (owner order
  // 2026-09-15). Staff never see the funnel entries.
  {
    id: "more",
    titleAr: "خدمات أخرى",
    titleEn: "More",
    audience: "nonStaff",
    items: [
      { labelAr: "العضويات", labelEn: "Memberships", icon: Sparkles, hrefAr: "/ar/memberships", hrefEn: "/memberships" },
      // §12.53 item 11 (2026-09-16): locale-aware — AR mirror exists.
      { labelAr: "برنامج الأفلييت (الشركاء)", labelEn: "Affiliate Program", icon: Gift, hrefAr: "/ar/affiliate", hrefEn: "/affiliate" },
      { labelAr: "للمدربين", labelEn: "For Coaches", icon: Briefcase, hrefAr: "/ar/for-coaches", hrefEn: "/for-coaches" },
    ],
  },
  // Group 8: Resources — the remaining content verticals (comparisons,
  // blog). The library entries moved into their service groups above.
  {
    id: "resources",
    titleAr: "المصادر",
    titleEn: "Resources",
    audience: "all",
    items: [
      // Access-point fix (2026-09-14): the /compare vertical entry.
      { labelAr: "المقارنات", labelEn: "Comparisons", icon: LineChart, hrefAr: "/ar/compare", hrefEn: "/compare" },
      // Blog link: admin manages the CMS (/admin/blog); everyone else —
      // including future coach accounts — reads the public blog.
      { labelAr: "المدونة", labelEn: "Blog", icon: FileText, hrefAr: "/ar/blog", hrefEn: "/blog", adminHref: "/admin/blog" },
    ],
  },
  // Group: Account (authenticated member items)
  {
    id: "account",
    titleAr: "حسابي",
    titleEn: "My Account",
    audience: "member",
    items: [
      { labelAr: "لوحة التحكم", labelEn: "Dashboard", icon: LayoutDashboard, nav: "dashboard" },
      { labelAr: "خططي", labelEn: "My Plans", icon: FileText, nav: "plans" },
      { labelAr: "تقدمي", labelEn: "My Progress", icon: LineChart, nav: "progress" },
      // EVO CHAT SURFACE LAW: opens the floating widget — never a /chat page.
      { labelAr: "مدرب EVO", labelEn: "EVO Coach", icon: Bot, evo: true },
      { labelAr: "الاستبيانات", labelEn: "Questionnaires", icon: ClipboardList, nav: "questionnaires" },
      { labelAr: "الإحالات", labelEn: "Referrals", icon: Gift, nav: "referral" },
      { labelAr: "الدعم", labelEn: "Support", icon: LifeBuoy, nav: "support" },
    ],
  },
  // Group: Coach work items — PHASE 142 role-aware split (owner:
  // «يجب الفصل بين ادمن / مدرب موقع / مدرب مستقل»):
  //   - B2B COACH: the FULL business set, INCLUDING wallet + affiliate —
  //     they existed only in the app sidebar before, so a coach browsing
  //     public pages could never reach them (the «اختفاء ازرار» part).
  //   - SITE COACH: B2C follow-up items only — no money surfaces.
  //   - ADMIN: NO coach group at all — one link to HIS console (below).
  {
    id: "coach",
    titleAr: "إدارة المدرب",
    titleEn: "Coach Admin",
    audience: "b2bCoach",
    items: [
      { labelAr: "لوحة المدرب", labelEn: "Coach Dashboard", icon: LayoutDashboard, nav: "coach" },
      { labelAr: "صفحتي العامة", labelEn: "My Public Page", icon: Globe, nav: "coach-landing" },
      // 0035 wallet — the B2B partner's money rail (was drawer-missing).
      { labelAr: "محفظتي", labelEn: "My Wallet", icon: Wallet, nav: "coach-wallet" },
      { labelAr: "أفيليت المدربين", labelEn: "Coach Affiliate", icon: Gift, nav: "coach-affiliate" },
      // 0043 TERMINOLOGY: site-membership payment requests are admin-only;
      // the coach's B2B money surface is his client page + wallet.
      { labelAr: "دعم العملاء", labelEn: "Client Support", icon: LifeBuoy, nav: "coach-support" },
      // 0037 — «أعلن معنا» + the dedicated coach→site support channel.
      { labelAr: "أعلن معنا", labelEn: "Advertise with us", icon: Megaphone, nav: "coach-ads" },
      { labelAr: "دعم المدربين", labelEn: "Coach Support", icon: ShieldQuestion, nav: "coach-help" },
    ],
  },
  {
    id: "coach",
    titleAr: "لوحة مدرب الموقع",
    titleEn: "Site Coach",
    audience: "siteCoach",
    items: [
      { labelAr: "أعضائي للمتابعة", labelEn: "My members", icon: LayoutDashboard, nav: "coach" },
      { labelAr: "صفحتي العامة", labelEn: "My Public Page", icon: Globe, nav: "coach-landing" },
      { labelAr: "دعم العملاء", labelEn: "Client Support", icon: LifeBuoy, nav: "coach-support" },
      { labelAr: "دعم المدربين", labelEn: "Coach Support", icon: ShieldQuestion, nav: "coach-help" },
    ],
  },
  // Group: ADMIN — PHASE 142: the old 5-item «إدارة المنصة» group
  // (leads / saved / site-memberships / referrals / blog) duplicated the
  // /admin sidebar. ONE entry now: his console — everything lives there.
  {
    id: "admin",
    titleAr: "إدارة المنصة",
    titleEn: "Platform Admin",
    audience: "admin",
    items: [
      { labelAr: "لوحة الأدمن", labelEn: "Admin Console", icon: ShieldCheck, hrefAr: "/admin/dashboard", hrefEn: "/admin/dashboard" },
    ],
  },
];

// ─── DESKTOP SERVICE NAV (Phase 202 — owner order 2026-09-15:
// «Header: اجعل الـNavigation واضحًا للخدمات الأساسية التي يأتي الزائر
// لاستخدامها»). The five core services render as visible navbar entries
// (dropdown for the four families with children, a direct link for
// Coaching) from lg up; the drawer keeps the FULL menu (including the
// secondary «More» services) on every size. ROLE SURFACE LAW: Coaching
// stays hidden from platform staff; EVO keeps its exact /evo path (owner
// directive 2026-09-14).
type ServiceNavItemDef = { labelAr: string; labelEn: string; hrefAr: string; hrefEn: string };
type ServiceNavDef = {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  hrefAr?: string;
  hrefEn?: string;
  items?: ServiceNavItemDef[];
};

const SERVICE_NAV_DEFS: ServiceNavDef[] = [
  {
    id: "training",
    labelAr: "التدريب",
    labelEn: "Training",
    icon: Dumbbell,
    items: [
      { labelAr: "مكتبة التمارين", labelEn: "Exercises", hrefAr: "/ar/exercises", hrefEn: "/exercises" },
      { labelAr: "حسب المجموعة العضلية", labelEn: "By Muscle Group", hrefAr: "/ar/muscles/chest", hrefEn: "/muscles/chest" },
      { labelAr: "حسب المعدات", labelEn: "By Equipment", hrefAr: "/ar/equipment/bodyweight", hrefEn: "/equipment/bodyweight" },
      { labelAr: "برامج التدريب", labelEn: "Programs", hrefAr: "/ar/programs", hrefEn: "/programs" },
    ],
  },
  {
    id: "nutrition",
    labelAr: "التغذية",
    labelEn: "Nutrition",
    icon: Utensils,
    items: [
      { labelAr: "مكتبة الأطعمة", labelEn: "Foods", hrefAr: "/ar/foods", hrefEn: "/foods" },
      { labelAr: "مخطط الوجبات", labelEn: "Meal Planner", hrefAr: "/ar/meal-planner", hrefEn: "/meal-planner" },
      { labelAr: "مكتبة الخطط الغذائية الجاهزة", labelEn: "Diet Plans", hrefAr: "/ar/diet-plan", hrefEn: "/diet-plan" },
      { labelAr: "مجموعات الأطعمة", labelEn: "Food Collections", hrefAr: "/ar/collections/high-protein-foods", hrefEn: "/collections/high-protein-foods" },
    ],
  },
  {
    id: "tools",
    labelAr: "الأدوات",
    labelEn: "Tools",
    icon: Calculator,
    items: [
      { labelAr: "حاسبة السعرات", labelEn: "Calorie Calculator", hrefAr: "/ar/tools/calorie-calculator", hrefEn: "/tools/calorie-calculator" },
      { labelAr: "حاسبة الماكروز", labelEn: "Macro Calculator", hrefAr: "/ar/tools/macro-calculator", hrefEn: "/tools/macro-calculator" },
      { labelAr: "حاسبة مؤشر كتلة الجسم", labelEn: "BMI Calculator", hrefAr: "/ar/tools/bmi-calculator", hrefEn: "/tools/bmi-calculator" },
      { labelAr: "حاسبة نسبة الدهون", labelEn: "Body Fat Calculator", hrefAr: "/ar/tools/body-fat-calculator", hrefEn: "/tools/body-fat-calculator" },
      { labelAr: "متتبع شرب الماء", labelEn: "Water Tracker", hrefAr: "/ar/tools/water-tracker", hrefEn: "/tools/water-tracker" },
      { labelAr: "كل الأدوات", labelEn: "All Tools", hrefAr: "/ar/tools", hrefEn: "/tools" },
    ],
  },
  {
    id: "ai",
    labelAr: "الذكاء الاصطناعي",
    labelEn: "AI",
    icon: Sparkles,
    items: [
      { labelAr: "مخطط الوجبات بالذكاء الاصطناعي", labelEn: "AI Meal Planner", hrefAr: "/ar/ai-meal-planner", hrefEn: "/ai-meal-planner" },
      { labelAr: "مخطط التمارين بالذكاء الاصطناعي", labelEn: "AI Workout Planner", hrefAr: "/ar/ai-workout-planner", hrefEn: "/ai-workout-planner" },
      // Phase 216 (P2-2 — owner decision 2026-09-16 «نفّذ الإصلاح»):
      // supersedes the 2026-09-14 freeze — language-aware like the
      // drawer's entry, the logo and the footer (SEO-GEO-6.4).
      { labelAr: "EVO AI Coach", labelEn: "EVO AI Coach", hrefAr: "/ar/evo", hrefEn: "/evo" },
    ],
  },
  {
    id: "coaching",
    labelAr: "التدريب الأونلاين",
    labelEn: "Coaching",
    icon: Users,
    hrefAr: "/ar/coaching",
    hrefEn: "/coaching",
  },
];

export function SiteHeader({ variant = "landing" }: { variant?: "landing" | "app" }) {
  const { t, lang } = useI18n();
  const { navigate } = useNav();
  const { profile, isCoach, isAdmin, isSiteCoach, isB2BCoach, signOutAsync } = useAuth();

  // Phase 51 — the header ACCOUNT button opens the role's own CONSOLE for
  // staff (admin → /admin, coach → /coach) instead of the member-style
  // /profile page («عضويتك/أدواتك/حدودك»). Members keep /profile. Staff
  // still reach /profile via the «الصفحة الشخصية» card inside their
  // dashboards.
  const accountHref = isAdmin ? "/admin" : isCoach ? "/coach" : "/profile";
  const isLoggedIn = !!profile;
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  // W1-3d (A-02 — remediation plan 2026-10-02): the hamburger is now an
  // EXPANDED-STATE control (aria-expanded + aria-controls at the drawer
  // panel) and the restore target for the focus trap — the keyboard user
  // who opened the drawer gets focus back on close.
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLElement>(null);
  // Phase 202: which DESKTOP service dropdown is click-opened. Mouse
  // users get the CSS hover path (group-hover); keyboard users get
  // focus-within; touch users on large screens (hover:none devices —
  // iPad landscape) get this click-toggle path, so every input modality
  // can open the dropdowns.
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // W1-3d (A-02): Tab is TRAPPED inside the drawer while it is open —
      // focus wraps first→last (Shift+Tab: last→first) instead of escaping
      // to the page behind the aria-modal panel. The panel contains
      // itself (tabIndex=-1 + .focus() below), so the query covers every
      // tabbable item the drawer renders; collapsed groups unmount their
      // items (conditional render), so the DOM list is the true list.
      if (e.key !== "Tab") return;
      const panel = drawerPanelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const outside = active === null || !panel.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // W1-3d (A-02): the dialog-panel focus lifecycle — on open, focus lands
  // on the PANEL itself (the named-dialog pattern: focus the container, not
  // a control, so Enter never re-fires a button); on close (any path —
  // Escape · backdrop · X · a nav item), focus RESTORES to the hamburger
  // trigger instead of falling to <body> inside a now-inert subtree.
  // preventScroll: the panel is fixed and already in view; a scroll jump
  // behind the scroll-locked body would be pure noise.
  useEffect(() => {
    if (!open) return;
    drawerPanelRef.current?.focus({ preventScroll: true });
    return () => {
      menuButtonRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // Phase 202: close the click-opened desktop dropdown when clicking
  // (or tapping) anywhere outside the service nav.
  useEffect(() => {
    if (!openMenu) return;
    const onDocPointer = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-service-nav]")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", onDocPointer);
    return () => document.removeEventListener("click", onDocPointer);
  }, [openMenu]);

  // ─── Drawer groups (module-scope defs → resolved here) ──────────────────
  // W1-4a (audit P-01 — 2026-10-02): the groups resolve from the
  // module-scope DRAWER_GROUP_DEFS through a useMemo keyed ONLY on
  // lang/role flags — the arrays' reference is stable across SPA
  // navigations (the old code re-allocated every group/item on each
  // render), and item actions are data (nav/evo), never closures.
  const groups: MenuGroup[] = useMemo(() => {
    const visible: MenuGroup[] = [];
    for (const def of DRAWER_GROUP_DEFS) {
      if (def.audience === "nonStaff" && isCoach) continue;
      if (def.audience === "member" && !(isLoggedIn && !isCoach)) continue;
      if (def.audience === "b2bCoach" && !(isLoggedIn && isB2BCoach)) continue;
      if (def.audience === "siteCoach" && !(isLoggedIn && isSiteCoach)) continue;
      if (def.audience === "admin" && !(isLoggedIn && isAdmin)) continue;
      visible.push({
        id: def.id,
        title: isAr ? def.titleAr : def.titleEn,
        items: def.items
          .filter((item) => !(item.hideForCoach && isCoach))
          .map((item) => ({
            label: isAr ? item.labelAr : item.labelEn,
            icon: item.icon,
            href: isAdmin && item.adminHref ? item.adminHref : isAr ? item.hrefAr : item.hrefEn,
            nav: item.nav,
            evo: item.evo,
          })),
      });
    }
    return visible;
  }, [isAr, isLoggedIn, isCoach, isAdmin, isB2BCoach, isSiteCoach]);

  // Expandable group state (only Tools is expandable by default)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["tools"]), // Tools group is open by default so users see all tools
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // W1-4a (audit P-01): items carry DATA (nav view / evo flag) instead of
  // closures — resolved here at click time against the CURRENT navigate
  // (identical behavior: the old closures captured the same fresh value).
  const handleItemClick = (item: MenuItem) => {
    setOpen(false);
    if (item.nav) navigate(item.nav);
    else if (item.evo) openEvoFloatingChat();
  };

  // ─── DESKTOP SERVICE NAV (Phase 202 — owner order 2026-09-15:
  // «Header: اجعل الـNavigation واضحًا للخدمات الأساسية التي يأتي
  // الزائر لاستخدامها»). The five core services render as visible
  // navbar entries (dropdown for the four families with children, a
  // direct link for Coaching) from lg up; the drawer keeps the FULL
  // menu (including the secondary «More» services) on every size.
  // ROLE SURFACE LAW: Coaching stays hidden from platform staff; EVO
  // keeps its exact /evo path (owner directive 2026-09-14). ───
  // W1-4a (audit P-01): the desktop service nav resolves from the
  // module-scope SERVICE_NAV_DEFS — same shape the render consumes, hrefs
  // resolved per locale, reference stable across navigations.
  const serviceNav = useMemo(
    () =>
      SERVICE_NAV_DEFS.filter((section) => section.id !== "coaching" || !isCoach).map(
        (section) => ({
          id: section.id,
          labelAr: section.labelAr,
          labelEn: section.labelEn,
          icon: section.icon,
          href: isAr ? section.hrefAr : section.hrefEn,
          items: section.items?.map((item) => ({
            labelAr: item.labelAr,
            labelEn: item.labelEn,
            href: isAr ? item.hrefAr : item.hrefEn,
          })),
        }),
      ),
    [isAr, isCoach],
  );

  return (
    <>
      {/* G1 → Phase 126 «Marble & Chrome»: navbar-chrome (mission §1) —
          sticky, blur(12px), translucent bg, chrome bottom border.
          2-zone layout (Phase 138): [menu][helmet mark] start / [theme]
          [lang][bell][account] end. Phase 138 (owner directive 2026-09-07):
          «عدل لوجو الهيدر لشكل الرسمة بدون الكتابة وانقله الى الجانب مع
          تنسيق ازرار الهيدر» — the header logo is now the owner's helmet
          MARK only (no wordmark), anchored at the start side right after
          the menu button (the center-anchored navbar wordmark pair is
          retired). With the wordmark gone from the center there is nothing
          left for the theme toggle to crowd (the original Phase 128
          concern), so it returns to the actions group — every utility
          button now lives together on the end side, uniformly sized.
          Phase 127 note: the «Start now» chrome CTA stays REMOVED (owner
          request) — the navbar is navigation-only. */}
      <header className="navbar-chrome sticky top-0 z-40 w-full">
        <div
          className={cn(
            "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6",
            variant === "app" && "max-w-6xl",
          )}
        >
          {/* Start side: hamburger + helmet mark — Phase 138. Mark pair
              (light/dark, ~5.7KB each) ThemeImg CSS-switches with the
              theme; tap → home. */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              ref={menuButtonRef}
              aria-expanded={open}
              aria-controls="site-mobile-drawer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text)] transition-colors hover:bg-[var(--tint)]"
              aria-label={isAr ? "فتح القائمة" : "Open menu"}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate("landing")}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--tint)]"
              aria-label="Alkemos"
            >
              <ThemeImg
                light="/images/brand/mark-helmet-light.png"
                dark="/images/brand/mark-helmet-dark.png"
                alt="Alkemos"
                /* PHASE 138: helmet MARK (no wordmark) 128x128 shown at 36px
                    (covers 3x DPR). Dark variant = luminosity-inverted
                    engraving so the mark pops on dark chrome. */
                width={128}
                height={128}
                eager
                className="h-9 w-9 object-contain"
              />
            </button>

            {/* DESKTOP SERVICE NAV (Phase 202): the five core services —
                Training / Nutrition / Tools / AI / Coaching — visible
                directly in the navbar from lg up. Dropdowns open on hover
                AND on keyboard focus (focus-within keeps tabbing into the
                panel); the panel wrapper bridges the hover gap (pt-2).
                Logical positioning (start-0) flips correctly under RTL. */}
            <nav
              aria-label={isAr ? "خدمات المنصة" : "Platform services"}
              data-service-nav
              className="ms-2 hidden items-center gap-1 lg:flex"
            >
              {serviceNav.map((section) => {
                const Icon = section.icon;
                if (section.items) {
                  return (
                    <div key={section.id} className="relative group">
                      {/* VRD-V2 §12: +2px item padding (12→14px) — the
                          VLM pass read the 14px labels as «cramped»
                          against the 64px navbar; label size itself is
                          already 14px (text-sm) and stays. */}
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openMenu === section.id}
                        onClick={() =>
                          setOpenMenu((prev) => (prev === section.id ? null : section.id))
                        }
                        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--tint)]"
                      >
                        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                        {isAr ? section.labelAr : section.labelEn}
                        <ChevronDown
                          className="h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                          aria-hidden="true"
                        />
                      </button>
                      {/* Dropdown panel — part of the hover group; the pt-2
                          bridge keeps it open while the pointer moves from
                          the button to the panel. Three open paths: mouse
                          hover (group-hover), keyboard (focus-within), and
                          the click-toggle (openMenu) for hover:none touch
                          screens — see the state above. */}
                      <div
                        className={cn(
                          "absolute start-0 top-full z-50 min-w-[15rem] pt-2 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
                          openMenu === section.id ? "visible opacity-100" : "invisible opacity-0",
                        )}
                      >
                        <div
                          className="rounded-xl border bg-[var(--bg)] p-2 shadow-2xl"
                          style={{ borderColor: "var(--edge)" }}
                          role="menu"
                          aria-label={isAr ? section.labelAr : section.labelEn}
                        >
                          {section.items.map((item) => (
                            <a
                              key={item.href + item.labelEn}
                              href={item.href}
                              role="menuitem"
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:bg-[var(--tint)]"
                            >
                              <span className="flex-1 truncate">{isAr ? item.labelAr : item.labelEn}</span>
                              <ChevronRight className="h-4 w-4 shrink-0 opacity-30 rtl:rotate-180" aria-hidden="true" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <a
                    key={section.id}
                    href={section.href}
                    className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--tint)]"
                  >
                    <Icon className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                    {isAr ? section.labelAr : section.labelEn}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* End side: theme + language + notifications + account — Phase
              138 tidy: ALL utility buttons grouped here, uniformly sized. */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme toggle — light/dark/auto (returned from the menu side:
                Phase 128 moved it left only to un-crowd the centered logo,
                which no longer exists). */}
            <ThemeToggle />

            {/* Language toggle — always visible */}
            <LanguageToggle />

            {/* Notifications bell — only for logged in users.
                Coaches see AdminNotificationBell (admin_notifications table),
                regular users see NotificationBell (user notifications table). */}
            {isLoggedIn && (
              <NotificationBellHeader isAdmin={isCoach} />
            )}

            {/* Account icon — profile photo if logged in, generic icon if not */}
            {isLoggedIn ? (
              <a
                href={accountHref}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 ring-[var(--edge)] transition-all hover:ring-[var(--chrome-edge)]"
                aria-label={isAr ? "حسابي" : "My account"}
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar URL is a user-provided arbitrary host; next/image would need a wildcard remotePatterns entry (weakens the image allowlist) and this is a 36px decorative thumbnail (QR-asset precedent)
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[var(--text)] text-sm font-medium text-[var(--bg)]">
                    {(profile?.full_name || "U")[0].toUpperCase()}
                  </span>
                )}
              </a>
            ) : (
              <button
                onClick={() => navigate("auth", { mode: "login" })}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tint)] text-[var(--text)] transition-colors hover:bg-[var(--edge)]"
                aria-label={isAr ? "تسجيل الدخول" : "Log in"}
              >
                <User className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Slide-in drawer — W1-3d (A-02): the closed drawer is INERT, not
          just aria-hidden — the old aria-hidden={!open} left every link
          inside the hidden subtree TAB-reachable (WCAG 2.4.3). inert removes
          the closed subtree from the tab order, the a11y tree, AND pointer
          events in one declaration; aria-hidden stays as the redundant belt
          for engines without inert support. The exit animation (opacity +
          translate, never display:none) is exactly why the drawer stays
          mounted — conditional render would kill the slide-out. */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-all duration-300",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <aside
          ref={drawerPanelRef}
          id="site-mobile-drawer"
          tabIndex={-1}
          className={cn(
            "absolute inset-y-0 end-0 flex w-[85vw] max-w-sm flex-col border-s bg-[var(--bg)] shadow-2xl transition-transform duration-300 ease-out focus:outline-none",
            open ? "translate-x-0" : "rtl:-translate-x-full ltr:translate-x-full",
          )}
          style={{ borderInlineStartColor: "var(--edge)" }}
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? "القائمة الرئيسية" : "Main menu"}
        >
          {/* Drawer header — Phase 138: helmet MARK (same as the navbar bar,
              no wordmark), tap → home. */}
          <div className="flex h-16 items-center justify-between border-b border-[var(--edge)] px-4">
            <button
              onClick={() => {
                setOpen(false);
                navigate("landing");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--tint)]"
              aria-label="Alkemos"
            >
              <ThemeImg
                light="/images/brand/mark-helmet-light.png"
                dark="/images/brand/mark-helmet-dark.png"
                alt="Alkemos"
                width={128}
                height={128}
                /* PERF-220: lazy — this instance lives inside the CLOSED
                    mobile drawer (display:none until the menu opens). The
                    old eager flag made Chrome fetch the light variant on
                    EVERY pageview in both themes even though the drawer is
                    never visible pre-interaction; lazy still loads it
                    instantly when the drawer opens (in-viewport lazy).
                    The always-visible header instance above keeps eager. */
                className="h-9 w-9 object-contain"
              />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text)] transition-colors hover:bg-[var(--tint)]"
              aria-label={isAr ? "إغلاق القائمة" : "Close menu"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu items — grouped layout */}
          <nav className="flex-1 overflow-y-auto p-3" aria-label={isAr ? "القائمة الرئيسية" : "Main menu"}>
            {groups.map((group, gi) => {
              const isExpanded = expandedGroups.has(group.id);
              const canCollapse = group.id === "tools"; // Only Tools is collapsible (others always show items)
              const showHeader = group.title !== "";
              return (
                <section key={group.id} className={gi > 0 ? "mt-4" : ""}>
                  {showHeader && (
                    <button
                      type="button"
                      onClick={() => canCollapse && toggleGroup(group.id)}
                      className={
                        "mb-1 flex w-full items-center justify-between px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] " +
                        (canCollapse ? "cursor-pointer hover:text-[var(--text)]" : "cursor-default")
                      }
                      aria-expanded={canCollapse ? isExpanded : undefined}
                      disabled={!canCollapse}
                    >
                      <span>{group.title}</span>
                      {canCollapse && (
                        <ChevronDown
                          className={"h-3.5 w-3.5 transition-transform " + (isExpanded ? "rotate-180" : "")}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )}
                  {(!canCollapse || isExpanded) && (
                    <ul className="space-y-0.5">
                      {group.items.map((item, i) => {
                        return (
                          <li key={`${group.id}-${i}`}>
                            {item.href ? (
                              <a
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={"flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-normal transition-colors text-[var(--text)] hover:bg-[var(--tint)] " + (canCollapse ? "ps-6" : "")}
                              >
                                <item.icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                                <span className="flex-1">{item.label}</span>
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-30 rtl:rotate-180" aria-hidden="true" />
                              </a>
                            ) : (
                              <button
                                onClick={() => handleItemClick(item)}
                                className={"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-normal transition-colors text-[var(--text)] hover:bg-[var(--tint)] " + (canCollapse ? "ps-6" : "")}
                              >
                                <item.icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
                                <span className="flex-1">{item.label}</span>
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-30 rtl:rotate-180" aria-hidden="true" />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </nav>

          {/* Bottom section — account + logout */}
          <div className="border-t border-[var(--edge)] p-3">
            {isLoggedIn ? (
              <>
                {/* Account link */}
                <a
                  href={accountHref}
                  onClick={() => setOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-normal transition-colors text-[var(--text)] hover:bg-[var(--tint)]"
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar URL is a user-provided arbitrary host; next/image would need a wildcard remotePatterns entry (weakens the image allowlist) and this is a 28px decorative thumbnail (QR-asset precedent)
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile"}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--text)] text-xs font-medium text-[var(--bg)]">
                      {(profile?.full_name || "U")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate">{profile?.full_name || (isAr ? "حسابي" : "My account")}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-30 rtl:rotate-180" />
                </a>
                {/* Logout */}
                <button
                  onClick={async () => {
                    await signOutAsync();
                    navigate("landing");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-normal transition-colors text-[#ff453a] hover:bg-[#ff453a]/5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate("auth", { mode: "login" });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start text-sm font-normal transition-colors text-[var(--text)] hover:bg-[var(--tint)]"
              >
                <LogIn className="h-4 w-4" />
                <span>{isAr ? "تسجيل الدخول" : "Log in"}</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--edge)] px-4 py-3 text-center text-xs font-normal text-[var(--muted-foreground)]">
            <p>© {new Date().getFullYear()} Alkemos</p>
          </div>
        </aside>
      </div>
    </>
  );
}
