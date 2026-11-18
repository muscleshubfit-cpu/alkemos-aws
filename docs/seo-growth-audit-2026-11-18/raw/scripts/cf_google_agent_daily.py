#!/usr/bin/env python3
"""
cf_google_agent_daily.py — day-level UNSAMPLED UA/status breakdown
(SEO-GROWTH-AUDIT 2026-11-18 / google-agent-access-audit)

Companion to cf_google_agent_access_audit.py. The 30-day aggregate there
returns SAMPLED estimates (counts rounded to multiples of 10) because the
window exceeds the sampling threshold; per-day queries return unsampled
precise counts (the same method as the collapse investigation's
cf_googlebot_analytics.py, whose small counts 1/25/7 prove no sampling).

Day-by-day (limit 10000, orderBy count_DESC) grouped by
userAgent+edgeResponseStatus, then classified client-side for:
  - Google-Agent (the audited UA)
  - Google family (Googlebot / InspectionTool / GoogleOther /
    Mediapartners / AdsBot ...)
  - 429s (the /api/* rate-limit action) and 403s per day

READ-ONLY. Token from CF_API_TOKEN env var only.
Output: cf-daily-ua-status-<start>_<end>.json next to ../
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.request

GQL = "https://api.cloudflare.com/client/v4/graphql"
TOK = os.environ.get("CF_API_TOKEN", "")
ZONE = os.environ.get("CF_ZONE_TAG", "b4be55a0736831d9c5d9564788861076")
START = sys.argv[1] if len(sys.argv) > 1 else "2026-11-12"
END = sys.argv[2] if len(sys.argv) > 2 else "2026-11-19"
if not TOK:
    sys.exit("Set CF_API_TOKEN env var first (read-only). No token stored.")

G_FAMILY = ("Googlebot", "Google-InspectionTool", "GoogleOther",
            "Mediapartners", "Google-HTTP-Service", "AdsBot",
            "Google-Ad", "Google Read-Aloud", "APIs-Google", "FeedFetcher")


def gq(query):
    for _ in range(3):
        req = urllib.request.Request(
            GQL, method="POST",
            data=json.dumps({"query": query}).encode(),
            headers={"Authorization": f"Bearer {TOK}",
                     "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                d = json.loads(r.read().decode())
            if not d.get("errors"):
                return d
        except Exception as e:  # noqa: BLE001
            print("retry:", e, file=sys.stderr)
        time.sleep(2)
    raise RuntimeError("GraphQL kept failing")


daily = {}
cur = dt.date.fromisoformat(START)
end = dt.date.fromisoformat(END)
while cur < end:
    nxt = cur + dt.timedelta(days=1)
    d = gq(f"""{{ viewer {{ zones(filter: {{zoneTag: "{ZONE}"}}) {{
      httpRequestsAdaptiveGroups(limit: 10000,
        filter: {{ datetime_geq: "{cur.isoformat()}T00:00:00Z",
                   datetime_lt: "{nxt.isoformat()}T00:00:00Z" }},
        orderBy: [count_DESC]) {{
          dimensions {{ userAgent edgeResponseStatus }} count }} }} }} }}""")
    gs = d["data"]["viewer"]["zones"][0]["httpRequestsAdaptiveGroups"]
    row = {
        "all_requests": sum(g["count"] for g in gs),
        "distinct_uas": len({g["dimensions"]["userAgent"] for g in gs}),
        "google_agent": [],
        "google_family": [],
        "status_403_total": 0,
        "status_429_total": 0,
        "googlebot_status": {},
    }
    for g in gs:
        ua = g["dimensions"]["userAgent"] or ""
        st = g["dimensions"]["edgeResponseStatus"]
        c = g["count"]
        if st == 403:
            row["status_403_total"] += c
        if st == 429:
            row["status_429_total"] += c
        if "Google-Agent" in ua:
            row["google_agent"].append({**g["dimensions"], "count": c})
        elif any(k in ua for k in G_FAMILY):
            row["google_family"].append({**g["dimensions"], "count": c})
            if "Googlebot" in ua:
                row["googlebot_status"][st] = (
                    row["googlebot_status"].get(st, 0) + c)
    daily[cur.isoformat()] = row
    print(f"{cur}: all={row['all_requests']} uas={row['distinct_uas']} "
          f"google_agent={len(row['google_agent'])} "
          f"403={row['status_403_total']} 429={row['status_429_total']}")
    cur = nxt
    time.sleep(0.5)

out = {"zone": "alkemos.com", "collected": f"{START}->{END}",
       "method": "per-day unsampled GraphQL (same as collapse "
                 "investigation cf_googlebot_analytics.py)",
       "daily": daily}
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                    f"cf-daily-ua-status-{START}_{END}.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("saved ->", os.path.normpath(path))
