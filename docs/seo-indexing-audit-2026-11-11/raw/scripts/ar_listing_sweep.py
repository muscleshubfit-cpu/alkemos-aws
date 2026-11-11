#!/usr/bin/env python3
"""AR foods listing sweep v2: save raw listing HTML + extract (url, h3-name) pairs
for the deterministic noindex-tail classification. 442 requests @3/s."""
import re, time, json, os, urllib.request

BASE = 'https://alkemos.com'
OUT = '/home/z/my-project/audit-work/food-enumeration/ar-listing-raw'
os.makedirs(OUT, exist_ok=True)
UA = 'AlkemosSEOAudit/1.0 (comprehensive audit 2026-11-11)'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', errors='ignore')

entries = []
for page in range(1, 443):
    url = f'{BASE}/ar/foods?page={page}'
    try:
        html = fetch(url)
    except Exception as e:
        print('ERR', page, e); continue
    with open(f'{OUT}/page-{page:03d}.html', 'w', encoding='utf-8') as f:
        f.write(html)
    # anchors with href, then nearest h3 within 1200 chars
    for m in re.finditer(r'<a\s[^>]*href="(/ar/foods/[a-z0-9\-]+)"[^>]*>', html):
        href = m.group(1)
        seg = html[m.end():m.end() + 1200]
        h3 = re.search(r'<h3[^>]*>(.*?)</h3>', seg, re.S)
        name = re.sub(r'<[^>]+>', '', h3.group(1)).strip() if h3 else ''
        entries.append({'url': href, 'name': name})
    if page % 100 == 0: print('page', page, 'entries so far', len(entries), flush=True)
    time.sleep(1.0 / 3.0)

with open('/home/z/my-project/audit-work/food-enumeration/ar-foods-named.json', 'w') as f:
    json.dump(entries, f, ensure_ascii=False)

def has_arabic(s): return bool(re.search(r'[\u0600-\u06FF]', s))
uniq = {e['url']: e['name'] for e in entries}
ar_named = [u for u, n in uniq.items() if has_arabic(n)]
ar_less = [u for u, n in uniq.items() if not has_arabic(n)]
summary = {'unique_ar_food_urls': len(uniq), 'with_arabic_name': len(ar_named),
           'arabicless': len(ar_less), 'samples_arabicless': ar_less[:5], 'samples_arabic': list(uniq[u] for u in ar_named[:5])}
with open('/home/z/my-project/audit-work/food-enumeration/ar-noindex-split.json', 'w') as f:
    json.dump(summary, f, ensure_ascii=False, indent=1)
print(json.dumps(summary, ensure_ascii=False, indent=1))
