#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Googlebot identity verification — official protocol (ready-to-run).

Owner order (2026-11-18 supplement), demand #1: verify Googlebot identity in the
Cloudflare data using the OFFICIAL mechanism (IP ranges / reverse DNS) —
User-Agent alone is NOT proof. The preserved raw analytics
(cloudflare-analytics-2026-11-18.json) carry NO client IPs, so this script is
the instrument that closes that gap: it pulls IP/ASN/geo/path dimensions from
the Cloudflare GraphQL Analytics API (read-only) and applies Google's two
official verification methods:

  Method 1 — reverse DNS both directions:
     IP → PTR hostname must end in .googlebot.com / .geo.googlebot.com
     (common crawlers) or .google.com (special/user-triggered), AND the
     hostname must forward-resolve back to the same IP.
  Method 2 — IP-range match against Google's published JSON files
     (pinned copies in ../google-ip-ranges-2026-11-18/, fetched 2026-11-18).

Focus: the 33×403 responses on Googlebot-UA requests (2026-11-04: 1 ·
2026-11-13: 25 · 2026-11-15: 7 — see ../evidence-audit-2026-11-18.json) —
plus a full-window identity census of Googlebot-UA traffic.

Usage:
  export CF_API_TOKEN="<Zone > Analytics > Read token>"
  python3 cf_googlebot_identity_verify.py            # whole window 11-04..11-18
  python3 cf_googlebot_identity_verify.py 2026-11-13 2026-11-14   # custom range

Token comes from the environment ONLY — never hardcoded, never printed.
Retention caveat: adaptive analytics keep a limited history depending on the
zone plan — run promptly; if early-November days come back empty, the preserved
daily totals remain the record (documented in the appendix §2).
"""
import ipaddress, json, os, socket, sys, time
import requests

TOK = os.environ.get("CF_API_TOKEN")
if not TOK:
    sys.exit("Set CF_API_TOKEN (Zone Analytics:Read). No token is stored by this script.")
ZONE_TAG = os.environ.get("CF_ZONE_TAG", "b4be55a0736831d9c5d9564788861076")  # alkemos.com
HERE = os.path.dirname(os.path.abspath(__file__))
RANGES_DIR = os.path.join(HERE, "..", "google-ip-ranges-2026-11-18")

START = sys.argv[1] if len(sys.argv) > 1 else "2026-11-04"
END = sys.argv[2] if len(sys.argv) > 2 else "2026-11-18"

RANGE_FILES = ["common-crawlers", "special-crawlers", "user-triggered-agents",
               "user-triggered-fetchers-google", "user-triggered-fetchers"]
RDN_SUFFIXES = {  # official masks per the Verify-Googlebot doc (read 2026-11-18)
    "common-crawlers": (".googlebot.com", ".geo.googlebot.com"),
    "special-crawlers": (".google.com",),
    "user-triggered-fetchers-google": (".google.com",),
    "user-triggered-agents": (".google.com",),
    "user-triggered-fetchers": (".gae.googleusercontent.com", ".google.com"),
}

def load_ranges():
    ranges = []
    for name in RANGE_FILES:
        p = os.path.join(RANGES_DIR, name + ".json")
        if not os.path.exists(p):
            sys.exit(f"missing pinned range file: {p}")
        d = json.load(open(p))
        for pref in d.get("prefixes", []):
            for key in ("ipv4Prefix", "ipv6Prefix", "ipv4", "ipv6"):
                if key in pref:
                    ranges.append((name, ipaddress.ip_network(pref[key])))
                    break
    return ranges

RANGES = load_ranges()

def range_match(ip):
    a = ipaddress.ip_address(ip)
    for name, net in RANGES:
        if a in net:
            return name
    return None

def rdns_verify(ip, timeout=8):
    """Google's method 1: reverse DNS + forward confirmation, both directions."""
    try:
        hostname = socket.gethostbyaddr(ip)[0]  # may raise for non-Google IPs
    except Exception as e:
        return {"ptr": None, "error": f"{type(e).__name__}", "official_mask": None,
                "forward_ok": None, "verdict_rdns": "NO_PTR"}
    cat = next((n for n, sufs in RDN_SUFFIXES.items()
                if any(hostname.endswith(s) or hostname == s.lstrip(".") for s in sufs)), None)
    fwd = None
    try:
        fwd = socket.gethostbyname_ex(hostname)[2]  # all A records
    except Exception:
        fwd = []
    forward_ok = (ip in fwd) if fwd else None
    verdict = "VERIFIED_RDNS" if (cat and forward_ok) else (
        "MASK_NO_FORWARD" if cat else "PTR_BUT_NOT_GOOGLE")
    return {"ptr": hostname, "official_mask": cat, "forward_ips": fwd,
            "forward_ok": forward_ok, "verdict_rdns": verdict}

def gq(query, retries=3):
    last = None
    for _ in range(retries):
        r = requests.post("https://api.cloudflare.com/client/v4/graphql",
                          headers={"Authorization": f"Bearer {TOK}",
                                   "Content-Type": "application/json"},
                          json={"query": query}, timeout=90)
        d = r.json()
        if not d.get("errors"):
            return d
        last = json.dumps(d.get("errors"))[:300]
        time.sleep(2)
    raise RuntimeError(f"GraphQL error: {last}")

DIM_FULL = """clientIP clientASNDescription clientCountryName userAgent
              edgeResponseStatus clientRequestPath"""
DIM_FALLBACK = """clientIP clientASNDescription clientCountryName userAgent
                  edgeResponseStatus"""

