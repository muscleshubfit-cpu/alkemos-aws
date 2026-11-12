/**
 * email-exact-match.test.ts — W1-2a (S-04) / Phase 330 (owner order
 * 2026-10-02 «ابدأ البند التالى» — executing the approved plan
 * docs/FULL-STACK-AUDIT-AND-REMEDIATION-PLAN-2026-10-02.md §6.2 row
 * W1-2a): email existence lookups are EXACT, never a pattern.
 *
 * The audit finding (S-04): four routes matched emails with
 * `.ilike("email", email)` — user input became a MATCH PATTERN
 * (`a%@x.com` matched `ahmed@x.com`): a wider-than-exact existence
 * check (account-state enumeration oracle) + false 409 rejections of
 * legitimate registrations/invites.
 *
 * Two layers, same file:
 *
 *   A. SOURCE PINS — the four S-04 routes use
 *      `.eq("email", email.toLowerCase())` (emails are stored
 *      lowercase — the zod emailSchema lowercases), no `.ilike("email"`
 *      remains, and coach/register's TWO already_registered exits
 *      carry the ONE unified 409 message.
 *
 *   B. ROUTE BEHAVIOR — the routes against an in-memory profiles store
 *      whose `.eq` is EXACT equality and whose `.ilike` is a FAITHFUL
 *      Postgres ILIKE translation (kept so any regression to pattern
 *      matching fails these canaries):
 *        1. pattern email → NO false 409 (register/invite), NO other
 *           person's row surfaced (resend/complete-invite)
 *        2. exact email  → the honest answer (409 / resend / adoption)
 *        3. UPPERCASE in → zod lowercases → the exact match still fires
 *        4. createUser 422 → the SAME unified 409 message
 *
 * Scope note: S-04 lists exactly these four routes (the plan's row);
 * admin/staff's own ilike usage is a DIFFERENT surface (admin-gated,
 * not in S-04's location list) — outside this frame, untouched.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-server", () => ({
  // a signed-in coach for the staff-gated invite/resend routes
  requireCoach: vi.fn(async () => ({
    id: "coach-1",
    role: "coach",
    full_name: "Test Coach",
  })),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 99,
    resetAt: Date.now() + 60_000,
  })),
  clientIp: vi.fn(() => "127.0.0.1"),
}));
vi.mock("@/lib/password-breach", () => ({
  // no HIBP network call from the canary (fail-open path not under test)
  passwordBreachCount: vi.fn(async () => 0),
}));
vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        inviteUserByEmail: vi.fn(),
        getUserById: vi.fn(),
        updateUserById: vi.fn(),
      },
    },
  },
}));

import { POST as registerRoute } from "@/app/api/coach/register/route";
import { POST as completeInviteRoute } from "@/app/api/auth/complete-invite/route";
import { POST as inviteRoute } from "@/app/api/coach/clients/invite/route";
import { POST as resendRoute } from "@/app/api/coach/clients/invite/resend/route";
import { supabaseAdmin } from "@/lib/supabase/admin";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const S04_ROUTES = [
  "src/app/api/coach/register/route.ts",
  "src/app/api/auth/complete-invite/route.ts",
  "src/app/api/coach/clients/invite/route.ts",
  "src/app/api/coach/clients/invite/resend/route.ts",
];

/** The ONE 409 answer of coach/register (both already_registered paths). */
const UNIFIED_409 =
  "هذا البريد الإلكتروني مسجَّل بالفعل — سجّل دخولك من صفحة تسجيل الدخول أو استخدم بريدًا آخر";

