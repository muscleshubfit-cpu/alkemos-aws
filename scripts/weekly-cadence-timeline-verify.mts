/**
 * scripts/weekly-cadence-timeline-verify.mts — compensation-timing probe
 * (BLOG-WEEKLY-COMPENSATION-REVIEW-2026-11-13, owner review order:
 * «راجع منطق التعويض الأسبوعي … واحسم التناقض الظاهري بين المدد»).
 *
 * Pure-local measuring instrument: imports the repo's OWN pure functions
 * (blog-pipeline-dispatch.ts · blog-queue.ts · blog-pairing.ts) — zero
 * reimplementation, zero network, zero DB — and prints the authoritative
 * timeline for each weekly slot plus the two claims under review:
 *   (A) the 23:40 UTC daily fire can compensate each slot (incl.
 *       Tuesday EN) — grace boundaries, per-fire decisions, margins;
 *   (B) the 137h cross-week claim (report §4): window freshness vs the
 *       ACTUAL selection order in findAdoptablePairRow (newest-first).
 *
 * Run from repo root: bun run scripts/weekly-cadence-timeline-verify.mts
 * (scripts/ is outside tsc/eslint scope by design — same as the other
 * dispatch-only instruments; see tsconfig.json exclude + eslint ignores.)
 */
import {
  AR_WEEKLY_SLOTS,
  EN_WEEKLY_SLOTS,
  expectedWeeklySlotsThrough,
  computeWeeklyTopUp,
} from "../src/lib/blog-pipeline-dispatch";
import { isoWeekStartUTC } from "../src/lib/blog-queue";
import { isAdoptablePairRow, extractSharedBrief } from "../src/lib/blog-pairing";

const MONDAY = new Date("2026-11-09T00:00:00Z"); // ISO week W-46 2026
const at = (iso: string) => new Date(iso);

function fmt(d: Date): string {
  return d.toISOString().replace(".000Z", "Z");
}

console.log("== A) SLOT TIMELINES (week of Monday", fmt(MONDAY), ") ==\n");

type SlotRow = {
  label: string;
  slot: Date;
  fire: Date; // first 23:40 fire whose day >= slot day
};
const slots: SlotRow[] = [
  { label: "AR slot 1 — Monday 05:00 UTC", slot: at("2026-11-09T05:00:00Z"), fire: at("2026-11-09T23:40:00Z") },
  { label: "EN slot 1 — Tuesday 22:00 UTC", slot: at("2026-11-10T22:00:00Z"), fire: at("2026-11-10T23:40:00Z") },
  { label: "AR slot 2 — Thursday 05:00 UTC", slot: at("2026-11-12T05:00:00Z"), fire: at("2026-11-12T23:40:00Z") },
  { label: "EN slot 2 — Friday 22:00 UTC", slot: at("2026-11-13T22:00:00Z"), fire: at("2026-11-13T23:40:00Z") },
];

for (const s of slots) {
  const graceEnd = new Date(s.slot.getTime() + 90 * 60_000);
  const marginMin = (s.fire.getTime() - graceEnd.getTime()) / 60_000;
  // expected at the fire instant (0 runs, 0 posts = totally missed):
  const decision = computeWeeklyTopUp({
    slots: s.label.startsWith("AR") ? AR_WEEKLY_SLOTS : EN_WEEKLY_SLOTS,
    now: s.fire,
    runsThisWeek: 0,
    postsThisWeek: 0,
  });
  console.log(`${s.label}`);
  console.log(`  slot:            ${fmt(s.slot)}`);
  console.log(`  grace ends:      ${fmt(graceEnd)}  (slot + 90 min)`);
  console.log(`  first 23:40 fire after grace: ${fmt(s.fire)}  (${marginMin} min after grace end)`);
  console.log(`  at that fire, if slot totally missed: expected=${decision.expected} missing=${decision.missing} topUpNow=${decision.topUpNow}`);
  // also: one minute BEFORE grace end — the slot must NOT be expected yet
  const before = new Date(graceEnd.getTime() - 60_000);
  const dBefore = expectedWeeklySlotsThrough(
    s.label.startsWith("AR") ? AR_WEEKLY_SLOTS : EN_WEEKLY_SLOTS,
    before,
  );
  const dAt = expectedWeeklySlotsThrough(
    s.label.startsWith("AR") ? AR_WEEKLY_SLOTS : EN_WEEKLY_SLOTS,
    graceEnd,
  );
  console.log(`  expected @ graceEnd-1min = ${dBefore} · @ graceEnd = ${dAt}  (grace boundary exact)`);
  console.log();
}

