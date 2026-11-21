import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ORGANIC-GROWTH-D-C (owner decision 2026-11-21 — «رقم الهاتف غير إلزامي
 * عند التسجيل. افحص التنفيذ الفعلي، وأزل الإلزامية من المنتج والتحقق
 * والنماذج إن كانت موجودة، وليس من التوثيق فقط»).
 *
 * The repo audit found exactly ONE enforcement point of the old mandate:
 * the `required` attribute on the member-signup phone input (AuthView).
 * Everything else was already optional — coach self-register
 * («رقم الموبايل (اختياري)» / z.unknown().optional()), invite-adopt
 * (`...(phone ? { phone } : {})`), Google OAuth (no phone at all), and
 * the DB (profiles.phone is nullable text; the 0001 handle_new_user
 * trigger reads raw_user_meta_data->>'phone' which is NULL when absent).
 *
 * This canary pins the NEW state so a revert of any part of the decision
 * fails the battery:
 *  1. the phone input carries NO `required` — while fullname/email/
 *     password KEEP theirs (the decision lifts the phone mandate only);
 *  2. the label marks the field optional in BOTH languages;
 *  3. signUpEmail never persists an empty string — trimmed value or null,
 *     and the Supabase signup metadata OMITS the phone key entirely when
 *     empty (so the DB trigger reads NULL, not "");
 *  4. the DB-side acceptance stays: profiles.phone is a nullable column
 *     and the signup trigger reads the metadata key as nullable.
 */

const src = (rel: string) =>
  readFileSync(join(process.cwd(), rel), "utf8");

/** Extract one JSX <Input …/> block by its id attribute. */
const inputBlock = (view: string, id: string): string | null =>
  view.match(new RegExp(`<Input\\s+id="${id}"[\\s\\S]*?/>`))?.[0] ?? null;

describe("ORGANIC-GROWTH-D-C — phone is NOT mandatory at registration (owner decision 2026-11-21)", () => {
  const view = src("src/components/views/AuthView.tsx");

  it("the signup phone input carries NO `required` attribute (the old mandate's only enforcement point)", () => {
    const phone = inputBlock(view, "phone");
    expect(phone, "phone <Input> block not found").toBeTruthy();
    expect(phone!, "re-adding `required` to the phone input reinstates the mandate the owner lifted")
      .not.toMatch(/\brequired\b/);
  });

  it("the OTHER signup fields keep their `required` attributes (the decision lifts the phone mandate only)", () => {
    for (const id of ["fullname", "email", "password"]) {
      const block = inputBlock(view, id);
      expect(block, `${id} <Input> block not found`).toBeTruthy();
      expect(block!, `${id} must stay required`).toMatch(/\brequired\b/);
    }
  });

  it("the phone label marks the field optional in BOTH languages (i18n auth.phone)", () => {
    const i18n = src("src/lib/i18n.tsx");
    expect(i18n).toContain('"auth.phone": "Phone number (optional)"');
    expect(i18n).toContain('"auth.phone": "رقم الهاتف (اختياري)"');
    // and the AuthView label still renders through t("auth.phone")
    expect(view).toContain('t("auth.phone")');
  });

  it("signUpEmail never persists an empty phone — trimmed value or null, metadata omits the key when empty", () => {
    const auth = src("src/lib/data/auth.ts");
    // the single normalization point (function scope — both branches see it)
    expect(auth).toContain("const phoneValue = phone.trim();");
    // Supabase signup metadata: the phone key is OMITTED when empty, so the
    // 0001 trigger's raw_user_meta_data->>'phone' reads NULL (never "")
    expect(auth).toContain("...(phoneValue ? { phone: phoneValue } : {}),");
    // a bare `phone,` in either profile object would persist "" — both
    // objects must use the null-coalescing form
    expect(auth.match(/^ phone,$/m), "a profile object still assigns the raw `phone` string").toBeNull();
    expect((auth.match(/phone: phoneValue \|\| null,/g) ?? []).length).toBe(2);
  });

  it("the DB side accepts a missing phone: profiles.phone is nullable and the signup trigger reads the metadata key", () => {
    const init = src("supabase/migrations/0001_init.sql");
    // nullable column: `phone text,` — NOT `phone text NOT NULL`
    expect(init).toMatch(/^\s*phone text,$/m);
    expect(init).not.toMatch(/^\s*phone text NOT NULL/m);
    // the handle_new_user trigger inserts the metadata key (NULL when absent)
    expect(init).toContain("raw_user_meta_data->>'phone'");
  });

  it("the other registration surfaces were ALREADY optional — pinned so they stay that way", () => {
    // coach self-register UI: the (optional) label, no required attr
    const coach = src("src/app/(en)/for-coaches/register/page.tsx");
    expect(coach).toContain("Phone (optional)");
    expect(coach).toContain("رقم الموبايل (اختياري)");
    expect((coach.match(/required/g) ?? []).length).toBe(3); // name + email + password only
    // invite adoption: the phone is optional in the request body contract
    const adopt = src("src/lib/auth-invite-adopt.ts");
    expect(adopt).toContain("phone?: string | null");
    expect(adopt).toContain("...(phone ? { phone } : {})");
    // the invite-complete API route treats phone as optional (cleanPhone precedent)
    const complete = src("src/app/api/auth/complete-invite/route.ts");
    expect(complete).toContain("phone: z.unknown().optional()");
  });
});
