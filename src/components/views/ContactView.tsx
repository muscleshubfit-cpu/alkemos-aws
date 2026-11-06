"use client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNav } from "@/hooks/use-nav";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function ContactView() {
  const { t, lang } = useI18n();
  const { navigate } = useNav();
  const { profile } = useAuth();
  const isAr = lang === "ar";
  const [name, setName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error(isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    setSending(true);
    try {
      if (profile) {
        // PHASE 224 (narrow 182): the @/lib/data barrel statically chains to
        // the Supabase layer — imported HERE, at the user-triggered call site,
        // so /contact (+ /ar/contact) ships zero Supabase JS for anonymous
        // visitors (the NotificationBell precedent from 182 itself).
        const { createTicket } = await import("@/lib/data");
        await createTicket(profile.id, `[${isAr ? "تواصل" : "Contact"}] ${subject}`, `${message}\n\n— ${name} (${email})`);
        toast.success(isAr ? "تم إرسال رسالتك! سنرد عليك قريبًا." : "Message sent! We'll reply soon.");
      } else {
        const contactMessages = JSON.parse(localStorage.getItem("mhe:contact_messages") || "[]");
        contactMessages.push({ name, email, subject, message, created_at: new Date().toISOString() });
        localStorage.setItem("mhe:contact_messages", JSON.stringify(contactMessages));
        // Honesty law (content-strategy §5): a logged-out message is only
        // saved locally — never promise a reply we cannot deliver. Route
        // the visitor to email for a guaranteed answer.
        toast.success(
          isAr
            ? "حُفظت رسالتك على هذا الجهاز. لضمان وصولها إلينا وردّنا عليك، أرسلها إلى contact@alkemos.com أو سجّل الدخول وافتح تذكرة دعم."
            : "Your message was saved on this device. For a guaranteed reply, email contact@alkemos.com or log in and open a support ticket.",
          { duration: 9000 },
        );
      }
      setSubject("");
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (isAr ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setSending(false);
    }
  };

  return (
    /* Phase 132 (owner feedback: «باقي الموقع إعادة التنسيق ليتبع هوية
       الصفحة الرئيسية»): the contact page joins the Marble & Chrome
       identity — token surfaces/text, marble-card form, chrome CTA. */
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-20 sm:px-6 md:py-28">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            {isAr ? "تواصل معنا" : "Contact Us"}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-normal text-[var(--muted-foreground)] md:text-xl">
            {/* CONTENT-AUDIT P2-9 (2026-09-28, audit §2.7): the old subtitle
                told visitors to “log in and send a message” while a public
                form sat right below it — and that form only opens a real
                ticket for signed-in users (visitors’ messages are saved
                locally with an honest toast). The copy now describes the
                three channels accurately. */}
            {isAr
              ? "لديك سؤال أو استفسار؟ استخدم الاستمارة أو راسلنا على البريد — ورسائل الحسابات المسجلة تفتح تذكرة دعم نرد عليها عادةً خلال 24 ساعة."
              : "Have a question? Use the form or email us — signed-in messages open a support ticket and usually get a reply within 24 hours."}
          </p>

          <div className="mt-6 flex justify-center">
            <ShareButtons path="/contact" title={isAr ? "تواصل معنا — Alkemos" : "Contact Us — Alkemos"} />
          </div>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Contact info — engraved-seal eyebrow + token text (identity) */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-normal uppercase tracking-wide text-[var(--muted-foreground)]">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </h3>
              <p className="mt-2 text-lg font-normal" dir="ltr">contact@alkemos.com</p>
            </div>
            <div>
              <h3 className="text-xs font-normal uppercase tracking-wide text-[var(--muted-foreground)]">
                {isAr ? "دعم سريع" : "Quick Support"}
              </h3>
              <p className="mt-2 text-lg font-normal text-[var(--muted-foreground)]">
                {isAr ? "سجّل الدخول وافتح تذكرة دعم من لوحة التحكم" : "Log in and open a support ticket from dashboard"}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-normal uppercase tracking-wide text-[var(--muted-foreground)]">
                {isAr ? "الموقع" : "Location"}
              </h3>
              <p className="mt-2 text-lg font-normal">{isAr ? "القاهرة، مصر — أونلاين" : "Cairo, Egypt — Online"}</p>
            </div>
          </div>

          {/* Contact form — marble-card surface (identity) */}
          <div className="marble-card p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {isAr ? "الاسم" : "Name"}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  {isAr ? "الموضوع" : "Subject"}
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  {isAr ? "الرسالة" : "Message"}
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="min-h-[120px] rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn-chrome w-full px-6 py-3 text-base disabled:opacity-50"
              >
                {sending ? (isAr ? "جارٍ الإرسال…" : "Sending…") : (isAr ? "إرسال الرسالة" : "Send Message")}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Access-point fix (2026-09-14): shared marble footer replaces the
          slim copyright line — contact (EN + AR) joins persistent nav. */}
      <SiteFooter />
 </div>
 );
}
