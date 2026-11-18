#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudflare Googlebot analytics — Alkemos (read-only, re-runnable).
Pulls per-day Google-family crawler request counts and status codes from the
Cloudflare GraphQL Analytics API for zone alkemos.com.

Usage:
  export CF_API_TOKEN="<user API token with Zone > Analytics > Read>"
  python3 cf_googlebot_analytics.py [start_date YYYY-MM-DD] [end_date YYYY-MM-DD]

NOTE: the token is read from the environment ONLY — never hardcode or commit it.
Output: cf-analytics-<start>_<end>.json next to this script.
"""
import requests, json, sys, time, os

TOK = os.environ.get("CF_API_TOKEN")
if not TOK:
    sys.exit("Set CF_API_TOKEN env var first (Zone Analytics:Read). No token is stored by this script.")
ZONE_TAG = os.environ.get("CF_ZONE_TAG", "b4be55a0736831d9c5d9564788861076")  # zone: alkemos.com

start = sys.argv[1] if len(sys.argv) > 1 else "2026-11-04"
end = sys.argv[2] if len(sys.argv) > 2 else "2026-11-18"

def gq(query, retries=3):
    for _ in range(retries):
        r = requests.post("https://api.cloudflare.com/client/v4/graphql",
                          headers={"Authorization": f"Bearer {TOK}", "Content-Type": "application/json"},
                          json={"query": query}, timeout=90)
        d = r.json()
        if not d.get("errors"):
            return d
        time.sleep(2)
    raise RuntimeError(f"GraphQL error: {json.dumps(d.get('errors'))[:300]}")

# day-by-day UA + status breakdown
import datetime as dt
d0 = dt.date.fromisoformat(start)
d1 = dt.date.fromisoformat(end)
daily = {}
cur = d0
while cur < d1:
    nxt = cur + dt.timedelta(days=1)
    d = gq(f"""{{ viewer {{ zones(filter: {{zoneTag: "{ZONE_TAG}"}}) {{
      httpRequestsAdaptiveGroups(limit: 10000,
        filter: {{ datetime_geq: "{cur.isoformat()}T00:00:00Z", datetime_lt: "{nxt.isoformat()}T00:00:00Z" }},
        orderBy: [count_DESC]) {{ dimensions {{ userAgent edgeResponseStatus }} count }} }} }} }}""")
    gs = d["data"]["viewer"]["zones"][0]["httpRequestsAdaptiveGroups"]
    row = {"googlebot": 0, "googlebot_image": 0, "inspection": 0, "googleother": 0,
           "mediapartners": 0, "googlebot_status": {}, "all_requests": 0, "all_5xx": 0}
    for g in gs:
        ua, st, c = g["dimensions"]["userAgent"], g["dimensions"]["edgeResponseStatus"], g["count"]
        row["all_requests"] += c
        if st >= 500:
            row["all_5xx"] += c
        if "Googlebot-Image" in ua:
            row["googlebot_image"] += c
        elif "Google-InspectionTool" in ua:
            row["inspection"] += c
        elif "GoogleOther" in ua:
            row["googleother"] += c
        elif "Mediapartners-Google" in ua or "Google-Display-Ads-Bot" in ua:
            row["mediapartners"] += c
        elif "Googlebot" in ua:
            row["googlebot"] += c
            row["googlebot_status"][st] = row["googlebot_status"].get(st, 0) + c
    daily[cur.isoformat()] = row
    print(f"{cur}: googlebot={row['googlebot']} image={row['googlebot_image']} "
          f"inspect={row['inspection']} 5xx_all={row['all_5xx']}/{row['all_requests']}")
    cur = nxt
    time.sleep(0.5)

out = {"zone": "alkemos.com", "collected_at": start + " -> " + end,
       "method": "Cloudflare GraphQL Analytics API (read-only)", "daily": daily}
path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    f"cf-analytics-{start}_{end}.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("saved ->", path)
