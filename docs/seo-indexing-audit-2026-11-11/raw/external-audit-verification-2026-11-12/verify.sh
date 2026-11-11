#!/usr/bin/env bash
# Re-runnable live verification for report 15 (SEO-EXTERNAL-AUDIT-VERIFY-PLAN-2026-11-12).
# READ-ONLY: public GETs only, robots-respecting, no auth, no writes, ~20 requests.
# Usage: bash docs/seo-indexing-audit-2026-11-11/raw/external-audit-verification-2026-11-12/verify.sh
set -u
B="https://alkemos.com"
W=$(dirname "$0")
echo "== sitemap family counts (expect 112/100/78/28/1736/160/2/143 = 2359) =="
for s in pages commercial collections comparisons exercises foods recipes blog; do
  n=$(curl -sL -m 40 "$B/sitemap-$s.xml" | grep -c '<loc>'); echo "$s: $n"
done
echo "== /tools hub: server-rendered tool links (expect all 8) =="
curl -sL -m 40 "$B/tools" | grep -o 'href="/\(tools/[a-z-]*\|meal-planner\|ai-meal-planner\|ai-workout-planner\)"' | sort -u
echo "== /exercises hub: exercise links on page 1 (expect 20) + hubs =="
E=$(curl -sL -m 40 "$B/exercises"); echo "$E" | grep -c 'href="/exercises/[a-z0-9-]*"' ; echo "$E" | grep -o 'href="/muscles/[a-z]*"' | sort -u | wc -l
echo "== /foods hub: food cards + lists =="
F=$(curl -sL -m 40 "$B/foods"); echo "$F" | grep -c 'href="/foods/[a-z-]*"'; echo "$F" | grep -c 'href="/foods/lists/'
echo "== curated food EN: canonical/hreflang/schema =="
curl -sL -m 40 "$B/foods/chicken-breast" | grep -o '<link rel="canonical"[^>]*>\|<link rel="alternate" hrefLang="[^"]*"' | head -4
echo "== USDA-tail AR mirror: noindex,follow + English H1 =="
T=$(curl -sL -m 40 "$B/ar/foods/cheese-tilsit"); echo "$T" | grep -o '<meta name="robots"[^>]*>'; echo "$T" | grep -o '<h1[^>]*>[^<]*</h1>' | head -1
echo "== exercise EN: hreflang + HowTo schema =="
curl -sL -m 40 "$B/exercises/ab-roller" | grep -o 'hrefLang="[^"]*"\|"@type":"HowTo"' | sort | uniq -c
echo "== calorie tool: contextual /blog links (expect 0 — the measured gap B1) =="
curl -sL -m 40 "$B/tools/calorie-calculator" | grep -c 'href="/blog/'
echo "== external report's example URL (expect 404) + real Ozempic slug (expect 200) =="
curl -s -o /dev/null -w '%{http_code}\n' "$B/blog/how-much-protein-do-i-need-on-ozempic-daily-calculator"
curl -s -o /dev/null -w '%{http_code}\n' "$B/blog/protein-needs-ozempic-glp1-calculator-guide"
echo "== done =="