// ══════════════════════════════════════════════════════════════════════
// A. SOURCE PINS — the sweep law (S-04 fix direction, verbatim)
// ══════════════════════════════════════════════════════════════════════
describe("W1-2a source pins (S-04)", () => {
  it("every S-04 route matches the email EXACTLY (eq + toLowerCase) — zero ilike", () => {
    for (const rel of S04_ROUTES) {
      const src = read(rel);
      expect(src, rel).toContain('.eq("email", email.toLowerCase())');
      expect(src, rel).not.toContain('.ilike("email"');
    }
  });

  it("the stored-lowercase contract holds: emailSchema trims + lowercases (eq's correctness depends on it)", () => {
    const schemas = read("src/lib/validation/schemas.ts");
    expect(schemas).toMatch(
      /export const emailSchema[\s\S]*?\.trim\(\)\s*\.toLowerCase\(\)/,
    );
  });

  it("coach/register: BOTH already_registered exits carry the ONE unified 409 message", () => {
    const route = read("src/app/api/coach/register/route.ts");
    const codeHits = route.split('"already_registered"').length - 1;
    const msgHits = route.split(UNIFIED_409).length - 1;
    expect(codeHits).toBe(2); // the profile check + the createUser-422 fallback
    expect(msgHits).toBe(2); // every one of them carries the unified message
    // the OLD short divergent variant is gone:
    expect(route).not.toContain("سجّل دخول أو استخدم بريدًا تاني");
  });
});

// ══════════════════════════════════════════════════════════════════════
// B. ROUTE BEHAVIOR — the exact-match DB double
// ══════════════════════════════════════════════════════════════════════

type ProfileRow = {
  id: string;
  email: string;
  role: string;
  full_name?: string | null;
  // W1-2c (S-05, migration 0099): the single-consumption adoption
  // claim — the conditional-update mock below honors it atomically.
  invite_adopted_at?: string | null;
};

const db = {
  profiles: [] as ProfileRow[],
  createdUsers: [] as { email: string }[],
  invited: [] as { email: string; data?: Record<string, unknown> }[],
  updatedPasswords: [] as string[],
  adminNotifications: 0,
  brevoBodies: [] as Record<string, unknown>[],
  createUserError: null as { code?: string; message?: string } | null,
  gtu: null as { invited_at?: string | null; last_sign_in_at?: string | null } | null,
};

const resetDb = () => {
  db.profiles = [];
  db.createdUsers = [];
  db.invited = [];
  db.updatedPasswords = [];
  db.adminNotifications = 0;
  db.brevoBodies = [];
  db.createUserError = null;
  db.gtu = null;
};

/** Postgres ILIKE → RegExp: % = any run, _ = one char, case-insensitive.
 *  Kept FAITHFUL so a regression to `.ilike` fails these canaries. */
const ilikeToRegex = (pattern: string) =>
  new RegExp(
    "^" +
      pattern
        .replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".") +
      "$",
    "i",
  );

const fetchMock = vi.fn(async (_url: unknown, init?: { body?: string }) => {
  if (init?.body) db.brevoBodies.push(JSON.parse(init.body));
  return { ok: true, status: 200, text: async () => "" } as unknown as Response;
});

/** Wire the supabaseAdmin mock: `.eq` = EXACT equality (the W1-2a law),
 *  `.ilike` = faithful pattern translation (the OLD behavior). */
