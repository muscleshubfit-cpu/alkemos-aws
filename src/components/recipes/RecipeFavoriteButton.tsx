"use client";

import { useEffect, useState } from "react";
import { Heart, LogIn } from "lucide-react";

/**
 * RECIPE-FAVORITE-BUTTON — the authed-only favorites toggle
 * (HEALTHY-RECIPES-PLATFORM plan §9.2/§3.6 — decision ق6).
 *
 * Authed visitors toggle the row via POST/DELETE /api/recipes/favorite;
 * guests get an honest invite to sign in (never a fake button). The 401
 * branch renders the invite inline — no layout shift.
 *
 * STATE HYDRATION: the recipe page is ISR-STATIC (generateStaticParams +
 * revalidate — the plan's caching law), so the favorite state cannot be
 * baked into the HTML without making every recipe page dynamic. The
 * island therefore discovers the viewer's state on mount (GET
 * /api/recipes/favorite?recipeId=…) — a 401 there renders the same
 * honest guest invite.
 */
export function RecipeFavoriteButton({
  recipeId,
  initialFavorited,
  lang,
}: {
  recipeId: string;
  initialFavorited: boolean;
  lang: "en" | "ar";
}) {
  const isAr = lang === "ar";
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);
  const [guest, setGuest] = useState(false);
  const [checked, setChecked] = useState(false);

  // Discover the viewer's state client-side (keeps the page static).
  useEffect(() => {
    let alive = true;
    fetch(`/api/recipes/favorite?recipeId=${encodeURIComponent(recipeId)}`)
      .then(async (res) => {
        if (res.status === 401) {
          if (alive) setGuest(true);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { favorited?: boolean };
        if (alive && typeof data.favorited === "boolean") {
          setFavorited(data.favorited);
        }
      })
      .catch(() => {
        /* offline-ish: keep the server default */
      })
      .finally(() => {
        if (alive) setChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [recipeId]);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/recipes/favorite", {
        method: favorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      if (res.status === 401) {
        setGuest(true);
        return;
      }
      if (res.ok) setFavorited((f) => !f);
    } catch {
      /* offline-ish: keep the current state */
    } finally {
      setBusy(false);
    }
  }

  if (guest) {
    return (
      <a
        href={
          isAr
            ? "/auth?mode=login&next=%2Far%2Frecipes"
            : "/auth?mode=login&next=%2Frecipes"
        }
        className="inline-flex items-center gap-2 rounded-full bg-[var(--tint)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--card)] print:hidden"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {isAr ? "سجّل الدخول لحفظ الوصفات" : "Sign in to save recipes"}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorited}
      aria-busy={!checked || busy}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 print:hidden ${
        favorited
          ? "bg-[#ff3b30] text-white"
          : "bg-[var(--tint)] text-[var(--text)] hover:bg-[var(--card)]"
      }`}
    >
      <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} aria-hidden="true" />
      {favorited
        ? isAr
          ? "محفوظة"
          : "Saved"
        : isAr
          ? "حفظ الوصفة"
          : "Save recipe"}
    </button>
  );
}
