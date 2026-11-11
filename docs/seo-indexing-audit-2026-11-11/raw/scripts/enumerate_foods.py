#!/usr/bin/env python3
"""Enumerate the full food-detail URL population via systematic pagination sweep.
Saves: raw listing links per page + aggregated URL lists (EN/AR) + summary counts.
Rate-limited to 3 req/s. Audit-only (read-only GETs)."""
import re, time, json, sys, urllib.request, urllib.error
from collections import OrderedDict

BASE = 'https://alkemos.com'
RATE = 3.0
OUT = '/home/z/my-project/audit-work/food-enumeration'
import os
os.makedirs(OUT, exist_ok=True)

UA = 'AlkemosSEOAudit/1.0 (comprehensive audit 2026-11-11; contact: site owner)'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'en,ar'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, r.read().decode('utf-8', errors='ignore')

def sweep(prefix):
    """prefix: '/foods' or '/ar/foods' — walk ?page=1.. until last page."""
    urls = OrderedDict()
    listing_meta = []
    page = 1
    last = None
    while True:
        url = f'{BASE}{prefix}?page={page}'
        try:
            status, html = fetch(url)
        except Exception as e:
            listing_meta.append({'page': page, 'error': str(e)})
            break
        foods = sorted(set(re.findall(r'href="(' + re.escape(prefix) + r'/[a-z0-9\-]+)"', html)))
        pag = sorted(set(int(p) for p in re.findall(r'[?&]page=(\d+)', html)))
        canon = re.search(r'<link rel="canonical" href="([^"]+)"', html)
        listing_meta.append({'page': page, 'status': status, 'foods_on_page': len(foods),
                             'canonical': canon.group(1) if canon else None,
                             'max_page_ref': max(pag) if pag else None})
        for f in foods:
            urls[f] = True
        if pag:
            last = max(pag) if last is None else max(last, max(pag))
        # stop conditions: no foods on page OR page beyond last known
        if not foods or (last and page >= last):
            if page >= 442 or not foods:
                break
        if page > 500:  # hard safety cap
            break
        page += 1
        time.sleep(1.0 / RATE)
    return urls, listing_meta, last

summary = {}
for prefix, name in [('/foods', 'en'), ('/ar/foods', 'ar')]:
    print(f'sweeping {prefix} ...', flush=True)
    urls, meta, last = sweep(prefix)
    with open(f'{OUT}/foods-{name}-urls.txt', 'w') as f:
        f.write('\n'.join(urls) + '\n')
    with open(f'{OUT}/foods-{name}-listing-meta.json', 'w') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    summary[name] = {'unique_food_urls': len(urls), 'last_page_seen': last,
                     'listing_pages_fetched': len(meta)}
    print(f'  {name}: {len(urls)} unique food URLs, last page = {last}', flush=True)

with open(f'{OUT}/summary.json', 'w') as f:
    json.dump(summary, f, indent=1)
print('DONE', summary)
