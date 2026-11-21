import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * ORGANIC-GROWTH-P1-I canaries (owner order 2026-11-21 — roadmap 10/P1-I +
 * 08-§2): «مراقبة أدوات AR في GSC أسبوعيًا وفق 08-§2 (تشغيل + سجل)».
 *
 * The «تشغيل» is the scheduled workflow + the read-only script; the «سجل»
 * is the monitoring log. These pins prevent the whole regression class:
 *
 *   1. WINDOW LAW — GSC execution opens 2026-11-30 (GSC-RE-AUDIT-2026-11-12
 *      + 08 header). The script guard must stay at that date AND the
 *      Monday cron must land exactly on the window opening.
 *   2. READ-ONLY BY CONSTRUCTION — webmasters.readonly scope; the only
 *      Google endpoints are sites.list + searchAnalytics/query; the only
 *      repository mutation is the monitoring log; the workflow token
 *      never gets contents:write.
 *   3. THE AR-TOOLS FAMILY — the six URL patterns pinned against the real
 *      app routes (the 06-§1 inventory T1-T10 mirrors + hub; T11
 *      /ar/diet-plan deliberately EXCLUDED as its own 08-§2.1 family).
 *   4. PROTOCOL THRESHOLDS — the 08-§2.1 letter: ≥50 rising · ≥100
 *      impressions & CTR<1% & position 5-20 · one-step 11-20. No
 *      invented floors.
 *   5. LOG CONTRACT — markers, retention caps, protocol header, and the
 *      registry/CI-GATES rows that keep the docs gates green.
 *   6. COMMIT DISCIPLINE — GIT-IDENTITY law email on the automated
 *      weekly push, REPO_ACCESS_TOKEN rides it, temp credentials cleaned.
 *
 * P1-I-FIX (owner order 2026-11-21 «راجع وأصلح خلل استعلامات GSC في
 * P1-I المكتشف في scripts/gsc-ar-weekly-report.py»): the original
 * query layer built SIX per-filter dimensionFilterGroups typed "or".
 * The Search Console API ANDs the groups (official reference: "All
 * filter groups must match in order for a row to be returned") and
 * groupType "or" is documented NOT YET SUPPORTED — so the six groups
 * demanded a page containing all six family patterns at once: zero
 * matching rows, silently. The repair ships ONE "and" group holding
 * ONE page filter with operator includingRegex whose single RE2
 * expression alternates the six escaped family patterns. The FIX
 * block below verifies the ACTUAL request structure and its real
 * semantics by SPAWNING the python selftest (`--selftest` — pure
 * construction, no network/secrets/log writes) — not script-text
 * presence. python3 is already a hard battery requirement here (the
 * docs gates + the weekly workflow itself run python3).
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const WORKFLOW_PATH = ".github/workflows/gsc-ar-weekly-monitor.yml";
const SCRIPT_PATH = "scripts/gsc-ar-weekly-report.py";
const LOG_PATH =
  "docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md";

const workflow = read(WORKFLOW_PATH);
const script = read(SCRIPT_PATH);
const logDoc = read(LOG_PATH);

/** The AR-tools family — the single source lives in the script; pinned
 * verbatim here so any change must update this canary consciously. */
const AR_TOOLS_FAMILY = [
  "https://alkemos.com/ar/tools",
  "https://alkemos.com/ar/meal-planner",
  "https://alkemos.com/ar/ai-meal-planner",
  "https://alkemos.com/ar/ai-workout-planner",
  "https://alkemos.com/ar/macro-tracker",
  "https://alkemos.com/ar/workout-tracker",
];

describe("P1-I workflow — schedule, window, read-only posture", () => {
  it("runs weekly on Mondays 06:20 UTC and is manually dispatchable", () => {
    expect(workflow).toMatch(/cron:\s*"20 6 \* \* 1"/);
    expect(workflow).toContain("workflow_dispatch:");
  });

  it("the 2026-11-30 window opening IS a Monday — the cron lands on it", () => {
    // The window law date, verified against the calendar, not the prose.
    const windowOpens = new Date(Date.UTC(2026, 10, 30)); // month is 0-based
    expect(windowOpens.toISOString().slice(0, 10)).toBe("2026-11-30");
    expect(windowOpens.getUTCDay()).toBe(1); // Monday
    // and the cron's day-of-week is Monday
    const cron = workflow.match(/cron:\s*"([^"]+)"/)![1];
    expect(cron.split(/\s+/)[4]).toBe("1");
    // first fire (Mon 2026-11-23) is BEFORE the window: documented no-op
    expect(workflow).toContain("2026-11-23");
  });

  it("GITHUB_TOKEN stays read-only — the push rides the owner PAT", () => {
    expect(workflow).toContain("contents: read");
    expect(workflow).not.toContain("contents: write");
    expect(workflow).toContain("REPO_ACCESS_TOKEN: ${{ secrets.REPO_ACCESS_TOKEN }}");
    // 343-FIXUP-3: the checkout extraheader must be dropped before the push
    expect(workflow).toContain("http.https://github.com/.extraheader");
    // landing on main is VERIFIED, not assumed
    expect(workflow).toContain("ls-remote");
  });

  it("consumes the GSC service-account secret and cleans temp credentials", () => {
    expect(workflow).toContain("GOOGLE_SEARCH_CONSOLE_CREDENTIALS");
    expect(workflow).toMatch(/Delete temporary credential files/);
    expect(workflow).toMatch(/if:\s*always\(\)/);
    expect(workflow).toContain("gsc-sa-key.pem");
  });

  it("commits with the GIT-IDENTITY law email (automated weekly push)", () => {
    expect(workflow).toContain('git config user.email "muscleshubfit@gmail.com"');
    expect(workflow).toContain('git config user.name "alkemos-gsc-monitor"');
    // docs-only push — the retired [vercel skip] marker must NOT return
    expect(workflow).not.toContain("[vercel skip]");
  });

  it("commits ONLY the monitoring log path", () => {
    expect(workflow).toContain(
      "git add docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md",
    );
  });
});

