"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getAdminClientsPaged, getAdminClientsStats, type AdminClientsPageOpts } from "@/lib/data";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader, MemberStatusBadge, TierBadge, EmptyState, memberStatus, SectionCard } from "@/components/admin/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * COACHES PAGE (/admin/coaches) — Phase 103 REBUILD.
 *
 * Owner directive: «ادارة المدربين مفيهاش قائمة بالمدربين وكذلك كل ما يخصهم
 * ظاهر بالخارج ازرار فى لوحة الادمن» + «تفرقة بين مدربين الموقع ومدربين b2b».
 *
 * The Phase-101 hub was 4 link cards with NO coach list. This page now
 * opens with the REAL roster: every coach with his kind (site / B2B),
 * client counts (B2B clients + assigned members), membership status and
 * wallet — and a one-tap site/B2B kind toggle. The management tools stay
 * right below the roster (no more scattered hub): page reviews, B2B
 * assignments, wallets, support, and the NEW site-coach roster page.
 *
 * Data: get_admin_clients_paged(type='coach') — same unified 0067 feed as
 * /admin/clients, filtered server-side to coaches only. Wallet balances
 * come from the existing /api/admin/wallets read endpoint.
 */

type CoachRow = {
  client_id: string;
  client_full_name: string | null;
  client_email: string | null;
  coach_kind: string;
  is_test_account: boolean;
  sub_tier: string | null;
  sub_status: string | null;
  sub_end_date: string | null;
  b2b_clients: number;
  site_members: number;
};

type WalletRow = { coach_id: string; balance: number };

/* PHASE 142 (owner: «تكرار ازرار»): the 5 «أدوات المدربين» cards that
 * lived below the roster were an EXACT copy of the AdminShell sidebar's
 * «المدربون» section (site-assignments / assignments / coach-pages /
 * wallets / coach-support) — same links rendered twice on one screen.
 * The sidebar (desktop) and the button grid (mobile) carry them; the
 * cards section is removed. The tools are still ONE tap away — the
 * ShieldCheck footer note below explains the kind split as before. */

