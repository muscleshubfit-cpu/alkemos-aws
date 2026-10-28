import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * PROFILE-SAVE HONESTY 2026-10-29 (FULL-ACCOUNTS-FUNCTIONAL-QA live
 * finding): the profile page's updateProfile swallowed the Supabase
 * error (console.error only, returned void) — handleSave then ALWAYS
 * reached toast.success, so a failing profiles UPDATE (RLS denial,
 * network failure, expired session) showed «Changes saved» over
 * unsaved data. Same honesty class as DRAFT-DELETE 2026-10-24
 * (deletePlan verified contract). These source pins fail when someone
 * reverts the boolean contract or reintroduces the unconditional
 * success toast. The live proof round: a real PATCH 204 was observed
 * in production (phone persisted to profiles.phone) and the failure
 * branch was pinned by code inspection — the UI flow itself was
 * browser-verified on alkemos.com (QA member test account).
 */

const src = (rel: string) =>
  readFileSync(join(process.cwd(), "src", rel), "utf8");

describe("profile save — the honest contract (PROFILE-SAVE HONESTY)", () => {
  it("updateProfile returns a boolean verdict — never void over a swallowed error", () => {
    const s = src("app/(app)/profile/page.tsx");
    expect(s).toContain("): Promise<boolean> => {");
    expect(s).toContain("if (error) {");
    expect(s).toContain("return false;");
    expect(s).toContain("return true;");
  });

  it("handleSave toasts success ONLY on a real update verdict", () => {
    const s = src("app/(app)/profile/page.tsx");
    // the verdict is consumed…
    expect(s).toContain("const ok = await updateProfile({");
    // …success is inside the ok branch…
    expect(s).toMatch(/if \(ok\) \{\s*\n\s*toast\.success/);
    // …and an honest bilingual failure toast exists for the !ok path
    expect(s).toContain("Could not save your changes");
    expect(s).toContain("تعذر حفظ التغييرات");
  });

  it("no unconditional-success path remains: toast.success never directly follows the await", () => {
    const s = src("app/(app)/profile/page.tsx");
    // the old bug shape: `await updateProfile({...});` then toast.success
    // on the next statement with no verdict between them.
    expect(s).not.toMatch(
      /await updateProfile\(\{[^}]*\}\);\s*\n\s*toast\.success/,
    );
  });

  it("the catch path still reports thrown errors (network/exception class)", () => {
    const s = src("app/(app)/profile/page.tsx");
    expect(s).toMatch(
      /catch \(e\) \{\s*\n\s*toast\.error\(e instanceof Error/,
    );
  });
});