describe("P1-I script — window guard, read-only API surface, protocol", () => {
  it("enforces the 2026-11-30 window BEFORE any network or credential work", () => {
    expect(script).toContain("WINDOW_OPENS = dt.date(2026, 11, 30)");
    const guardIdx = script.indexOf("if run_date < WINDOW_OPENS:");
    // execution order inside main(): guard first, then credentials, then
    // the auth CALL (not the module-level function definition).
    const credsIdx = script.indexOf('os.environ.get("GSC_CREDENTIALS"');
    const authCallIdx = script.indexOf("access_token = get_access_token(sa, private_key)");
    const queryCallIdx = script.indexOf("query_api(PRIMARY, auth_headers");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(credsIdx);
    expect(guardIdx).toBeLessThan(authCallIdx);
    expect(guardIdx).toBeLessThan(queryCallIdx);
    // a guarded no-op exits 0 (honest state, not a failure)
    const guardedReturn = script.indexOf("return 0", guardIdx);
    expect(guardedReturn).toBeGreaterThan(-1);
    expect(guardedReturn).toBeLessThan(credsIdx);
  });

  it("read-only scope and the ONLY two Google endpoints", () => {
    expect(script).toContain(
      'SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"',
    );
    expect(script).toContain("/sites");
    expect(script).toContain("/searchAnalytics/query");
    // the retired-class endpoints must never appear
    for (const forbidden of [
      "urlInspection",
      "indexing.googleapis.com",
      "webmasters/v3/sites/https",
      "PUT",
      "DELETE",
    ]) {
      expect(script).not.toContain(forbidden);
    }
  });

  it("queries settled web data only (dataState=final, searchType=web)", () => {
    expect(script).toContain('"dataState": "final"');
    expect(script).toContain('"searchType": "web"');
    expect(script).toContain('PRIMARY = "sc-domain:alkemos.com"');
  });

  it("pins the 08-§2.1 protocol thresholds verbatim — no invented floors", () => {
    expect(script).toContain("RISING_IMPS = 50");
    expect(script).toContain("CTR_OPP_IMPS = 100");
    expect(script).toContain("CTR_OPP_CTR_MAX = 0.01");
    expect(script).toContain("CTR_OPP_POS = (5, 20)");
    expect(script).toContain("ONE_STEP_POS = (11, 20)");
  });

  it("retention: 12 weekly + 12 monthly, newest first, same-window dedup", () => {
    expect(script).toContain("RETAIN_WEEKLY = 12");
    expect(script).toContain("RETAIN_MONTHLY = 12");
    expect(script).toContain("[dedup]");
    expect(script).toContain("kept = ([entry] + deduped)[:retain]");
  });

  it("months ending before the window are out of the log's scope", () => {
    // October 2026 and earlier belong to the 08-§1 baseline tables, never
    // to this log (the Nov-30 first run must NOT write an October summary).
    expect(script).toContain("if prev_month_end < WINDOW_OPENS:");
  });
});

