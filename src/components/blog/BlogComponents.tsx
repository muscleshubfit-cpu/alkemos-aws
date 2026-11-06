"use client";

import { ArrowRight, Check, Facebook, Linkedin, Twitter, MessageCircle, Copy, Check as CheckIcon, Share2, Crown, Gift } from "lucide-react";
import { useState, useEffect } from "react";
// P3-10/م4+م5 (Phase 217): library sizes derive from the shared count
// constants, and the AR line keeps ONE numeral system (Western digits —
// the site-wide AR convention); the old string mixed "868+" with
// "٠٨٬٨٣٠+" Arabic-Indic digits in one sentence.
import { EXERCISES_COUNT } from "@/lib/exercises-shared";
import { FOODS_COUNT } from "@/lib/foods-shared";
import { canonicalShareUrl } from "@/lib/share-url";
import { buildShareLinks } from "@/lib/share-links";
import { useShareActions } from "@/components/share/useShareActions";

const EX_LIB = `${EXERCISES_COUNT.toLocaleString("en-US")}+`;
const FOOD_LIB = `${FOODS_COUNT.toLocaleString("en-US")}+`;

/**
 * BlogMembershipCard — compact single-card CTA shown inside blog articles.
 *
 * Two sections:
 * 1. Coaching membership CTA — join Alkemos Online Coaching
 *    (PHASE 173 owner fix: the card used to say «Book a session /
 *    احجز جلسة» — a single-session service that does NOT exist. The
 *    real product is the Coaching MEMBERSHIP ($39.99/mo · $359/yr,
 *    memberships.ts). Wording now sells the membership/subscription;
 *    the /coaching link was already correct — that landing page sells
 *    exactly this membership via /checkout?tier=coaching, so neither
 *    the link nor any checkout logic changed.)
 * 2. Membership plans — Free / Premium / Pro tiers
 */