export default function CoachesPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [rows, setRows] = useState<CoachRow[]>([]);
  const [wallets, setWallets] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [rpcFailed, setRpcFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Phase 247: the roster subtitle rides the CANONICAL stats RPC — the same
  // getAdminClientsStats() the dashboard tiles and /admin/clients read. The
  // old subtitle re-derived the coach counts from this page's ≤100-row fetch
  // and diverged from the dashboard past 100 coaches.
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminClientsStats>>>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const opts: AdminClientsPageOpts = {
        limit: 100,
        offset: 0,
        type: "coach",
        sort: "name",
      };
      const [data, st] = await Promise.all([
        getAdminClientsPaged(opts),
        getAdminClientsStats(),
      ]);
      if (st) setStats(st);
      if (data === null) {
        setRpcFailed(true);
        setRows([]);
      } else {
        setRpcFailed(false);
        setRows(data as unknown as CoachRow[]);
      }
      // Wallet balances (existing read endpoint) — best effort.
      const wRes = await fetch("/api/admin/wallets").catch(() => null);
      if (wRes && wRes.ok) {
        const wData = await wRes.json();
        const list: WalletRow[] = wData?.wallets ?? [];
        setWallets(new Map(list.map((w) => [w.coach_id, Number(w.balance) || 0])));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Site / B2B kind toggle — PATCH /api/admin/coach-kind (0067). */
  const toggleKind = async (r: CoachRow) => {
    setBusyId(r.client_id);
    const nextKind = r.coach_kind === "site" ? "b2b" : "site";
    try {
      const res = await fetch("/api/admin/coach-kind", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coach_id: r.client_id, coach_kind: nextKind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "failed");
      setRows((prev) =>
        prev.map((x) => (x.client_id === r.client_id ? { ...x, coach_kind: nextKind } : x)),
      );
      toast.success(
        nextKind === "site"
          ? isAr ? "اتحول لمدرب موقع — صار يظهر في صفحة تعيين مدربي الموقع" : "Converted to a site coach"
          : isAr ? "اتحول لمدرب B2B" : "Converted to a B2B coach",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (isAr ? "خطأ" : "Error"));
    } finally {
      setBusyId(null);
    }
  };

  const siteCount = stats ? stats.coach_site : rows.filter((r) => r.coach_kind === "site").length;
  const coachTotal = stats ? stats.coach_site + stats.coach_b2b : rows.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={isAr ? "المدربون" : "Coaches"}
        sub={
          isAr
            ? "قائمة بكل المدربين مع تفرقة واضحة: «مدرب موقع» بيتابع أعضاء الموقع (B2C)، و«مدرب B2B» شريك خارجي ليه عملاءه ومحفظته وفاتورته — وكل أدوات المدربين في القائمة الجانبية."
            : "The full coach roster with a clear split: a «site coach» follows up site members (B2C), a «B2B coach» is an external partner with his own clients, wallet and billing — every coach tool lives in the sidebar."
        }
      />

      {/* THE ROSTER — what the old hub never had */}
      <SectionCard
        title={isAr ? "قائمة المدربين" : "Coach roster"}
        sub={
          isAr
            ? `${coachTotal} مدرب — منهم ${siteCount} مدرب موقع`
            : `${coachTotal} coaches — ${siteCount} site coach(es)`
        }
      >
        {rpcFailed ? (
          <EmptyState
            text={
              isAr
                ? "تعذر تحميل القائمة — خدمة العملاء الموحدة (مايجريشن 0067) لم تُطبَّق بعد. ستعمل تلقائيًا فور تطبيقها."
                : "Could not load the roster — the unified service (migration 0067) is not applied yet."
            }
          />
        ) : loading && rows.length === 0 ? (
          <div className="py-16 text-center text-base font-normal text-[#6e6e73]">
            {isAr ? "جارٍ التحميل…" : "Loading…"}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState text={isAr ? "لا يوجد مدربون مسجلون بعد" : "No coaches yet"} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#f2f2f7]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f5f5f7] hover:bg-[#f5f5f7]">
                  <TableHead className="text-start">{isAr ? "المدرب" : "Coach"}</TableHead>
                  <TableHead className="text-start">{isAr ? "النوع" : "Kind"}</TableHead>
                  <TableHead className="text-start">{isAr ? "عملاؤه / أعضاؤه" : "His people"}</TableHead>
                  <TableHead className="hidden text-start md:table-cell">
                    {isAr ? "عضويته" : "Membership"}
                  </TableHead>
                  <TableHead className="hidden text-start lg:table-cell">
                    {isAr ? "المحفظة" : "Wallet"}
                  </TableHead>
                  <TableHead className="text-start" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const status = memberStatus(r);
                  const isSite = r.coach_kind === "site";
                  const busy = busyId === r.client_id;
                  const balance = wallets.get(r.client_id);
                  return (
                    <TableRow key={r.client_id} className={loading ? "opacity-50" : undefined}>
                      <TableCell>
                        <p className="font-medium">{r.client_full_name || "—"}</p>
                        <p dir="ltr" className="mt-0.5 text-xs text-[#6e6e73]">
                          {r.client_email || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                            isSite
                              ? "bg-[#34c759]/10 text-[#34c759]"
                              : "bg-[#8b5cf6]/10 text-[#8b5cf6]",
                          )}
                        >
                          {isSite
                            ? isAr ? "مدرب موقع" : "Site coach"
                            : isAr ? "مدرب B2B" : "B2B coach"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#6e6e73]">
                        <p>{isAr ? "عملاء B2B: " : "B2B clients: "}{r.b2b_clients}</p>
                        <p>{isAr ? "أعضاء متابعة: " : "Follow-up members: "}{r.site_members}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <TierBadge
                          tier={r.sub_tier}
                          label={
                            r.sub_tier
                              ? (isAr ? "مشترك" : "Subscriber")
                              : (isAr ? "بدون" : "None")
                          }
                        />
                        <div className="mt-1">
                          <MemberStatusBadge status={status} isAr={isAr} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-[#6e6e73] lg:table-cell">
                        {balance !== undefined
                          ? `$${balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleKind(r)}
                            disabled={busy}
                            title={
                              isSite
                                ? isAr ? "تحويله لمدرب B2B" : "Convert to B2B coach"
                                : isAr ? "تعيينه مدرب موقع" : "Designate as site coach"
                            }
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                              isSite
                                ? "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                                : "bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759]/20",
                            )}
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5" />
                            )}
                            {isSite
                              ? isAr ? "إلغاء تعيين الموقع" : "Remove site role"
                              : isAr ? "تعيينه مدرب موقع" : "Make site coach"}
                          </button>
                          {isSite && (
                            <Link
                              href="/admin/site-assignments"
                              className="whitespace-nowrap rounded-full bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-[#0071e3] transition-colors hover:bg-[#e8e8ed]"
                            >
                              {isAr ? "أعضاؤه ›" : "His members ›"}
                            </Link>
                          )}
                          <a
                            href={`/coach/${r.client_id}`}
                            className="whitespace-nowrap rounded-full bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-[#0071e3] transition-colors hover:bg-[#e8e8ed]"
                          >
                            {isAr ? "إدارة كاملة ›" : "Manage ›"}
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <p className="flex items-start gap-2 text-xs text-[#6e6e73]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {isAr
          ? "تمييز النوع محفوظ في قاعدة البيانات (profiles.coach_kind) — فواتير مدربي B2B ومحافظهم تبقى كما هي دون أي تأثير، وتعيينات مدربي الموقع في جدول منفصل تمامًا عن الأموال. أدوات المدربين (الصفحات / التعيينات B2B / المحافظ / الدعم) في القائمة الجانبية — وبادج «صفحات بانتظار المراجعة» على بند صفحات المدربين نفسه."
          : "The kind split is stored in the DB (profiles.coach_kind) — B2B coaches keep their wallet and billing untouched, and site-coach rosters live in a table fully separate from money. The coach tools (pages / B2B assignments / wallets / support) live in the sidebar — with the pending-pages badge on the Coach pages item itself."}
      </p>
    </div>
  );
}