describe("P1-I AR-tools family — pinned against the real app routes", () => {
  it("the six URL patterns live verbatim in the script", () => {
    for (const pattern of AR_TOOLS_FAMILY) {
      expect(script).toContain(`"${pattern}",`);
    }
  });

  it("every pattern resolves to a REAL route in the (ar) tree", () => {
    for (const pattern of AR_TOOLS_FAMILY) {
      // The (ar) route group maps 1:1 onto the /ar URL prefix.
      const route = pattern.replace("https://alkemos.com", "");
      const page = `src/app/(ar)${route}/page.tsx`;
      expect(
        existsSync(resolve(process.cwd(), page)),
        `${page} must exist (family pattern ${pattern})`,
      ).toBe(true);
    }
  });

  it("the /ar/tools hub carries the five calculators/trackers (T1-T5)", () => {
    for (const tool of [
      "calorie-calculator",
      "bmi-calculator",
      "macro-calculator",
      "body-fat-calculator",
      "water-tracker",
    ]) {
      expect(
        existsSync(resolve(process.cwd(), `src/app/(ar)/ar/tools/${tool}/page.tsx`)),
        `/ar/tools/${tool} must exist`,
      ).toBe(true);
    }
  });

  it("T11 /ar/diet-plan is deliberately EXCLUDED (its own 08-§2.1 family)", () => {
    const familyBlock = script.slice(
      script.indexOf("AR_TOOLS_PAGE_CONTAINS = ["),
      script.indexOf("]", script.indexOf("AR_TOOLS_PAGE_CONTAINS = [")),
    );
    expect(familyBlock).not.toContain("diet-plan");
  });
});

describe("P1-I monitoring log — the «سجل» contract", () => {
  it("carries the two section markers the script inserts under", () => {
    expect(logDoc).toContain("<!-- P1I:WEEKLY -->");
    expect(logDoc).toContain("<!-- P1I:MONTHLY -->");
  });

  it("documents the window law, the schedule and the first reading date", () => {
    expect(logDoc).toContain("2026-11-30");
    expect(logDoc).toContain("06:20 UTC");
    expect(logDoc).toContain("no-op");
  });

  it("maps every weekly field to its 08-§2.1 protocol item", () => {
    for (const item of [
      "كلمات صاعدة",
      "فرص CTR",
      "صفحات على بعد خطوة",
      "خريطة استعلام←صفحة",
      "القراءة الشهرية الموثقة",
    ]) {
      expect(logDoc).toContain(item);
    }
    // the §2.2 permanent rules, verbatim in spirit
    expect(logDoc).toContain("لا قرار محتوى من GSC قبل النشر");
    expect(logDoc).toContain("لا أرقام عائمة");
  });

  it("classifies its numbers as actual measurements (12-§3 honesty)", () => {
    expect(logDoc).toContain("قياس فعلي");
  });

  it("starts EMPTY — readings only from the 2026-11-30 window", () => {
    expect(logDoc).not.toMatch(/<!-- entry:(weekly|monthly):/);
    expect(logDoc).toContain("لا مدخلات بعد");
  });

  it("declares the retention and the AR-tools family scope", () => {
    expect(logDoc).toMatch(/12 مدخلًا أسبوعيًا/);
    expect(logDoc).toContain("T10");
    expect(logDoc).toContain("T11 `/ar/diet-plan` مستبعد");
  });
});

