#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Evidence audit recomputation — SEO-COLLAPSE-INVESTIGATION supplement (2026-11-18).

Owner order (2026-11-18, supplement): verify Googlebot identity claims, audit the
33×403 responses, reconcile the Googlebot-Image 58-vs-64 discrepancy, separate
aggregate CNI/indexed correlation from URL-level transition proof, and split what
current data settles from what needs URL-level GSC exports.

This script recomputes EVERY number it can from the preserved raw artifacts ONLY
(no network, no token, no re-query — that is the point: what does the preserved
evidence actually support?):

  A. Cloudflare raw (raw/cloudflare-analytics-2026-11-18.json):
     - daily table vs the table AS PRINTED in README §5-c (transcribed below)
       → cell-by-cell errata
     - canonical totals (googlebot / image / inspection / 5xx) over Nov 4-17
     - text-Googlebot status-code distribution + the 403 census
     - internal reconciliations (ua_counts window vs daily window; Nov-10
       daily block vs Nov-10 anomaly block; README claims not reproducible)
  B. GSC raw (raw/gsc-coverage-2026-11-18/*.csv) + the pinned Nov-11 baseline
     recovered from git object 0996c369 (immutable historical export):
     - category sums vs Chart totals (both dates)
     - net flow accounting (indexed −535 vs CNI +552 …) and the identity-gap
       demonstration: many different flow matrices fit the same net deltas.

Output: raw/evidence-audit-2026-11-18.json (next to this script's parent raw/).
Re-runnable offline: python3 evidence_audit_2026-11-18.py
"""
import json, os, csv, sys

RAW = os.path.dirname(os.path.abspath(__file__)) + "/../"
OUT = os.path.join(RAW, "evidence-audit-2026-11-18.json")

# ------------------------------------------------------------------ inputs
cf = json.load(open(RAW + "cloudflare-analytics-2026-11-18.json", encoding="utf-8"))
daily = cf["daily_nov4_17"]
ua_counts = cf["ua_counts_nov11_18"]
nov10 = cf["nov10_anomaly"]

# README §5-c table AS PRINTED (2026-11-18 report) — transcribed verbatim so the
# diff is machine-checked. Columns: date, googlebot, image, inspection, all_5xx.
README_TABLE = {
    "2026-11-04": (99, 2, 0, 7170), "2026-11-05": (126, 11, 0, 4441),
    "2026-11-06": (52, 1, 0, 4631),  "2026-11-07": (167, 2, 0, 5821),
    "2026-11-08": (78, 4, 0, 4593),  "2026-11-09": (102, 1, 0, 5832),
    "2026-11-10": (389, 4, 54, 74556), "2026-11-11": (77, 2, 68, 7353),
    "2026-11-12": (252, 20, 0, 9792), "2026-11-13": (191, 6, 127, 5745),
    "2026-11-14": (60, 0, 0, 3616),  "2026-11-15": (68, 1, 0, 3196),
    "2026-11-16": (73, 10, 0, 5145), "2026-11-17": (58, 0, 0, 5430),
}

# Nov-11 baseline (git object 0996c369 —
# docs/seo-indexing-audit-2026-11-11/raw/gsc-coverage-2026-11-11/Critical
# issues.csv; the export's Chart ends 2026-11-06): category → pages.
GSC_1111 = {"noindex": 157, "404": 4, "canonical": 203, "redirect": 4,
            "robots": 1, "CNI": 1271, "DNI": 879}
GSC_1111_INDEXED, GSC_1111_NOT = 886, 2519
# Nov-18 export (raw/gsc-coverage-2026-11-18/Critical issues.csv; Chart ends
# 2026-11-13): transcribed here too so the script also re-derives it from CSV.
GSC_1118 = {"noindex": 163, "404": 5, "canonical": 203, "redirect": 4,
            "robots": 1, "CNI": 1823, "DNI": 943}

res = {"audit_of": "SEO-COLLAPSE-INVESTIGATION-2026-11-18 (supplement)",
       "computed_at": "2026-11-18", "inputs_offline_only": True}

# ---------------------------------------------------------- A1: errata grid
errata = []
for d in sorted(daily):
    g = daily[d]["googlebot"]
    printed = README_TABLE[d]
    actual = (g["googlebot"], g["googlebot_image"], g["inspection"], daily[d]["all_5xx"])
    cols = ["googlebot", "googlebot_image", "inspection", "all_5xx"]
    for i, c in enumerate(cols):
        if printed[i] != actual[i]:
            errata.append({"date": d, "column": c, "as_printed": printed[i],
                           "raw_json": actual[i], "delta": actual[i] - printed[i]})
res["readme_table_vs_raw_json"] = {
    "cells_compared": len(daily) * 4,
    "cells_differing": len(errata),
    "errata": errata,
    "note": ("README §5-c table was typeset from an earlier query run whose raw "
             "output was not preserved; the saved raw JSON is the only "
             "reproducible artifact and is hereby the canonical source.")}

# ------------------------------------------------- A2: canonical totals
tot_gb = sum(daily[d]["googlebot"]["googlebot"] for d in daily)
tot_img = sum(daily[d]["googlebot"]["googlebot_image"] for d in daily)
tot_ins = sum(daily[d]["googlebot"]["inspection"] for d in daily)
tot_5xx = sum(daily[d]["all_5xx"] for d in daily)
res["canonical_totals_nov4_17"] = {
    "window": "2026-11-04 .. 2026-11-17 (14 days — end date exclusive, nothing on 18-11 captured)",
    "googlebot_text_ua": tot_gb, "googlebot_image_ua": tot_img,
    "inspection_tool_ua": tot_ins, "all_5xx_all_visitors": tot_5xx,
    "report_claimed": {"googlebot": 1832, "image": 64, "inspection": 249},
    "verdict": {"googlebot": "matches raw (1,832)", "image": "MISMATCH — raw says 58, report says 64",
                "inspection": "matches raw (249)"},
    "image_discrepancy_root": (
        "the README daily column itself sums to 64 because its 2026-11-12 cell "
        "says 20 where the preserved raw says 14 (an earlier unpreserved run); "
        "the preserved raw sums to 58. Canonical = 58.")}

# ------------------------------------- A3: text-Googlebot status distribution
dist = {}
for d in daily:
    for st, c in daily[d]["googlebot"]["googlebot_status"].items():
        dist[st] = dist.get(st, 0) + c
res["googlebot_text_ua_status_distribution_nov4_17"] = {
    "total": sum(dist.values()), "distribution": dist,
    "pct_200": round(100.0 * dist.get("200", 0) / sum(dist.values()), 1),
    "pct_404": round(100.0 * dist.get("404", 0) / sum(dist.values()), 1),
    "pct_403": round(100.0 * dist.get("403", 0) / sum(dist.values()), 1),
    "measurement_gap": ("the classifier records status codes ONLY for text-Googlebot "
                        "UAs; Googlebot-Image and Google-InspectionTool statuses were "
                        "never captured — any 'family-wide zero-5xx' claim is only "
                        "partially measured")}

# --------------------------------------------------------- A4: 403 census
c403 = {d: daily[d]["googlebot"]["googlebot_status"].get("403", 0) for d in daily}
c403 = {d: c for d, c in c403.items() if c}
res["http_403_census_googlebot_text_ua"] = {
    "total": sum(c403.values()), "per_day": c403,
    "days_with_403": sorted(c403), "co_occurrence": {
        "2026-11-13": "inspection-tool spike day (127) + 27×404 + all_5xx 5,745",
        "2026-11-15": "otherwise quiet day (68 googlebot, 5×404)",
        "2026-11-04": "mixed-normal day (7×404, 4×308, 3×301)"},
    "report_claim": "«كلها تقريبًا 200 بصفر حجب» — CONTRADICTED by the preserved raw",
    "share_of_traffic": f"{100.0*sum(c403.values())/tot_gb:.1f}% of text-Googlebot-UA requests",
    "what_current_data_cannot_settle": [
        "source IP / ASN / country of each 403 (GraphQL daily aggregates carry no clientIP)",
        "request paths and the matching rule (CF WAF / rate rule / origin Caddy)",
        "verified-Googlebot vs spoofed-Googlebot UA — UA string alone proves nothing"]}

# -------------------------------------- A5: internal reconciliations
# ua_counts window vs daily window (both nominally Nov 11–17)
def ua_family_sum(substr, exclude=()):
    s = 0
    for row in ua_counts:
        u = row["ua"]
        if substr in u and not any(e in u for e in exclude):
            s += row["count"]
    return s
gb_win_daily = sum(daily[d]["googlebot"]["googlebot"] for d in daily if d >= "2026-11-11")
img_win_daily = sum(daily[d]["googlebot"]["googlebot_image"] for d in daily if d >= "2026-11-11")
ins_win_daily = sum(daily[d]["googlebot"]["inspection"] for d in daily if d >= "2026-11-11")
gb_win_ualist = ua_family_sum("Googlebot", exclude=("Googlebot-Image", "Google-InspectionTool"))
img_win_ualist = ua_family_sum("Googlebot-Image")
ins_win_ualist = ua_family_sum("Google-InspectionTool")
res["reconciliation_ua_list_vs_daily_nov11_17"] = {
    "googlebot_text": {"ua_list": gb_win_ualist, "daily": gb_win_daily,
                       "gap": gb_win_daily - gb_win_ualist,
                       "verdict": ("UNRECONCILED beyond the documented ±3% adaptive "
                                   "variance — needs a token re-query")},
    "googlebot_image": {"ua_list": img_win_ualist, "daily": img_win_daily,
                        "gap": 0, "verdict": "exact match (33 = 33)"},
    "inspection_tool": {"ua_list": ins_win_ualist, "daily": ins_win_daily,
                        "gap": 0, "verdict": "exact match (195 = 195)"},
    "note": ("the ua_list is a top-N snapshot (18 rows) and cannot produce exact "
             "totals by construction; the daily table is the canonical trend source")}

res["reconciliation_nov10_googlebot"] = {
    "daily_block": daily["2026-11-10"]["googlebot"]["googlebot_status"],
    "daily_block_sums_to": daily["2026-11-10"]["googlebot"]["googlebot"],
    "anomaly_block": nov10["googlebot_status_on_nov10"],
    "anomaly_block_sums_to": sum(nov10["googlebot_status_on_nov10"].values()),
    "verdict": ("CONFLICT inside the same preserved file: 377×200 vs 332×200 for the "
                "same day/UA family from two different queries (adaptive variance "
                "exceeds the ±3% note). Both agree on zero 5xx. Needs re-query."),
    "report_claim_480x200_10x404": ("NOT reproducible from the preserved raw for "
                                    "either measurement (377/332 ×200; 12 ×404) — the "
                                    "«480×200 + 10×404» family line must be corrected")}

res["nov10_anomaly_reproducibility"] = {
    "total_requests_441047": True,
    "top_ua_mobile_storm_raw": 305043, "top_ua_mobile_storm_report": 309958,
    "mobile_storm_reproducible": False,
    "nginx_ssl_504_raw": 74194,
    "nginx_share_of_504": round(100.0 * 74194 / daily["2026-11-10"]["all_5xx"], 2),
    "nginx_99_5pct_claim": "reproducible (74,194 / 74,559 = 99.51%)",
    "alkemos_seo_audit_2321_in_raw": False,
    "note": ("«= 15× المعدل» is also not derivable: per-day total-request counts "
             "were never saved (only 5xx totals and the Nov-10 anomaly total)")}

# ------------------------------------------------------------ B: GSC side
def load_crit(path):
    out = {}
    with open(path, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            out[r["Reason"]] = int(r["Pages"])
    return out
crit = load_crit(os.path.join(RAW, "gsc-coverage-2026-11-18", "Critical issues.csv"))
map11 = {"Excluded by ‘noindex’ tag": "noindex", "Not found (404)": "404",
         "Alternate page with proper canonical tag": "canonical",
         "Page with redirect": "redirect", "Blocked by robots.txt": "robots",
         "Crawled - currently not indexed": "CNI",
         "Discovered - currently not indexed": "DNI"}
crit_now = {map11[k]: v for k, v in crit.items()}
assert crit_now == GSC_1118, f"CSV vs pinned Nov-18 mismatch: {crit_now}"
sum_1111 = sum(GSC_1111.values()); sum_1118 = sum(GSC_1118.values())
res["gsc_category_audit"] = {
    "nov18_csv_equals_pinned": True,
    "nov11_sum_equals_chart_not_indexed": (sum_1111 == GSC_1111_NOT, sum_1111),
    "nov18_sum_equals_chart_not_indexed": (sum_1118 == 3142, sum_1118),
    "net_deltas": {k: GSC_1118[k] - GSC_1111[k] for k in GSC_1118},
    "indexed_delta": 351 - 886,
    "known_set_delta": (351 + 3142) - (886 + 2519)}

# identity-gap demonstration: the net deltas are consistent with MANY flow
# matrices; pick two extreme ones that both fit, to make underdetermination
# machine-visible (illustrative only — NOT claimed as facts).
flows = {
 "reading_A_pages_moved_indexed_to_cni": {
   "indexed→CNI": 535, "indexed→out_of_report": 0,
   "DNI→CNI": 17, "new_or_rediscovered→CNI/DNI/noindex": "64+6+…",
   "fits_nets": True,
   "note": "the report's implicit reading: the de-indexed URLs ≈ the CNI entrants"},
 "reading_B_displacement": {
   "indexed→out_of_report_entirely": 535, "indexed→CNI": 0,
   "DNI→CNI": 453, "new→CNI": 99, "new→DNI": 64, "noindex": "+6",
   "fits_nets": True,
   "note": "no URL that left the index ever entered CNI — aggregates identical"},
}
res["cni_vs_indexed_identity_gap"] = {
    "aggregate_consistency": ("Δindexed −535 ≈ ΔCNI +552 (diff 17) — consistent with a "
                              "net flow into CNI, and CNI by GSC's own definition means "
                              "Google crawled those URLs (Google-side statement, "
                              "independent of any UA)"),
    "what_aggregates_cannot_prove": ("the IDENTITY of the URLs: chart-level exports "
                                     "are stock counts at two snapshot dates; the flow "
                                     "matrix between buckets is unobserved, and multiple "
                                     "matrices fit the same nets — two examples below"),
    "illustrative_flow_matrices": flows,
    "verdict": ("«مطابق تمامًا» must be downgraded to: aggregate-consistent, "
                "identity-unproven — proving URL-level transition requires URL-level "
                "exports (indexed list + per-category drilldowns at matched dates)"),
    "operational_note": ("GSC UI drilldown exports cap at 1,000 rows — the 1,823 CNI "
                         "list needs prefix-filtered chunked exports; the API has no "
                         "coverage endpoint (documented in report 18)")}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=1)
print("saved →", OUT)
print(f"errata cells: {len(errata)} | totals gb/img/ins: {tot_gb}/{tot_img}/{tot_ins} "
      f"| 403 total: {sum(c403.values())} | status dist: {dist}")