const installDb = () => {
  const client = supabaseAdmin as unknown as {
    from: ReturnType<typeof vi.fn>;
    auth: {
      admin: {
        createUser: ReturnType<typeof vi.fn>;
        inviteUserByEmail: ReturnType<typeof vi.fn>;
        getUserById: ReturnType<typeof vi.fn>;
        updateUserById: ReturnType<typeof vi.fn>;
      };
    };
  };

  client.auth.admin.createUser.mockImplementation(
    async ({ email }: { email: string }) => {
      if (db.createUserError) {
        return { data: { user: null }, error: db.createUserError };
      }
      db.createdUsers.push({ email });
      return { data: { user: { id: "u-created-1" } }, error: null };
    },
  );
  client.auth.admin.inviteUserByEmail.mockImplementation(
    async (email: string, opts?: { data?: Record<string, unknown> }) => {
      db.invited.push({ email, data: opts?.data });
      return { data: { user: { id: "u-invited-1" } }, error: null };
    },
  );
  client.auth.admin.getUserById.mockImplementation(async () => ({
    data: { user: db.gtu },
    error: null,
  }));
  client.auth.admin.updateUserById.mockImplementation(
    async (_id: string, patch: { password?: string }) => {
      db.updatedPasswords.push(patch.password ?? "");
      return { error: null };
    },
  );

  client.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      type Cond = [string, unknown];
      const rows = () => db.profiles;
      const matches = (r: ProfileRow, conds: Cond[]) =>
        conds.every(
          ([c, v]) => (r as unknown as Record<string, unknown>)[c] === v,
        );
      const eqChain = (conds: Cond[]) => ({
        eq: (c: string, v: unknown) => eqChain([...conds, [c, v]]),
        maybeSingle: async () => ({
          data: rows().find((r) => matches(r, conds)) ?? null,
          error: null,
        }),
        // the admin lookup: .eq("role","admin").order().limit(1).maybeSingle()
        order: () => ({
          limit: () => ({
            maybeSingle: async () => ({
              data: rows().find((r) => matches(r, conds)) ?? null,
              error: null,
            }),
          }),
        }),
        // the OLD matcher — kept faithful (regression tripwire)
        ilike: (c: string, v: string) => ({
          maybeSingle: async () => ({
            data:
              (c === "email" ? rows().find((r) => ilikeToRegex(v).test(r.email)) : undefined) ??
              null,
            error: null,
          }),
        }),
      });
      return {
        select: () => eqChain([]),
        // W1-2c: composable conditional-update chain — .eq()/.is()
        // accumulate predicates, .select().maybeSingle() applies the
        // patch ONLY to the row matching ALL of them (the atomic
        // claim contract: 0 rows matched → data:null, nothing written).
        update: (patch: Record<string, unknown>) => {
          const updChain = (conds: Cond[]) => ({
            eq: (c: string, v: unknown) => updChain([...conds, [c, v]]),
            is: (c: string, v: unknown) => updChain([...conds, [c, v]]),
            select: () => ({
              maybeSingle: async () => {
                const row = rows().find((r) => matches(r, conds));
                if (row) Object.assign(row, patch);
                return { data: row ? { id: row.id } : null, error: null };
              },
            }),
          });
          return updChain([]);
        },
        upsert: async () => ({ error: null }),
        insert: async () => ({ error: null }),
      };
    }
    if (table === "admin_notifications") {
      return {
        insert: async () => {
          db.adminNotifications += 1;
          return { error: null };
        },
      };
    }
    if (table === "tool_leads") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
        insert: async () => ({ error: null }),
        update: () => ({ eq: () => ({}) }),
      };
    }
    // coach_emails / coach_wallets / coach_assignments upserts
    return {
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    };
  });
};

const req = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  vi.clearAllMocks();
  resetDb();
  installDb();
  vi.stubGlobal("fetch", fetchMock);
  process.env.BREVO_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BREVO_API_KEY;
});

// ── coach/register ─────────────────────────────────────────────────────
describe("coach/register — exact email existence", () => {
  it("a pattern-shaped email is NOT somebody else's account (the S-04 false 409)", async () => {
    db.profiles = [{ id: "p-1", email: "ahmed@example.com", role: "client" }];
    const res = await registerRoute(
      req("/api/coach/register", {
        full_name: "كوتش جديد",
        email: "a%@example.com", // under ILIKE this matched ahmed@…
        password: "Password1234",
      }),
    );
    expect(res.status).toBe(200); // NOT the false 409
    expect(await res.json()).toEqual({ ok: true });
    expect(db.createdUsers).toEqual([{ email: "a%@example.com" }]);
  });

  it("an exact registered email → honest 409 already_registered (unified message)", async () => {
    db.profiles = [{ id: "p-1", email: "ahmed@example.com", role: "client" }];
    const res = await registerRoute(
      req("/api/coach/register", {
        full_name: "كوتش جديد",
        email: "ahmed@example.com",
        password: "Password1234",
      }),
    );
    expect(res.status).toBe(409);
    const json = (await res.json()) as { error: string; message: string };
    expect(json.error).toBe("already_registered");
    expect(json.message).toBe(UNIFIED_409);
    expect(db.createdUsers).toHaveLength(0);
  });

  it("UPPERCASE input → zod lowercases → the exact match still fires", async () => {
    db.profiles = [{ id: "p-1", email: "ahmed@example.com", role: "client" }];
    const res = await registerRoute(
      req("/api/coach/register", {
        full_name: "كوتش جديد",
        email: "AHMED@EXAMPLE.COM",
        password: "Password1234",
      }),
    );
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: string }).error).toBe("already_registered");
  });

  it("createUser 422 (auth row without a profile) → the SAME unified 409 message", async () => {
    db.createUserError = { code: "422", message: "already registered" };
    const res = await registerRoute(
      req("/api/coach/register", {
        full_name: "كوتش جديد",
        email: "stray@example.com",
        password: "Password1234",
      }),
    );
    expect(res.status).toBe(409);
    const json = (await res.json()) as { error: string; message: string };
    expect(json.error).toBe("already_registered");
    expect(json.message).toBe(UNIFIED_409);
  });
});

