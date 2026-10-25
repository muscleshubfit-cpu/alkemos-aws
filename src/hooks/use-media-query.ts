"use client";

import { useEffect, useState } from "react";

/**
 * MOBILE-DRAWER 2026-10-25 (owner order item 2 — «أصلح التمرير واللمس
 * والارتفاع وتداخل الحاويات في درج اختيار الأصناف»): SSR-safe media-query
 * hook. Returns false on the server and the first client render (no
 * layout flash for the desktop default), then tracks the live match.
 * Used by the coach plan editor's FoodPickerCell to swap the 256px
 * popover for a full-width bottom sheet on phones.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    // Sync immediately on mount (the initializer ran before hydration).
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    // Safari <14 needs addListener; every current engine has addEventListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}
