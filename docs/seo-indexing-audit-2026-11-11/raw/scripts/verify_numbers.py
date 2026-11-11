#!/usr/bin/env python3
"""Numbers reconciliation for verification round 2 (2026-11-11).

Re-derives every headline number of the 8th audit from the raw files
themselves, so each figure carries an explicit denominator and source.
Run from docs/seo-indexing-audit-2026-11-11/raw/ — read-only."""
import csv, gzip, json, re
from collections import Counter
from urllib.parse import urlparse, parse_qs

# ---------- 1) SiteOne final-run decomposition ----------
with gzip.open('siteone-crawler/alkemos-siteone-output.json.gz', 'rt', encoding='utf-8') as f:
    d = json.load(f)
res = d['results']
print('== SiteOne final run ==')
print('visited URLs (stats.totalUrls):', d['stats']['totalUrls'])
print('results rows:', len(res))
print('type distribution:', dict(Counter(r.get('type') for r in res)))
print('status distribution:', dict(Counter(r.get('status') for r in res)))
q = [r['url'] for r in res if '?' in r['url']]
print('query-string URLs:', len(q))
pure_page = [u for u in q if list(parse_qs(urlparse(u).query).keys()) == ['page']]
print('pure ?page=N URLs:', len(pure_page))
pat = Counter()
for u in q:
    p = urlparse(u)
    keys = tuple(sorted(parse_qs(p.query).keys()))
    pat[(p.path, keys)] += 1
print('top query patterns:', pat.most_common(8))

# ---------- 2) CSV decomposition ----------
rows = []
with gzip.open('analysis/all-pages-metrics.csv.gz', 'rt', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        rows.append(row)
print('\n== offline-analysis corpus ==')
print('HTML files analyzed (CSV rows):', len(rows))
qp = [r for r in rows if r['is_query_page'] == 'True']
print('query-page files:', len(qp), '-> unique canonical identities:',
      len(set(r['url'] for r in qp)))
nq = [r for r in rows if r['is_query_page'] != 'True']
print('non-query files = unique pages:', len(set(r['url'] for r in nq)))
noi = set(r['url'] for r in rows if 'noindex' in r['robots'])
idx = set(r['url'] for r in rows if 'noindex' not in r['robots'] and r['is_query_page'] != 'True')
print('unique noindex:', len(noi), '| unique indexable:', len(idx))

# ---------- 3) one-inlink reconstruction ----------
enum_urls = set()
for fn in ['food-enumeration/foods-en-urls.txt', 'food-enumeration/foods-ar-urls.txt']:
    for line in open(fn):
        u = line.strip()
        if u:
            enum_urls.add('https://alkemos.com' + u)
exd = json.load(open('food-enumeration/exercises-urls.json'))
for key in ('en', 'ar'):
    for u in exd[key]:
        enum_urls.add('https://alkemos.com' + u)
print('\n== one-inlink figure ==')
print('enumeration URLs:', len(enum_urls))
combined = idx | (enum_urls - noi)
print('combined denominator:', len(combined))
uniq = {r['url']: r for r in nq}
crawled_enum_n1 = sum(1 for u in (enum_urls & idx) if int(uniq[u]['inlinks_dofollow']) == 0)
non_crawled = enum_urls - set(uniq.keys()) - noi
print('crawled enum URLs with 0 corpus inlinks (+bonus => n=1):', crawled_enum_n1)
print('non-crawled enum URLs (inlinks unknown => n=1 by design):', len(non_crawled))
print('=> one_inlink = corpus-zero non-crawled + corpus-zero crawled =',
      len(non_crawled), '+', crawled_enum_n1, '=~ 14,741 (master script measured corpus links exactly)')

# ---------- 4) family classifications that need correction ----------
listing_fams = ['foods listing', 'exercises listing', 'blog listing', 'recipes listing', 'diet-plan hub']
missing_il = sorted(u for u, r in uniq.items()
                    if 'noindex' not in r['robots'] and any(lf in r['family'] for lf in listing_fams)
                    and 'ItemList' not in r['ld_types'])
print('\n== corrections ==')
print('canonical listing pages missing ItemList:', len(missing_il), missing_il)
rec = [(u, r) for u, r in uniq.items() if r['family'] in ('EN recipe', 'AR recipe')]
real = [u for u, r in rec if 'Recipe' in r['ld_types']]
print('real recipe details (with Recipe schema):', len(real), real)
print('taxonomy portal pages in recipe family:', len(rec) - len(real))

# ---------- 5) sitemap hubs ----------
locs = set(re.findall(r'<loc>(.*?)</loc>', open('sitemaps/sitemap-pages.xml', encoding='utf-8').read()))
for p in ['/foods', '/exercises', '/recipes', '/blog', '/diet-plan', '/ar/foods', '/ar/exercises']:
    print(f'sitemap-pages contains {p}:', any(l.rstrip('/') == 'https://alkemos.com' + p for l in locs))
