import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  supportTicketBodySchema,
  TICKET_STATUSES,
} from "@/lib/validation/schemas";
import { getPrimaryAdminId } from "@/lib/notifications-server";

/**
 * STAFF side of CLIENT support tickets (Phase 55 fix).
 *
 * Owner report (2026-08-31): «رسائل الدعم لا تصل الى صندوق الدعم ، فقط
 * يصل اشعار بها» — the ticket WAS saved and the notification WAS created
 * (both fine), but the inbox at /coach/support read support_tickets
 * DIRECTLY from the browser (supabase-js + RLS + a named-FK embed).
 * Any failure there (RLS function missing, FK embed name mismatch, …)
 * silently returned [] → empty inbox. Notifications kept arriving.
 *
 * Fix: staff reads/writes now run SERVER-side through this route with
 * the service key (mirrors /api/admin/coach-support). No migration, no
 * RLS dependence, no embed-name dependence.
 *
 * GET  /api/support/tickets                 → list tickets
 *        admin  → ALL tickets
 *        coach  → tickets of his assigned clients only
 * GET  /api/support/tickets?ticketId=<uuid> → one ticket's messages
 * POST /api/support/tickets                 → staff reply / status change
 *        { ticketId, body?, status? }
 *
 * A reply sets the ticket to "pending" (client's cue that staff answered,
 * same rule as the M19 client-side fix) and notifies the client's bell.
 *
 * Wave 2B (2026-09-17): the POST body passes the central zod gate
 * (supportTicketBodySchema — trim + subject ≤200 · body ≤4000 ceilings
 * + status allowlist + unknown-key stripping). The three legacy
 * bad_request classes (member «اكتب موضوعًا ونصًا للرسالة» · staff
 * «لا يوجد رد أو تغيير حالة» · «حالة غير معروفة») are re-derived
 * verbatim on gate failure; the oversize body that was previously
 * truncated silently at insert now 400s (the P1-7 tightening). The
 * raw-ticketId path dispatch, UUID_RE and the assignment scoping stay
 * route policy.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 4000;
const TICKET_LIMIT = 300;

async function requireStaff(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;
  if (auth.role !== "admin" && auth.role !== "coach") {
    return NextResponse.json(
      { error: "forbidden", message: "للفريق فقط" },
      { status: 403 },
    );
  }
  return auth;
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const ticketId = request.nextUrl.searchParams.get("ticketId");

  // ---- single ticket's messages ----
  if (ticketId) {
    if (!UUID_RE.test(ticketId)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    // Coach may only open his own clients' tickets; admin opens any.
    if (auth.role !== "admin") {
      const { data: tk } = await supabaseAdmin
        .from("support_tickets")
        .select("client_id")
        .eq("id", ticketId)
        .maybeSingle();
      const clientId = (tk as { client_id?: string } | null)?.client_id;
      if (!clientId) return NextResponse.json({ error: "not_found" }, { status: 404 });
      const { data: asg } = await supabaseAdmin
        .from("coach_assignments")
        .select("client_id")
        .eq("coach_id", auth.id)
        .eq("client_id", clientId)
        .maybeSingle();
      if (!asg) {
        return NextResponse.json(
          { error: "forbidden", message: "هذا العميل غير مخصص لك" },
          { status: 403 },
        );
      }
    }
    const { data, error } = await supabaseAdmin
      .from("ticket_messages")
      .select("id, ticket_id, sender_id, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ messages: data ?? [] });
  }

  // ---- ticket list ----
  let query = supabaseAdmin
    .from("support_tickets")
    .select("id, client_id, subject, status, priority, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(TICKET_LIMIT);

  if (auth.role !== "admin") {
    const { data: asgs, error: asgErr } = await supabaseAdmin
      .from("coach_assignments")
      .select("client_id")
      .eq("coach_id", auth.id);
    if (asgErr) {
      return NextResponse.json({ error: asgErr.message }, { status: 500 });
    }
    const clientIds = Array.from(
      new Set(((asgs ?? []) as { client_id: string }[]).map((a) => String(a.client_id))),
    );
    if (clientIds.length === 0) {
      return NextResponse.json({ tickets: [] });
    }
    query = query.in("client_id", clientIds);
  }

  const { data: tickets, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Resolve client names manually — no PostgREST embed, nothing to miss.
  const rows = (tickets ?? []) as Array<Record<string, unknown>>;
  const clientIds = Array.from(new Set(rows.map((r) => String(r.client_id))));
  const names = new Map<string, { name: string; email: string }>();
  if (clientIds.length > 0) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", clientIds);
    for (const p of ((profs ?? []) as unknown as Array<Record<string, unknown>>)) {
      names.set(String(p.id), {
        name: (p.full_name as string) || "",
        email: (p.email as string) || "",
      });
    }
  }

  const out = rows.map((r) => ({
    id: String(r.id),
    client_id: String(r.client_id),
    subject: String(r.subject ?? ""),
    status: String(r.status ?? "open"),
    priority: String(r.priority ?? "normal"),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? r.created_at ?? ""),
    profiles: names.get(String(r.client_id)) ?? { name: "", email: "" },
  }));

  return NextResponse.json({ tickets: out });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => ({} as Record<string, unknown>));

  // ── PHASE 68 — MEMBER TICKET CREATION (owner-approved priority support).
  // { subject, body } without ticketId = a member opening a NEW ticket.
  // Runs SERVER-SIDE so the priority decision is not client-forged:
  // an ACTIVE coaching subscription → priority='high', else 'normal'.
  // The dispatch reads the RAW values (exact legacy semantics — a
  // whitespace ticketId goes to the staff path and dies on UUID_RE,
  // never silently becomes a member ticket); auth stays FIRST.
  const rawSubject = String(rawBody.subject ?? "").trim();
  if (!rawBody.ticketId && rawSubject) {
    return memberCreateTicket(request, rawSubject, rawBody);
  }

  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  // Wave 2B zod gate (staff path — post-auth, the Wave 2A order): the
  // legacy bad_request classes are re-derived verbatim on gate failure
  // («لا يوجد رد أو تغيير حالة» · «حالة غير معروفة»); what remains is a
  // NEW violation (oversize/non-string — the insert-slice class) and
  // gets the fresh zod-message 400.
  const parsedTicket = supportTicketBodySchema.safeParse(rawBody);
  if (!parsedTicket.success) {
    const rawTicketId = String(rawBody.ticketId ?? "").trim();
    const rawText = String(rawBody.body ?? "").trim();
    const rawStatus = String(rawBody.status ?? "").trim();
    if (!UUID_RE.test(rawTicketId) || (!rawText && !rawStatus)) {
      return NextResponse.json(
        { error: "bad_request", message: "لا يوجد رد أو تغيير حالة" },
        { status: 400 },
      );
    }
    if (rawStatus && !(TICKET_STATUSES as readonly string[]).includes(rawStatus)) {
      return NextResponse.json(
        { error: "bad_request", message: "حالة غير معروفة" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsedTicket.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const ticketId = parsedTicket.data.ticketId ?? "";
  const text = String(parsedTicket.data.body ?? "").slice(0, MAX_BODY);
  const status = parsedTicket.data.status ?? "";
  const wantsReply = text.length > 0;
  const wantsStatus = status.length > 0;

  if (!UUID_RE.test(ticketId) || (!wantsReply && !wantsStatus)) {
    return NextResponse.json(
      { error: "bad_request", message: "لا يوجد رد أو تغيير حالة" },
      { status: 400 },
    );
  }
  if (wantsStatus && !["open", "pending", "closed"].includes(status)) {
    return NextResponse.json({ error: "bad_request", message: "حالة غير معروفة" }, { status: 400 });
  }

  const { data: parent } = await supabaseAdmin
    .from("support_tickets")
    .select("id, client_id, status")
    .eq("id", ticketId)
    .maybeSingle();
  if (!parent) {
    return NextResponse.json(
      { error: "not_found", message: "التذكرة غير موجودة" },
      { status: 404 },
    );
  }
  const clientId = (parent as { client_id: string }).client_id;

  // Coaches stay scoped to their own clients even when writing.
  if (auth.role !== "admin") {
    const { data: asg } = await supabaseAdmin
      .from("coach_assignments")
      .select("client_id")
      .eq("coach_id", auth.id)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!asg) {
      return NextResponse.json(
        { error: "forbidden", message: "هذا العميل غير مخصص لك" },
        { status: 403 },
      );
    }
  }

  if (wantsReply) {
    const { error: insertErr } = await supabaseAdmin
      .from("ticket_messages")
      .insert({ ticket_id: ticketId, sender_id: auth.id, body: text });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  // Reply → "pending" (client sees staff answered); explicit status wins.
  const nextStatus = wantsStatus
    ? (status as "open" | "pending" | "closed")
    : wantsReply
      ? "pending"
      : null;
  await supabaseAdmin
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString(), ...(nextStatus ? { status: nextStatus } : {}) })
    .eq("id", ticketId);

  // Ring the client's bell so he knows staff replied.
  // NOTIF→PLAN 2026-10-24 (item 1): deduped on identical (ticket, body)
  // within 60s — a double-submitted identical reply (network retry) rings
  // once; distinct messages always ring. Fail-open on guard errors.
  if (wantsReply) {
    try {
      const since = new Date(Date.now() - 60 * 1000).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("user_id", clientId)
        .eq("type", "support_reply")
        .gte("created_at", since)
        .eq("body", text.slice(0, 200))
        .limit(1);
      if (Array.isArray(recent) && recent.length > 0) {
        return NextResponse.json({ ok: true, deduped: true });
      }
    } catch {
      // fail-open — fall through to the insert
    }
    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: clientId,
        type: "support_reply",
        title: "رد جديد على تذكرة الدعم",
        body: text.slice(0, 200),
        link: "/support",
      })
      .then(undefined, () => {}); // never block the reply on the bell
  }

  return NextResponse.json({ ok: true });
}

/**
 * PHASE 68 — member ticket creation with server-decided priority.
 * Coaching-tier members (active coaching subscription, end_date > now)
 * get priority='high'; everyone else 'normal'. Mirrors the legacy
 * client-side insert (ticket + first message + staff bell) with the
 * service role.
 *
 * Wave 2B: the zod gate runs AFTER requireUser (auth-first, the Wave 2A
 * order). The legacy member bad_request class («اكتب موضوعًا ونصًا
 * للرسالة» — subject <3 / >200 / empty body) is re-derived verbatim on
 * gate failure; an oversize body (>4000 — previously truncated silently
 * at insert) gets the fresh zod-message 400.
 */