describe("P1-I registry + gates rows (born-archived law, checks M/N)", () => {
  it("docs/README.md registers the monitoring log", () => {
    const registry = read("docs/README.md");
    expect(registry).toContain(
      "docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md",
    );
  });

  it("docs/CI_GATES.md covers the new workflow (check N — same commit)", () => {
    const ciGates = read("docs/CI_GATES.md");
    expect(ciGates).toContain("gsc-ar-weekly-monitor.yml");
  });

  it("the script writes to the registered log path only", () => {
    expect(script).toContain(
      'LOG_PATH = REPO / "docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md"',
    );
  });
});

describe("P1-I FIX — the API request contract (structure AND semantics)", () => {
  // The dimensionFilterGroups repair (owner order 2026-11-21): the
  // retired build attached six per-filter groups typed "or" — the API
  // ANDs groups and "or" is documented not-yet-supported, so the
  // family queries would have matched ZERO pages, silently. These
  // tests verify the ACTUAL request construction and its real
  // semantics — the class of bug text-presence canaries cannot see.

  it("the python --selftest passes (real payload construction + semantics)", () => {
    // Pure construction: no network, no secrets, no log writes — it
    // runs before AND after the 2026-11-30 window. python3 is already
    // a hard repo battery requirement (docs gates + the weekly
    // workflow itself), so this adds no new dependency.
    const res = spawnSync("python3", [SCRIPT_PATH, "--selftest"], {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    expect(
      res.status,
      `selftest exited ${res.status}\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`,
    ).toBe(0);
    expect(res.stdout).toContain("P1-I-FIX selftest");
    expect(res.stdout).toContain("PASS");
    // the semantics battery really ran (family matches + non-family
    // rejects), not just the header
    expect(res.stdout).toContain("match: https://alkemos.com/ar/tools/calorie-calculator");
    expect(res.stdout).toContain("no-match: https://alkemos.com/ar/diet-plan");
    expect(res.stdout).toContain("no-match: https://alkemos.com/tools/calorie-calculator");
  });

  it("attaches exactly ONE filter group — the retired per-family groups are gone", () => {
    // one group, always — never a list comprehension of per-filter groups
    expect(script).toContain('payload["dimensionFilterGroups"] = [filter_group]');
    expect(script).not.toContain('"groupType": "or"');
    expect(script).not.toContain('"filters": [f]} for f in filters');
  });

  it("the family rides ONE includingRegex (RE2) page filter in an 'and' group", () => {
    expect(script).toContain('"groupType": "and"');
    expect(script).toContain('"operator": "includingRegex"');
    expect(script).toContain('def ar_page_regex():');
    // the expression is DERIVED from the pinned family list (single
    // source of truth), escaped for RE2, with the (?i) contains parity
    expect(script).toContain('return "(?i)" + "|".join(re.escape(p) for p in AR_TOOLS_PAGE_CONTAINS)');
    // the retired contains-operator family filter must not return
    expect(script).not.toContain('"operator": "contains"');
  });

  it("every family call site passes the single filter group (7 queries)", () => {
    // 5 weekly (ar7, ar28, queries, pages, pairs) + 2 monthly — all
    // switch to filter_group=ar_filter_group(); the property-context
    // totals pass none. Counted inside main()'s body only (the
    // selftest's own payload battery repeats the call by design).
    const mainBody = script.slice(
      script.indexOf("def main():"),
      script.indexOf("------------- selftest"),
    );
    expect(mainBody.length).toBeGreaterThan(0);
    const sites = mainBody.split("filter_group=ar_filter_group()").length - 1;
    expect(sites).toBe(7);
    // and no call site still passes the retired filters= parameter
    expect(script).not.toContain("filters=ar_filters()");
  });
});