export function BlogMembershipCard({ lang }: { lang: "en" | "ar" }) {
 const isAr = lang === "ar";

 const tiers = [
 { id: "free", nameAr: "مجاني", nameEn: "Free", price: "$0", highlight: false },
 { id: "premium", nameAr: "بريميوم", nameEn: "Premium", price: "$14.99", highlight: true },
 { id: "pro", nameAr: "برو", nameEn: "Pro", price: "$29.99", highlight: false },
 ];

 return (
 <div className="my-12 space-y-6">
 {/* Section 1: Coaching membership CTA */}
 <div className="overflow-hidden rounded-3xl border border-[#0071e3]/20 bg-gradient-to-br from-[#0071e3]/5 to-[#0071e3]/10 p-6 md:p-8">
 <div className="flex flex-col items-center text-center">
 <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl border border-[var(--edge)] bg-[var(--tint)] text-[var(--muted-2)] shadow-lg">
 <Crown className="h-6 w-6" />
 </span>
 <h3 className="mt-4 text-xl font-semibold tracking-tight md:text-2xl">
 {isAr ? "اشترك في التدريب الأونلاين مع Alkemos" : "Join Alkemos Online Coaching"}
 </h3>
 <p className="mx-auto mt-2 max-w-md text-sm font-normal text-[var(--muted-foreground)]">
 {isAr
 ? "خطة مخصصة من مدرب معتمد — تغذية + تمارين + متابعة أسبوعية — ضمن عضوية تدريب أونلاين شهرية مرنة تبدأ متى شئت."
 : "A personalized plan from a certified coach — nutrition + training + weekly tracking — as a flexible monthly coaching membership."}
 </p>
 <a
 href={isAr ? "/ar/coaching" : "/coaching"}
 className="btn-chrome mt-5 inline-flex items-center gap-2 px-6 py-2.5 text-sm"
 >
 {isAr ? "اشترك الآن" : "Join now"}
 <ArrowRight className="h-4 w-4 rtl:rotate-180" />
 </a>
 </div>
 </div>

 {/* Section 2: Membership plans */}
 <div className="marble-card overflow-hidden p-6 md:p-8">
 <div className="flex flex-col items-center text-center">
 <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
 {isAr ? "أو اختر عضوية Alkemos" : "Or pick an Alkemos plan"}
 </h3>
 <p className="mx-auto mt-2 max-w-md text-sm font-normal text-[var(--muted-foreground)]">
 {isAr
 ? "EVO ذكاء اصطناعي، خطط تغذية وتمارين مخصصة، ومتابعة أسبوعية — كله في مكان واحد."
 : "EVO AI coach, personalized nutrition + workout plans, weekly tracking — all in one place."}
 </p>
 </div>

 {/* Tiers row */}
 <div className="mt-6 grid grid-cols-3 gap-2 md:gap-3">
 {tiers.map((tier) => (
 <a
 key={tier.id}
 href={isAr ? "/ar/memberships" : "/memberships"}
 className={`block rounded-2xl p-3 text-center transition-all hover:opacity-90 ${
 tier.highlight
 ? "bg-[#1d1d1f] text-white"
 : "bg-[var(--card)] text-[var(--text)] border border-[var(--edge)]"
 }`}
 >
 <p className="text-xs font-medium opacity-80">
 {isAr ? tier.nameAr : tier.nameEn}
 </p>
 <p className="mt-1 text-base font-semibold tracking-tight">
 {tier.price}
 <span className="ms-0.5 text-[10px] font-normal opacity-60">/mo</span>
 </p>
 </a>
 ))}
 </div>

 <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
 <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
 <Check className="h-3.5 w-3.5 text-[#34c759]" />
 {isAr ? "EVO غير محدود (Premium+)" : "Unlimited EVO (Premium+)"}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
 <Check className="h-3.5 w-3.5 text-[#34c759]" />
 {isAr ? "خطط مخصصة" : "Personalized plans"}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
 <Check className="h-3.5 w-3.5 text-[#34c759]" />
 {isAr ? `${EX_LIB} تمرين و${FOOD_LIB} أكلة` : `${EX_LIB} exercises, ${FOOD_LIB} foods`}
 </div>
 </div>

 <div className="mt-6 text-center">
 <a
 href={isAr ? "/ar/memberships" : "/memberships"}
 className="btn-chrome inline-flex items-center gap-2 px-6 py-2.5 text-sm"
 >
 {isAr ? "قارن العضويات" : "Compare plans"}
 <ArrowRight className="h-4 w-4 rtl:rotate-180" />
 </a>
 </div>
 </div>

 {/* Section 3: Affiliate Program CTA */}
 <div className="overflow-hidden rounded-3xl border border-[#34c759]/20 bg-gradient-to-br from-[#34c759]/5 to-[#34c759]/10 p-6 md:p-8">
 <div className="flex flex-col items-center text-center">
 <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-[#1d8a3d] text-white shadow-lg">
 <Gift className="h-6 w-6" />
 </span>
 <h3 className="mt-4 text-xl font-semibold tracking-tight md:text-2xl">
 {isAr ? "حوّل تأثيرك إلى دخل مع برنامج الأفلييت (الشركاء)" : "Turn Your Influence Into Income — Affiliate Program"}
 </h3>
 <p className="mx-auto mt-2 max-w-md text-sm font-normal text-[var(--muted-foreground)]">
 {isAr
 ? "شارك Alkemos مع جمهورك واكسب 20% عمولة من كل اشتراك مؤهل. كوكيز 30 يوم."
 : "Share Alkemos with your audience and earn 20% commission on every eligible subscription. 30-day cookie."}
 </p>
 <a
 href={isAr ? "/ar/affiliate" : "/affiliate"}
 className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1d8a3d] px-6 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
 >
 {isAr ? "تعرف على البرنامج" : "Learn about the program"}
 <ArrowRight className="h-4 w-4 rtl:rotate-180" />
 </a>
 </div>
 </div>
 </div>
 );
}

/**
 * SocialShare — the blog article share bar (Facebook, LinkedIn, X,
 * WhatsApp + Web Share + Copy).
 *
 * PHASE 231 UNIFICATION (owner order «نفّذ الآن جميع إصلاحات Social
 * Sharing المتبقية…»): the platform hrefs are built by the shared engine
 * buildShareLinks() (src/lib/share-links.ts) — no hand-rolled payloads —
 * and copy/Web-Share behavior comes from the shared useShareActions hook.
 * SHARE URL LAW (B1 of the same order): the URL is the deterministic
 * canonical article URL from the Phase-230 single source
 * canonicalShareUrl("/blog/<slug>", lang) — identical output to the old
 * inline `${baseUrl}${isAr ? "/ar/blog" : "/blog"}/${slug}` construction,
 * which is retired as a parallel implementation. The dead `ogUrl`/`image`
 * props (never referenced by any share target) are deleted with their
 * call-site args (§3.8 dead-code rule).
 *
 * PRESERVED VERBATIM (the surface's required behavior): platform set and
 * order (no Telegram — unchanged), the language-aware share text
 * (title + ≤150-char summary + «اقرأ المقال كاملًا على Alkemos:» / "Read
 * the full article on Alkemos:"), Facebook quoting the FULL share text,
 * window.open with the 600×400 popup, icons, classes and labels.
 *
 * Web Share: support now resolves AFTER mount via useShareActions (the
 * render-time navigator probe was a latent hydration mismatch — SSR
 * omitted the button while supporting clients rendered it at first
 * paint). Same end state on mobile, one tick later, zero mismatch.
 */
