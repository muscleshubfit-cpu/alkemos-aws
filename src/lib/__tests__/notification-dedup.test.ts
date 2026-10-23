import { describe, it, expect, beforeEach } from "vitest";
import {
  createNotificationDeduped,
  createNotification,
  type NotificationRow,
} from "@/lib/data/notifications";
import { read } from "@/lib/data/helpers";

/**
 * NOTIF→PLAN 2026-10-24 (owner order item 1 — تكرار الإشعارات): the dedup
 * guard battery. Runs on the localStorage path (the test env has no
 * Supabase env — isSupabaseConfigured=false, the same path the demo mode
 * exercises). The live-DB duplicate classes this guard closes:
 * plan_activated 5-53s apart (double-click/retry on the same approval),
 * questionnaire_status double-fires, subscription approve/reject retries.
 */

const LS_KEY = "mhe:notifs";

const recentRow = (over: Partial<NotificationRow> = {}): NotificationRow => ({
  id: `row-${Math.random().toString(36).slice(2, 8)}`,
  user_id: "user-1",
  type: "plan_activated",
  title: "تم تفعيل خطة جديدة لك!",
  body: "خطتك الجديدة جاهزة الآن.",
  link: "/plans",
  read: false,
  created_at: new Date().toISOString(),
  payload: {},
  ...over,
});

describe("createNotificationDeduped — the member-bell dedup guard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inserts when no matching row exists", async () => {
    const row = await createNotificationDeduped(
      "user-1", "plan_activated", "t", "b", "/plans",
      { plan_id: "p1" }, { key: "plan_id", value: "p1" },
    );
    expect(row).toBeTruthy();
    const all = read<NotificationRow[]>(LS_KEY, []);
    expect(all).toHaveLength(1);
    expect(all[0].payload).toEqual({ plan_id: "p1" });
  });

  it("SKIPS the insert when the same (user, type, key) exists inside the window — the live duplicate class", async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([recentRow({ payload: { plan_id: "p1" } })]),
    );
    const before = read<NotificationRow[]>(LS_KEY, []);
    const row = await createNotificationDeduped(
      "user-1", "plan_activated", "t", "b", "/plans",
      { plan_id: "p1" }, { key: "plan_id", value: "p1" },
    );
    // Returns the EXISTING row — the bell never rings twice for one approval.
    expect(row.id).toBe(before[0].id);
    expect(read<NotificationRow[]>(LS_KEY, [])).toHaveLength(1);
  });

  it("a DIFFERENT event key (another plan approved seconds later) still rings", async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([recentRow({ payload: { plan_id: "p1" } })]),
    );
    await createNotificationDeduped(
      "user-1", "plan_activated", "t", "b", "/plans",
      { plan_id: "p2" }, { key: "plan_id", value: "p2" },
    );
    expect(read<NotificationRow[]>(LS_KEY, [])).toHaveLength(2);
  });

  it("an expired window no longer dedups (the member may legitimately re-activate later)", async () => {
    const stale = recentRow({
      payload: { plan_id: "p1" },
      created_at: new Date(Date.now() - 10 * 60 * 1000 - 1000).toISOString(),
    });
    localStorage.setItem(LS_KEY, JSON.stringify([stale]));
    await createNotificationDeduped(
      "user-1", "plan_activated", "t", "b", "/plans",
      { plan_id: "p1" }, { key: "plan_id", value: "p1", windowMs: 5 * 60 * 1000 },
    );
    expect(read<NotificationRow[]>(LS_KEY, [])).toHaveLength(2);
  });

  it("different users never collide on the same key", async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([recentRow({ user_id: "user-2", payload: { plan_id: "p1" } })]),
    );
    await createNotificationDeduped(
      "user-1", "plan_activated", "t", "b", "/plans",
      { plan_id: "p1" }, { key: "plan_id", value: "p1" },
    );
    expect(read<NotificationRow[]>(LS_KEY, [])).toHaveLength(2);
  });

  it("without a dedup descriptor it behaves exactly like createNotification", async () => {
    await createNotificationDeduped("user-1", "plan_activated", "t", "b", "/plans", { plan_id: "p1" });
    await createNotificationDeduped("user-1", "plan_activated", "t", "b", "/plans", { plan_id: "p1" });
    expect(read<NotificationRow[]>(LS_KEY, [])).toHaveLength(2);
  });

  it("createNotification itself stays the plain (legacy) insert", async () => {
    await createNotification("user-1", "coach_message", "t", "b", "/dashboard");
    await createNotification("user-1", "coach_message", "t", "b", "/dashboard");
    expect(read<NotificationRow[]>(LS_KEY, [])).toHaveLength(2);
  });
});