console.log("== A2) IN-FLIGHT COVER: a run created 1 min before the fire ==\n");
{
  // EN Tuesday: scheduled run delayed 100 min (created 23:39) — counted?
  const d = computeWeeklyTopUp({
    slots: EN_WEEKLY_SLOTS,
    now: at("2026-11-10T23:40:00Z"),
    runsThisWeek: 1, // the delayed run (in flight, conclusion null) — created 23:39
    postsThisWeek: 0,
  });
  console.log(`  Tue 23:40 fire, delayed scheduled run in flight (created 23:39): missing=${d.missing} topUpNow=${d.topUpNow}  -> no top-up (counted)`);
  const d2 = computeWeeklyTopUp({
    slots: EN_WEEKLY_SLOTS,
    now: at("2026-11-10T23:40:00Z"),
    runsThisWeek: 0, // run still not created (GitHub delay > 100 min)
    postsThisWeek: 0,
  });
  console.log(`  Tue 23:40 fire, scheduled run NOT yet created (>100 min delay): missing=${d2.missing} topUpNow=${d2.topUpNow}  -> top-up dispatched (race closed later by p5 daily guard)`);
}

console.log("\n== B) THE 137h CLAIM — window freshness vs SELECTION ==\n");
{
  // Twin T1b created Thu 05:00 week W (2026-11-12) by AR CREATE.
  const twin = {
    id: "11111111-2222-4333-8444-555555555555",
    language: "en",
    status: "researched",
    pair_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    created_at: "2026-11-12T05:00:00.000Z",
  };
  const nextTueEnSlot = at("2026-11-17T22:00:00Z");
  const ageH = (nextTueEnSlot.getTime() - Date.parse(twin.created_at)) / 3_600_000;
  console.log(`  T1b (created 2026-11-12T05:00Z) age at NEXT Tue 22:00 slot = ${ageH}h`);
  console.log(`  isAdoptablePairRow(T1b, en, now=nextTue) = ${isAdoptablePairRow(twin, "en", { now: nextTueEnSlot })}  (window math: 137 <= 144 OK)`);
  // But the SELECTION: newest-first. Next Monday's AR run creates T2 (2026-11-16T05:00Z).
  // findAdoptablePairRow orders created_at DESC and returns the FIRST row only.
  const candidates = [twin, { ...twin, id: "99999999-8888-4777-9666-555555555555", created_at: "2026-11-16T05:00:00.000Z" }];
  candidates.sort((a, b) => Date.parse(b.created_at!) - Date.parse(a.created_at!)); // DESC = the SQL ordering in findAdoptablePairRow
  const selected = candidates[0];
  console.log(`  findAdoptablePairRow ordering (created_at DESC) with T1b + T2 both adoptable -> SELECTS: created_at=${selected.created_at}  (the NEWER twin T2 — T1b starves)`);
  // And T1b at the following Friday slot:
  const nextFri = at("2026-11-20T22:00:00Z");
  const ageFri = (nextFri.getTime() - Date.parse(twin.created_at)) / 3_600_000;
  console.log(`  T1b age at NEXT Fri 22:00 slot = ${ageFri}h -> isAdoptablePairRow = ${isAdoptablePairRow(twin, "en", { now: nextFri })}  (EXPIRED > 144h — pair-2's AR article orphaned)`);
  // The brief freshness check agrees:
  const brief = (sealedAt: string) => ({
    sharedBrief: { pairId: twin.pair_id, topicEn: "progressive overload fundamentals", topicAr: "مبادئ التحميل التدريجي لبناء العضلات", angleId: "guide", sealedAt },
  });
  console.log(`  extractSharedBrief(T1b brief) at next Fri = ${extractSharedBrief(brief(twin.created_at), { now: nextFri }) === null ? "null (expired)" : "valid"}`);
  console.log(`  extractSharedBrief(T1b brief) at next Tue = ${extractSharedBrief(brief(twin.created_at), { now: nextTueEnSlot }) === null ? "null" : "valid (137h <= 144h)"}`);
}

console.log("\n== C) WEEK ROLLOVER — the backstop's same-week compensation scope ==\n");
{
  // EN Friday slot missed; fires available: Fri 23:40, Sat 23:40, Sun 23:40 (same ISO week).
  for (const iso of ["2026-11-13T23:40:00Z", "2026-11-14T23:40:00Z", "2026-11-15T23:40:00Z", "2026-11-16T23:40:00Z"]) {
    const now = at(iso);
    const d = computeWeeklyTopUp({ slots: EN_WEEKLY_SLOTS, now, runsThisWeek: 0, postsThisWeek: 0 });
    const ws = isoWeekStartUTC(now);
    console.log(`  fire ${iso} (week starts ${fmt(ws)}): expected=${d.expected} missing=${d.missing} topUpNow=${d.topUpNow}`);
  }
  console.log("  -> Monday 00:00 UTC rolls the week: the missed Friday slot is no longer compensable by the backstop.");
  console.log("     Only the 144h pairing window can still complete the pair (see B) — and B shows the selection order blocks it.");
}

console.log("\n== D) TWIN AGE at each same-week rescue fire (Thu-created twin, Friday slot missed) ==\n");
{
  const created = Date.parse("2026-11-12T05:00:00Z");
  for (const iso of ["2026-11-13T22:00:00Z", "2026-11-13T23:40:00Z", "2026-11-14T23:40:00Z", "2026-11-15T23:40:00Z"]) {
    const ageH = (at(iso).getTime() - created) / 3_600_000;
    console.log(`  twin created Thu 05:00 · consumed ${iso} -> age ${ageH.toFixed(2)}h (adoptable: ${ageH <= 144})`);
  }
}
