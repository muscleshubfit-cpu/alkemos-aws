/**
 * STORE DISCLOSURE COMPONENTS (ALKEMOS-STORE-PHASE1 §1.4 —
 * DISCLOSURES-EN.md, the store's mandated legal texts as components).
 *
 * م-1 (unit-adjacent — the OA literal, placed ABOVE/attached to every
 * buy unit, never separated, never hidden): OaDisclosureLine.
 * د-2 (the short line for content surfaces near the first buy link):
 * ShortDisclosureLine.
 *
 * These are SERVER components (pure text) so the disclosure canary can
 * also verify them structurally, and so no client hydration can ever
 * drop them.
 */

/** د-1 — the Operating Agreement's mandated LITERAL sentence (never edited, never translated). */
export const OA_DISCLOSURE_TEXT =
  "As an Amazon Associate I earn from qualifying purchases.";

/** د-2 — the short content-surface line (near the first buy link). */
export const SHORT_DISCLOSURE_TEXT =
  "When you buy through links on our site, we may earn an affiliate commission at no extra cost to you.";

/** م-1: the unit-adjacent OA line — visible, unhideable, directly attached to the buy unit. */
export function OaDisclosureLine({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] leading-snug text-[var(--muted-foreground)] ${className}`}
      data-affiliate-store-disclosure="oa"
    >
      {OA_DISCLOSURE_TEXT}
    </p>
  );
}

/** م-4/م-5: the short line for content surfaces (before the first buy link). */
export function ShortDisclosureLine({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-relaxed text-[var(--muted-foreground)] ${className}`}
      data-affiliate-store-disclosure="short"
    >
      {SHORT_DISCLOSURE_TEXT}
    </p>
  );
}