def query_403(day_start, day_end):
    """All 403 responses in the window (any UA) with full attribution."""
    for dims in (DIM_FULL, DIM_FALLBACK):  # path dimension may not exist on all plans
        try:
            d = gq("""{ viewer { zones(filter: {zoneTag: "%s"}) {
              httpRequestsAdaptiveGroups(limit: 1000,
                filter: { datetime_geq: "%sT00:00:00Z", datetime_lt: "%sT00:00:00Z",
                          edgeResponseStatus: 403 },
                orderBy: [count_DESC]) {
                dimensions { %s } count } } } }""" % (ZONE_TAG, day_start, day_end, dims))
            gs = d["data"]["viewer"]["zones"][0]["httpRequestsAdaptiveGroups"]
            has_path = "clientRequestPath" in dims
            return gs, has_path
        except RuntimeError as e:
            if "clientRequestPath" in str(e) and dims is DIM_FULL:
                continue
            raise
    return [], False

def query_googlebot_ips(day_start, day_end):
    """All Google-family UA traffic grouped by IP (identity census)."""
    d = gq("""{ viewer { zones(filter: {zoneTag: "%s"}) {
      httpRequestsAdaptiveGroups(limit: 10000,
        filter: { datetime_geq: "%sT00:00:00Z", datetime_lt: "%sT00:00:00Z" },
        orderBy: [count_DESC]) {
        dimensions { clientIP clientASNDescription userAgent edgeResponseStatus }
        count } } } }""" % (ZONE_TAG, day_start, day_end))
    gs = d["data"]["viewer"]["zones"][0]["httpRequestsAdaptiveGroups"]
    fam = [g for g in gs if any(k in g["dimensions"]["userAgent"] for k in
           ("Googlebot", "Google-InspectionTool", "GoogleOther", "Mediapartners-Google",
            "Google-Display-Ads-Bot"))]
    return fam

def census(entries):
    out = {}
    for g in entries:
        dim, c = g["dimensions"], g["count"]
        ip = dim["clientIP"]
        r = out.setdefault(ip, {"ip": ip, "asn": dim.get("clientASNDescription"),
                                "requests": 0, "uas": {}, "statuses": {}})
        r["requests"] += c
        r["uas"][dim["userAgent"]] = r["uas"].get(dim["userAgent"], 0) + c
        st = str(dim["edgeResponseStatus"])
        r["statuses"][st] = r["statuses"].get(st, 0) + c
    return out

def verify(ip_rows):
    for ip, r in sorted(ip_rows.items(), key=lambda kv: -kv[1]["requests"]):
        r["range_match"] = range_match(ip)
        r.update(rdns_verify(ip))
        google_ua = any(("Googlebot" in u or "Google-InspectionTool" in u) for u in r["uas"])
        if r["range_match"] or r["verdict_rdns"] == "VERIFIED_RDNS":
            r["final_verdict"] = "VERIFIED_GOOGLE" if google_ua else "VERIFIED_GOOGLE_NONSEARCH_UA"
        elif r["verdict_rdns"] in ("NO_PTR", "PTR_BUT_NOT_GOOGLE") or r["range_match"] is None:
            r["final_verdict"] = "SPOOFED_OR_UNRELATED" if google_ua else "NON_GOOGLE_IP"
        else:
            r["final_verdict"] = "UNDETERMINED"
    return ip_rows

def main():
    print(f"window: {START} → {END} (end-exclusive) · ranges pinned 2026-11-18")
    # Pass 1 — the 403 census (the owner's demand #2)
    e403, has_path = query_403(START, END)
    rows403 = census(e403)
    rows403 = verify(rows403)
    # Pass 2 — Google-family UA identity census (the owner's demand #1)
    fam = query_googlebot_ips(START, END)
    rows_fam = census(fam)
    rows_fam = verify(rows_fam)
    spoofed = {ip: r for ip, r in rows_fam.items() if r["final_verdict"] == "SPOOFED_OR_UNRELATED"}
    verified = {ip: r for ip, r in rows_fam.items() if "VERIFIED_GOOGLE" in r["final_verdict"]}
    out = {
        "window": f"{START} -> {END}", "collected_at": time.strftime("%Y-%m-%d"),
        "method": "Cloudflare GraphQL (read-only) + Google official verification "
                  "(reverse DNS both directions + published IP ranges)",
        "official_ranges": {"dir": "google-ip-ranges-2026-11-18",
                            "files": {n: sum(1 for nn, _ in RANGES if nn == n) for n in RANGE_FILES}},
        "http_403_full_attribution": {"path_dimension_available": has_path,
                                      "distinct_source_ips": len(rows403),
                                      "ips": rows403},
        "google_family_identity_census": {
            "distinct_ips": len(rows_fam), "verified_google_ips": len(verified),
            "spoofed_or_unrelated_ips": len(spoofed), "ips": rows_fam},
        "notes": ["UA string alone is never treated as proof",
                  "if early-November days return empty, zone-plan retention is the cause — "
                  "the preserved daily totals remain the record"],
    }
    path = os.path.join(HERE, "..", f"googlebot-identity-verify-{time.strftime('%Y-%m-%d')}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("saved →", path)
    print(f"403 source IPs: {len(rows403)} · Google-family IPs: {len(rows_fam)} "
          f"(verified {len(verified)} · spoofed/unrelated {len(spoofed)})")
    for ip, r in rows403.items():
        print(f"  403 ← {ip} [{r['asn']}] ×{r['requests']} → {r['final_verdict']} "
              f"(range={r['range_match']}, ptr={r.get('ptr')})")

if __name__ == "__main__":
    main()
