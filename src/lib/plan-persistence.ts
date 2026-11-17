"use client";

/**
 * Plan persistence for the AI planner pages (Phase 183, owner decree
 * 2026-09-13 «البوول الموحد» — spec "Alkemos — Membership & Plan
 * Changes").
 *
 * THE BUG THIS KILLS: generated nutrition/workout plans lived ONLY in a
 * page-level useState, so ANY navigation (another page, a food/exercise
 * detail, browser back) or a refresh destroyed the generated plan. The
 * owner's law: the plan must survive navigation, detail pages, back
 * buttons, and refreshes.
 *
 * THE SPLIT:
 *   - GUEST (not signed in): the latest plan of each kind is mirrored
 *     to localStorage under a versioned key — restoring it on mount
 *     keeps the plan alive across navigation/refresh for the whole
 *     device session. Plans STAY visible even after the monthly pool
 *     is exhausted (they are data, not quota).
 *   - MEMBER (signed in): the SERVER auto-saves every successful
 *     generation to the `plans` table (account-lifetime, cross-device
 *     retrieval) — localStorage is still written as an offline cache,
 *     and hydration prefers the account copy (fresher + authoritative).
 *
 * GUEST IDENTITY (G6 dual-dimension, migration 0086): a per-browser
 * UUID minted on demand. It is sent to the demo routes + quota
 * endpoint and hashed server-side (hashGuestKey) — but the browser
 * UUID is only ONE dimension of the guest pool: the server ALSO
 * counts a salted hash of the client IP (hashIpKey) and reads
 * used = max(browser, network). So a brand-new incognito window (or
 * cleared storage) can NO LONGER reset the monthly balance — the same
 * network still meets its own history. No signup wall: the id is
 * transparent to the visitor; the signup nudge stays soft.
 *
 * LAW (fail-safe): every read validates the stored shape — a corrupt
 * or drifted payload is discarded (null), never rendered.
 */

import type { DemoPlan } from "@/lib/ai-meal-planner";
import type { WorkoutPlan } from "@/lib/ai-workout-planner";

export type PlanKind = "nutrition" | "workout";

const GUEST_ID_KEY = "alkemos:guestId:v1";
const PLAN_KEY_PREFIX = "alkemos:plan:v1:";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read the browser's guest id WITHOUT creating one (render-safe read). */
export function peekGuestId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(GUEST_ID_KEY);
    return v && UUID_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Read-or-mint the browser's guest id. Call in effects / event handlers
 * only (NEVER during render — minting during SSR-less render would
 * de-sync hydration). crypto.randomUUID is universal on modern
 * browsers; the fallback keeps older Safari alive.
 */
export function ensureGuestId(): string {
  if (typeof window === "undefined") return "";
  const existing = peekGuestId();
  if (existing) return existing;
  let id = "";
  try {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(GUEST_ID_KEY, id);
  } catch {
    // Private-mode / storage-blocked browsers: degrade to an empty id —
    // the server treats it as a fresh guest (pool checks by IP guard).
  }
  return id;
}

/** Stored envelope — versioned so future shape changes can migrate. */
type StoredPlanEnvelope = {
  version: 1;
  kind: PlanKind;
  generatedAt: string;
  plan: unknown;
  /** The inputs snapshot (form state) so the user sees what produced it. */
  inputs?: Record<string, unknown>;
  /** GAP-18 completion (owner clarification 2026-11-17): the medical
   * disclosure stamped at generation time (the page re-renders the
   * warning for the restored copy). Optional + loosely validated so
   * older envelopes keep loading. */
  disclosure?: { flag?: unknown; conditions?: unknown; warning: string };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Structural validation of a stored NUTRITION plan (never trust storage). */
function isValidNutritionPlan(v: unknown): v is DemoPlan {
  if (!isRecord(v) || !Array.isArray(v.meals)) return false;
  if (typeof v.kcal !== "number") return false;
  return v.meals.every((m) => {
    if (!isRecord(m) || typeof m.name !== "string" || typeof m.kcal !== "number") {
      return false;
    }
    return Array.isArray(m.items) && m.items.every((it) =>
      isRecord(it) &&
      typeof it.food === "string" &&
      typeof it.grams === "number" &&
      typeof it.kcal === "number",
    );
  });
}

/** Structural validation of a stored WORKOUT plan (never trust storage). */
function isValidWorkoutPlan(v: unknown): v is WorkoutPlan {
  if (!isRecord(v) || !Array.isArray(v.days)) return false;
  return v.days.every((d) => {
    if (!isRecord(d) || typeof d.name !== "string") return false;
    if (d.focus !== undefined && typeof d.focus !== "string") return false;
    return Array.isArray(d.exercises) && d.exercises.every((ex) =>
      isRecord(ex) &&
      typeof ex.name === "string" &&
      typeof ex.sets === "number",
    );
  });
}

function planKey(kind: PlanKind): string {
  return `${PLAN_KEY_PREFIX}${kind}`;
}

/**
 * Persist the latest plan of one kind (guest mirror + member offline
 * cache). Storage failures are swallowed: persistence is an
 * enhancement, never a blocker — the in-memory plan stays rendered.
 */
export function saveGuestPlan(
  kind: PlanKind,
  plan: DemoPlan | WorkoutPlan,
  inputs?: Record<string, unknown>,
  disclosure?: { flag?: unknown; conditions?: unknown; warning: string },
): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: StoredPlanEnvelope = {
      version: 1,
      kind,
      generatedAt: new Date().toISOString(),
      plan,
      inputs,
      ...(disclosure ? { disclosure } : {}),
    };
    window.localStorage.setItem(planKey(kind), JSON.stringify(envelope));
  } catch {
    // Quota-full / private mode: the page still shows the plan.
  }
}

/** Load + validate the stored plan of one kind (null when absent/corrupt). */
export function loadGuestPlan(kind: "nutrition"): { plan: DemoPlan; generatedAt: string; inputs?: Record<string, unknown>; disclosure?: { flag?: unknown; conditions?: unknown; warning: string } } | null;
export function loadGuestPlan(kind: "workout"): { plan: WorkoutPlan; generatedAt: string; inputs?: Record<string, unknown>; disclosure?: { flag?: unknown; conditions?: unknown; warning: string } } | null;
export function loadGuestPlan(
  kind: PlanKind,
): { plan: DemoPlan | WorkoutPlan; generatedAt: string; inputs?: Record<string, unknown>; disclosure?: { flag?: unknown; conditions?: unknown; warning: string } } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(planKey(kind));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || parsed.kind !== kind) {
      return null;
    }
    const valid =
      kind === "nutrition"
        ? isValidNutritionPlan(parsed.plan)
        : isValidWorkoutPlan(parsed.plan);
    if (!valid) return null;
    return {
      plan: parsed.plan as DemoPlan | WorkoutPlan,
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : "",
      inputs: isRecord(parsed.inputs) ? parsed.inputs : undefined,
      // GAP-18 completion: the stored disclosure survives only when its
      // warning is a real string (a corrupt/partial shape is dropped,
      // never rendered).
      disclosure:
        parsed.disclosure &&
        isRecord(parsed.disclosure) &&
        typeof parsed.disclosure.warning === "string"
          ? (parsed.disclosure as { flag?: unknown; conditions?: unknown; warning: string })
          : undefined,
    };
  } catch {
    return null;
  }
}

/** Drop the stored plan of one kind (used when the user regenerates). */
export function clearGuestPlan(kind: PlanKind): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(planKey(kind));
  } catch {
    /* nothing to do */
  }
}
