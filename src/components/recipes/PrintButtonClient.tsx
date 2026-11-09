"use client";

import { Printer } from "lucide-react";

/**
 * PRINT-BUTTON-CLIENT — the recipes detail print control (plan §9.2).
 *
 * The only interactive part of the print flow: a real click handler
 * calling window.print(). The page itself carries the @media print
 * CSS (ingredients + steps only; images/ads/chrome hidden) so this
 * island stays tiny and dependency-free.
 */
export function PrintButtonClient({ lang, isAr }: { lang: "en" | "ar"; isAr: boolean }) {
  void lang;
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--tint)] px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--text)]"
      aria-label={isAr ? "طباعة الوصفة" : "Print this recipe"}
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {isAr ? "طباعة" : "Print"}
    </button>
  );
}
