import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * SEO-COLLAPSE-AUDIT-2026-10-18 — client-bundle node:* guard (canary).
 *
 * The regression class this pins: a CLIENT-bundled module importing a
 * module that (transitively) statically imports node:* built-ins. On
 * 2026-10-16 ai-provider.ts gained a static import of
 * ai-provider-cooldown.ts (node:fs/os/path — the cooldown state file,
 * server-only by design) while two CLIENT libs (ai-meal-planner,
 * ai-workout-planner — their demo pages are "use client") imported
 * parseJSON from ai-provider → the client chunk graph gained node:fs →
 * Turbopack build died on /(ar)/ar/ai-meal-planner/page at the first
 * deploy that ran a full build (2026-10-18). The fix extracted the PURE
 * parseJSON into the leaf ./parse-json and repointed the two client libs.
 *
 * This canary bites BOTH directions:
 *   1. A client lib re-importing ai-provider (the exact regression).
 *   2. parse-json.ts itself gaining a node:* import (it must stay a
 *      pure leaf forever).
 *   3. A page importing ai-meal-planner/ai-workout-planner is expected
 *      to stay "use client" — asserted so the client-path assumption
 *      can never silently flip to server (which would mask regressions).
 */

const lib = (name: string) =>
  readFileSync(path.join(process.cwd(), "src/lib", name), "utf8");

const CLIENT_LIBS = ["ai-meal-planner.ts", "ai-workout-planner.ts"];

describe("client-bundle node:* guard (SEO-COLLAPSE-AUDIT-2026-10-18)", () => {
  it.each(CLIENT_LIBS)(
    "%s must NOT import ai-provider (pulls node:fs via ai-provider-cooldown into the client chunk)",
    (name) => {
      const src = lib(name);
      expect(src).not.toMatch(/from\s+"\.\/ai-provider"/);
      expect(src).not.toMatch(/from\s+"@\/lib\/ai-provider"/);
    },
  );

  it.each(CLIENT_LIBS)("%s has no node:* built-in import of its own", (name) => {
    expect(lib(name)).not.toMatch(/from\s+"node:/);
  });

  it("parse-json.ts is a pure leaf — zero imports at all", () => {
    const src = lib("parse-json.ts");
    expect(src).not.toMatch(/from\s+"node:/);
    expect(src).not.toMatch(/^import\s/m);
    expect(src).not.toMatch(/require\(/);
  });

  it("ai-provider.ts re-exports parseJSON from the leaf (API stability for server importers)", () => {
    expect(lib("ai-provider.ts")).toMatch(
      /export\s*\{\s*parseJSON\s*\}\s*from\s*"\.\/parse-json"/,
    );
  });

  it("ai-provider-cooldown keeps its server-only node:fs (the state file law, unchanged)", () => {
    expect(lib("ai-provider-cooldown.ts")).toMatch(/from\s+"node:fs"/);
  });

  it("the demo pages that bundle these libs are client components (the exposure premise)", () => {
    const pages = [
      "src/app/(en)/ai-meal-planner/page.tsx",
      "src/app/(ar)/ar/ai-meal-planner/page.tsx",
      "src/app/(en)/ai-workout-planner/page.tsx",
      "src/app/(ar)/ar/ai-workout-planner/page.tsx",
    ];
    for (const p of pages) {
      const src = readFileSync(path.join(process.cwd(), p), "utf8");
      // The AR mirrors re-export the EN client page (no directive of their
      // own — they inherit client-ness through the re-export), so BOTH
      // forms satisfy the premise: a direct directive OR a re-export of
      // the EN page that carries one.
      const isDirectClient =
        src.startsWith('"use client"') || src.includes('\n"use client"');
      const reExportsEnClientPage = /export\s+\{\s*default\s*\}\s*from\s*"@\/app\/\(en\)\/(ai-meal-planner|ai-workout-planner)\/page"/.test(src);
      expect(isDirectClient || reExportsEnClientPage).toBe(true);
    }
  });
});