export function SocialShare({ path, title, description, lang }: { path: string; title: string; description?: string; lang: "en" | "ar" }) {
 const isAr = lang === "ar";

 // Phase-230 single source: canonical, locale-aware, query/hash-free.
 const shareUrl = canonicalShareUrl(path, lang);

 // Language-aware share text — always include a summary
 const shortDesc = description ? description.slice(0, 150) + (description.length > 150 ? "..." : "") : (title ? title : "");
 const shareText = isAr
   ? `${title}\n\n${shortDesc}\n\nاقرأ المقال كاملًا على Alkemos:`
   : `${title}\n\n${shortDesc}\n\nRead the full article on Alkemos:`;

 const { copied, copy, nativeShareSupported, nativeShare } = useShareActions({
   url: shareUrl,
   title,
   text: shareText,
 });

 const shareLinks = buildShareLinks({
   url: shareUrl,
   shareText,
   // Facebook quotes the FULL share text on this surface (the historical
   // payload — it scrapes OG tags for the rest).
   fbQuote: shareText,
   platforms: ["facebook", "linkedin", "x", "whatsapp"],
 });
 const hrefByPlatform = Object.fromEntries(
   shareLinks.map((l) => [l.platform, l.href]),
 ) as Record<(typeof shareLinks)[number]["platform"], string>;

 // window.open with the 600×400 popup — this surface's historical open
 // behavior (ShareButtons/CoachShareButtons use target=_blank anchors).
 const share = (platform: "facebook" | "linkedin" | "x" | "whatsapp") => {
   window.open(hrefByPlatform[platform], "_blank", "noopener,noreferrer,width=600,height=400");
 };

 return (
   <div className="my-8 flex items-center gap-2">
     <span className="text-sm text-muted-foreground">{isAr ? "شارك:" : "Share:"}</span>
     <button onClick={() => share("facebook")} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary" aria-label="Facebook">
       <Facebook className="h-4 w-4" />
     </button>
     <button onClick={() => share("linkedin")} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary" aria-label="LinkedIn">
       <Linkedin className="h-4 w-4" />
     </button>
     <button onClick={() => share("x")} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary" aria-label="X">
       <Twitter className="h-4 w-4" />
     </button>
     <button onClick={() => share("whatsapp")} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary" aria-label="WhatsApp">
       <MessageCircle className="h-4 w-4" />
     </button>
     {nativeShareSupported && (
       <button onClick={nativeShare} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary" aria-label={isAr ? "مشاركة" : "Share"}>
         <Share2 className="h-4 w-4" />
       </button>
     )}
     <button onClick={copy} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-primary/40 hover:text-primary" aria-label="Copy link">
       {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
     </button>
   </div>
 );
}

export function ReadingProgress() {
 const [progress, setProgress] = useState(0);

 useEffect(() => {
 const handleScroll = () => {
 const scrolled = window.scrollY;
 const height = document.documentElement.scrollHeight - window.innerHeight;
 setProgress(height > 0 ? (scrolled / height) * 100 : 0);
 };
 window.addEventListener("scroll", handleScroll);
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 return (
 <div className="fixed top-0 left-0 z-[60] h-1 w-full bg-transparent">
 <div
 className="h-full bg-gradient-primary transition-all duration-150"
 style={{ width: `${progress}%` }}
 />
 </div>
 );
}

export function TableOfContents({ items, lang }: { items: Array<{ level: number; text: string; id: string }>; lang: "en" | "ar" }) {
 const isAr = lang === "ar";
 if (items.length === 0) return null;
 return (
 <nav className="sticky top-20 hidden rounded-2xl border border-border bg-card p-4 lg:block">
 <h4 className="mb-3 text-sm font-bold">{isAr ? "محتويات المقال" : "Table of Contents"}</h4>
 <ul className="space-y-1.5 text-sm">
 {items.map((item, i) => (
 <li key={i} className={item.level === 3 ? "ps-4" : ""}>
 <a
 href={`#${item.id}`}
 className="text-muted-foreground transition-colors hover:text-primary"
 onClick={(e) => {
 e.preventDefault();
 document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
 }}
 >
 {item.text}
 </a>
 </li>
 ))}
 </ul>
 </nav>
 );
}