async function memberCreateTicket(
  request: NextRequest,
  subject: string,
  rawBody: Record<string, unknown>,
): Promise<Response> {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const parsedTicket = supportTicketBodySchema.safeParse(rawBody);
  if (!parsedTicket.success) {
    const rawText = String(rawBody.body ?? "").trim();
    if (subject.length < 3 || subject.length > 200 || rawText.length === 0) {
      return NextResponse.json(
        { error: "bad_request", message: "اكتب موضوعًا ونصًا للرسالة" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsedTicket.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const text = parsedTicket.data.body ?? "";

  if (subject.length < 3 || subject.length > 200 || text.length === 0) {
    return NextResponse.json(
      { error: "bad_request", message: "اكتب موضوعًا ونصًا للرسالة" },
      { status: 400 },
    );
  }

  // Priority rule: active PAID coaching subscription → high
  const { data: coachingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("client_id", auth.id)
    .eq("tier", "coaching")
    .eq("status", "active")
    .gt("end_date", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  const priority = coachingSub ? "high" : "normal";

  const { data: ticket, error: ticketErr } = await supabaseAdmin
    .from("support_tickets")
    .insert({ client_id: auth.id, subject: subject.slice(0, 200), status: "open", priority })
    .select()
    .single();
  if (ticketErr || !ticket) {
    return NextResponse.json(
      { error: "insert_failed", message: ticketErr?.message ?? "تعذر إنشاء التذكرة" },
      { status: 500 },
    );
  }

  await supabaseAdmin
    .from("ticket_messages")
    .insert({ ticket_id: (ticket as { id: string }).id, sender_id: auth.id, body: text.slice(0, MAX_BODY) });

  // Staff bell — Phase 246 routing fix: the old insert targeted
  // `auth.id` = the CLIENT who opened the ticket, a row no coach-facing
  // RLS branch ever matched (it silently became an admin-only zombie).
  // The legacy client-side path routes new_ticket to the client's
  // ASSIGNED coach with an admin fallback — the server path mirrors
  // that exactly now.
  const targetCoachId = await (async () => {
    const { data: asg } = await supabaseAdmin
      .from("coach_assignments")
      .select("coach_id")
      .eq("client_id", auth.id)
      .maybeSingle();
    const coachId = (asg as { coach_id: string } | null)?.coach_id;
    return coachId ?? (await getPrimaryAdminId());
  })();
  await supabaseAdmin
    .from("admin_notifications")
    .insert({
      type: "new_ticket",
      title: "تذكرة دعم جديدة ",
      body: `موضوع: ${subject.slice(0, 200)}${priority === "high" ? " — أولوية (عضوية كوتشينج)" : ""}`,
      // NOTIF→PLAN 2026-10-24 (items 1+3): deep link opens the ticket's
      // thread directly (/coach/support?ticket=<id>) — CoachSupportView
      // auto-opens the matching ticket; dedupKey + the guard in
      // POST /api/notifications/admin kill accidental double-pings.
      link: `/coach/support?ticket=${ticket.id}`,
      target_coach_id: targetCoachId,
      payload: { subject: subject.slice(0, 200), high: priority === "high", ticket_id: ticket.id, client_id: auth.id, dedupKey: `new_ticket:${ticket.id}` },
      read: false,
    })
    .then(undefined, () => {});

  return NextResponse.json({ ok: true, ticket, priority });
}
