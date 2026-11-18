#!/usr/bin/env python3
"""
cf_google_agent_access_audit.py — Google-Agent Access Audit (SEO-GROWTH-AUDIT 2026-11-18)

READ-ONLY Cloudflare zone inspection for the Google-Agent access audit
(owner order 2026-11-19). Zero writes: only GET /zones/... endpoints and
read-only GraphQL analytics queries. Tokens come from the CF_API_TOKEN
environment variable ONLY (never committed, never printed).

What it collects (all read-only):
  1. Zone details + plan
  2. Security settings: security_level, browser_check, challenge_ttl,
     security_header (HSTS), email_obfuscation, hotlink_protection
  3. Bot Management / Super Bot Fight Mode state (GET /bot_management)
  4. All rulesets + every phase entrypoint (custom firewall WAF rules,
     rate-limit rules, SBFM, dynamic redirects, transforms, cache rules)
  5. Legacy surfaces: firewall/rules, ua_rules (UA blocks), rate_limits,
     lockdowns, access_rules
  6. GraphQL firewall events for UA containing "Google-Agent" (30 days)
  7. GraphQL HTTP requests for UA containing "Google-Agent" (30 days)
     — statuses, challenge solves, bot scores, JA4 etc. (sampled)

Output: raw JSON saved next to this script's parent directory as
cf-access-audit-2026-11-19.json (one consolidated document).
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

API = "https://api.cloudflare.com/client/v4"
GQL = "https://api.cloudflare.com/client/v4/graphql"

TOKEN = os.environ.get("CF_API_TOKEN", "")
ZONE_ID = os.environ.get("CF_ZONE_ID", "b4be55a0736831d9c5d9564788861076")
if not TOKEN:
    print("FATAL: CF_API_TOKEN env var is empty", file=sys.stderr)
    sys.exit(1)

OUT = {}


def _req(url, method="GET", body=None, gql=False):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {"error": "non-json"}
    except Exception as e:  # noqa: BLE001
        return 0, {"error": str(e)}


def get(path, key=None):
    status, body = _req(API + path)
    time.sleep(0.35)  # polite rate
    if key:
        return {"status": status, "ok": body.get("success", False),
                "errors": body.get("errors", []), key: body.get("result")}
    return {"status": status, "ok": body.get("success", False),
            "errors": body.get("errors", []), "result": body.get("result")}


def gql_query(query, variables):
    status, body = _req(GQL, method="POST",
                        body={"query": query, "variables": variables})
    time.sleep(0.35)
    return {"status": status, "errors": body.get("errors", []),
            "data": body.get("data")}


# ── 1. zone + token verify ──────────────────────────────────────────
OUT["zone"] = get(f"/zones/{ZONE_ID}", "zone")
OUT["token_verify"] = get("/user/tokens/verify", "token")

# ── 2. security settings ────────────────────────────────────────────
settings = {}
for s in ("security_level", "browser_check", "challenge_ttl",
          "security_header", "email_obfuscation", "hotlink_protection",
          "automatic_https_rewrites", "ssl", "min_tls_version",
          "browser_integrity_check"):
    settings[s] = get(f"/zones/{ZONE_ID}/settings/{s}", "result")
OUT["settings"] = settings

# ── 3. bot management / SBFM ────────────────────────────────────────
OUT["bot_management"] = get(f"/zones/{ZONE_ID}/bot_management", "result")

# ── 4. rulesets (new WAF surface) ───────────────────────────────────
OUT["rulesets_list"] = get(f"/zones/{ZONE_ID}/rulesets", "rulesets")
phases = [
    "http_request_firewall_custom",
    "http_request_firewall_managed",
    "http_request_sbfm",
    "http_request_bots_management",
    "http_ratelimit",
    "http_request_dynamic_redirect",
    "http_request_redirect",
    "http_request_transform",
    "http_request_late_transform",
    "http_request_cache_settings",
    "http_request_origin",
    "http_request_sanitize",
    "http_logcustom_fields",
    "http_request_headers",
    "http_response_headers_transform",
]
phase_results = {}
for ph in phases:
    phase_results[ph] = get(
        f"/zones/{ZONE_ID}/rulesets/phases/{ph}/entrypoint", "result")
OUT["ruleset_phase_entrypoints"] = phase_results

# ── 5. legacy surfaces ──────────────────────────────────────────────
OUT["legacy_firewall_rules"] = get(f"/zones/{ZONE_ID}/firewall/rules", "rules")
OUT["legacy_ua_rules"] = get(f"/zones/{ZONE_ID}/firewall/ua_rules", "result")
OUT["legacy_rate_limits"] = get(f"/zones/{ZONE_ID}/rate_limits", "result")
OUT["legacy_lockdowns"] = get(f"/zones/{ZONE_ID}/firewall/lockdowns", "result")
OUT["legacy_access_rules"] = get(
    f"/zones/{ZONE_ID}/firewall/access_rules", "result")

# ── 6. GraphQL: ALL firewall events 30d grouped by action+UA+path ──
# (the schema has no userAgent_search filter — group by userAgent as a
#  dimension and classify client-side, the same method as the collapse
#  investigation's cf_googlebot_analytics.py)
fw_query = """
query FirewallEvents($zone: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: {zoneTag: $zone}) {
      firewallEventsAdaptiveGroups(
        filter: {
          datetime_geq: $since
          datetime_leq: $until
        }
        limit: 10000
        orderBy: [count_DESC]
      ) {
        count
        dimensions {
          action
          source
          userAgent
          clientRequestPath
          clientRequestHTTPMethodName
          clientIP
          clientASNDescription
          ruleId
          rulesetId
        }
      }
    }
  }
}
"""
fw_raw = gql_query(
    fw_query,
    {"zone": ZONE_ID, "since": "2026-10-20T00:00:00Z",
     "until": "2026-11-19T00:00:00Z"})
# classify client-side
fw_errors = fw_raw.get("errors") or []
fw_groups = []
if fw_errors == []:
    fw_groups = ((fw_raw.get("data") or {}).get("viewer", {})
                 .get("zones", [{}])[0]
                 .get("firewallEventsAdaptiveGroups", []))
fw_classified = {
    # HONESTY NOTE: with the zone-scoped token used at collection time the
    # FirewallEvents GraphQL dataset returned authz code 10001-style
    # "zone does not have access to the path" — firewall-event counts are
    # therefore NOT verifiable with this token; recorded as access_denied.
    "dataset_access": "ok" if fw_errors == [] else "denied",
    "dataset_errors": fw_errors,
    "total_events": (sum(g["count"] for g in fw_groups)
                     if fw_errors == [] else None),
    "google_agent": [],
    "google_family": [],
    "by_action": {},
    "sample_top50": fw_groups[:50],
}
for g in fw_groups:
    ua = (g["dimensions"].get("userAgent") or "")
    key = g["dimensions"].get("action") or "?"
    fw_classified["by_action"][key] = (fw_classified["by_action"].get(key, 0)
                                       + g["count"])
    if "Google-Agent" in ua:
        fw_classified["google_agent"].append(g)
    elif any(k in ua for k in ("Googlebot", "Google-InspectionTool",
                               "GoogleOther", "Mediapartners", "Google-HTTP-Service",
                               "AdsBot", "Google-Ad")):
        fw_classified["google_family"].append(g)
OUT["gql_firewall_events_30d"] = fw_raw
OUT["classified_firewall_events_30d"] = fw_classified

# ── 7. GraphQL: HTTP requests 30d grouped by UA+status (all UAs),
#    then classify Google-Agent / Google family client-side ─────────
http_query = """
query HttpReqs($zone: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: {zoneTag: $zone}) {
      httpRequestsAdaptiveGroups(
        filter: {
          datetime_geq: $since
          datetime_leq: $until
        }
        limit: 10000
        orderBy: [count_DESC]
      ) {
        count
        dimensions {
          userAgent
          edgeResponseStatus
          clientRequestHTTPMethodName
        }
      }
      __typename
    }
  }
}
"""
http_raw = gql_query(
    http_query,
    {"zone": ZONE_ID, "since": "2026-10-20T00:00:00Z",
     "until": "2026-11-19T00:00:00Z"})
http_groups = ((http_raw.get("data") or {}).get("viewer", {})
               .get("zones", [{}])[0]
               .get("httpRequestsAdaptiveGroups", []))
http_classified = {
    "total_requests": sum(g["count"] for g in http_groups),
    "by_edge_status": {},
    "google_agent": [],
    "google_family": [],
    "distinct_user_agents": len({
        (g["dimensions"].get("userAgent") or "") for g in http_groups}),
}
for g in http_groups:
    st = g["dimensions"].get("edgeResponseStatus")
    http_classified["by_edge_status"][st] = (
        http_classified["by_edge_status"].get(st, 0) + g["count"])
for g in http_groups:
    ua = (g["dimensions"].get("userAgent") or "")
    if "Google-Agent" in ua:
        http_classified["google_agent"].append(g)
    elif any(k in ua for k in ("Googlebot", "Google-InspectionTool",
                               "GoogleOther", "Mediapartners", "Google-HTTP-Service",
                               "AdsBot", "Google-Ad", "Google Read-Aloud",
                               "APIs-Google", "FeedFetcher")):
        http_classified["google_family"].append(g)
OUT["gql_http_30d"] = http_raw
OUT["classified_http_30d"] = http_classified

# ── save ────────────────────────────────────────────────────────────
out_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..",
    "cf-access-audit-2026-11-19.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(OUT, f, ensure_ascii=False, indent=1)
print(f"SAVED: {os.path.normpath(out_path)}")
print("SUMMARY:")
print(json.dumps({
    "settings_ok": {k: v.get("ok") for k, v in OUT["settings"].items()},
    "bot_management": OUT["bot_management"].get("ok"),
    "rulesets_listed": len((OUT["rulesets_list"].get("rulesets") or [])),
    "fw_total_events": OUT["classified_firewall_events_30d"]["total_events"],
    "fw_google_agent_events": len(OUT["classified_firewall_events_30d"]["google_agent"]),
    "fw_google_family_events": len(OUT["classified_firewall_events_30d"]["google_family"]),
    "fw_by_action": OUT["classified_firewall_events_30d"]["by_action"],
    "http_total_requests": OUT["classified_http_30d"]["total_requests"],
    "http_google_agent_groups": len(OUT["classified_http_30d"]["google_agent"]),
    "http_google_family_groups": len(OUT["classified_http_30d"]["google_family"]),
    "http_distinct_uas": OUT["classified_http_30d"]["distinct_user_agents"],
}, ensure_ascii=False, indent=1))