// ── coach/clients/invite ───────────────────────────────────────────────
describe("coach invite — exact email existence", () => {
  it("a pattern-shaped email does NOT borrow another account's 409 — the invite proceeds", async () => {
    db.profiles = [{ id: "p-1", email: "ahmed@example.com", role: "client" }];
    const res = await inviteRoute(
      req("/api/coach/clients/invite", { email: "a%@example.com" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      action: "invited",
      email: "a%@example.com",
    });
    // the invite carries the coach_id attribution metadata (0033 law)
    expect(db.invited).toEqual([
      { email: "a%@example.com", data: { coach_id: "coach-1" } },
    ]);
  });

  it("an exact existing client → honest 409 already_registered_client", async () => {
    db.profiles = [{ id: "p-1", email: "ahmed@example.com", role: "client" }];
    const res = await inviteRoute(
      req("/api/coach/clients/invite", { email: "ahmed@example.com" }),
    );
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: string }).error).toBe(
      "already_registered_client",
    );
    expect(db.invited).toHaveLength(0);
  });
});

// ── coach/clients/invite/resend ────────────────────────────────────────
describe("invite resend — exact pending-invite lookup", () => {
  it("a pattern-shaped email surfaces NOBODY else's pending invite (404, no mail sent)", async () => {
    db.profiles = [{ id: "p-1", email: "victim@example.com", role: "client" }];
    const res = await resendRoute(
      req("/api/coach/clients/invite/resend", { email: "v%@example.com" }),
    );
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe("not_found");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("the exact pending invitee is re-notified — ONE Brevo call to that email", async () => {
    db.profiles = [{ id: "p-1", email: "victim@example.com", role: "client" }];
    db.gtu = { invited_at: "2026-09-01T00:00:00Z", last_sign_in_at: null };
    const res = await resendRoute(
      req("/api/coach/clients/invite/resend", { email: "victim@example.com" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      action: "reinvited",
      email: "victim@example.com",
    });
    expect(db.brevoBodies).toHaveLength(1);
    expect(db.brevoBodies[0]).toMatchObject({
      to: [{ email: "victim@example.com" }],
    });
  });
});

// ── auth/complete-invite ──────────────────────────────────────────────
describe("complete-invite — exact profile lookup (adoption gate)", () => {
  it("a pattern-shaped email → the uniform non-committal {ok:false} (anti-enumeration intact)", async () => {
    db.profiles = [{ id: "p-1", email: "real@example.com", role: "client" }];
    const res = await completeInviteRoute(
      req("/api/auth/complete-invite", {
        email: "r%@example.com",
        password: "Password1234",
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: false });
    expect(db.updatedPasswords).toHaveLength(0);
  });

  it("the exact adoptable invitee → the adoption proceeds (password written)", async () => {
    db.profiles = [{ id: "p-1", email: "real@example.com", role: "client", invite_adopted_at: null }];
    db.gtu = { invited_at: "2026-09-01T00:00:00Z", last_sign_in_at: null };
    const res = await completeInviteRoute(
      req("/api/auth/complete-invite", {
        email: "real@example.com",
        password: "ChosenPass123",
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(db.updatedPasswords).toEqual(["ChosenPass123"]);
  });
});
