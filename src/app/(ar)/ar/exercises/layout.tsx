import type { ReactNode } from "react";
import { Resources } from "@/components/hub-head-resources";

/**
 * AR EXERCISES SECTION LAYOUT (VERCEL-USAGE-3, 2026-09-21) — mirrors the
 * EN (en)/exercises/layout.tsx: hub-banner preloads. No metadata here
 * (AR metadata is per-page / per-section as before).
 * PERFORMANCE-AUDIT-2026-11-08 P0-3 (owner order 2026-11-08): the
 * https://wger.de preconnect is REMOVED (dead origin — TLS handshake with
 * zero assets served from it since Batch-2 self-hosting 2026-09-16).
 */
export default function ArExercisesLayout({ children }: { children: ReactNode }) {
  return (
    <Resources hosts={[]} banner="exercises">
      {children}
    </Resources>
  );
}
