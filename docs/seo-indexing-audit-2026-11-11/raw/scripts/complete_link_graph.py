#!/usr/bin/env python3
"""Complete the link graph: sweep exercises pagination + re-sweep foods pagination
saving display names (to classify AR noindex tail deterministically).
Rate-limited 3 req/s. Read-only audit."""
import re, time, json, os, urllib.request
from collections import OrderedDict

BASE = 'https://alkemos.com'
OUT = '/home/z/my-project/audit-work/food-enumeration'
os.makedirs(OUT, exist_ok=True)
UA = 'AlkemosSEOAudit/1.0 (comprehensive audit 2026-11-11)'
RATE = 3.0

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', errors='ignore')

def has_arabic(s):
    return bool(re.search(r'[\u0600-\u06FF]', s))

# ---- 1) exercises pagination sweep (page 1..44) ----
ex = {'en': OrderedDict(), 'ar': OrderedDict()}
for prefix, key in [('/exercises', 'en'), ('/ar/exercises', 'ar')]:
    for page in range(1, 45):
        try:
            html = fetch(f'{BASE}{prefix}?page={page}')
        except Exception as e:
            print('ERR', prefix, page, e); continue
        for u in re.findall(r'href="(' + re.escape(prefix) + r'/[a-z0-9\-]+)"', html):
            ex[key][u] = True
        time.sleep(1.0 / RATE)
with open(f'{OUT}/exercises-urls.json', 'w') as f:
    json.dump({k: sorted(v) for k, v in ex.items()}, f, ensure_ascii=False, indent=0)
print('exercises EN:', len(ex['en']), 'AR:', len(ex['ar']))

# ---- 2) foods listing re-sweep with display names ----
foods = {'en': [], 'ar': []}
for prefix, key in [('/foods', 'en'), ('/ar/foods', 'ar')]:
    for page in range(1, 443):
        try:
            html = fetch(f'{BASE}{prefix}?page={page}')
        except Exception as e:
            print('ERR', prefix, page, e); continue
        # each food card: <a href="/foods/slug" ...> ... name text nearby
        # capture link + the card text to find the display name
        for m in re.finditer(r'<a\s[^>]*href="(' + re.escape(prefix) + r'/[a-z0-9\-]+)"[^>]*>(.{0,400}?)</a>', html, re.S):
            url, inner = m.group(1), m.group(2)
            # display name: first text span inside the card
            texts = re.findall(r'>([^<>]{2,80})<', inner)
            name = ''
            for t in texts:
                t = t.strip()
                if t and not re.match(r'^[\d.,\s%kcal\-]+$', t) and not t.startswith('http'):
                    name = t; break
            foods[key].append({'url': url, 'name': name})
        time.sleep(1.0 / RATE)
    print(key, 'listing entries:', len(foods[key]))

with open(f'{OUT}/foods-listing-entries.json', 'w') as f:
    json.dump(foods, f, ensure_ascii=False)

# ---- 3) AR noindex split by arabicless display name ----
ar = {}
for e in foods['ar']:
    ar[e['url']] = e['name']
arabic_named = {u: n for u, n in ar.items() if has_arabic(n)}
arabicless = {u: n for u, n in ar.items() if not has_arabic(n)}
summary = {
    'en_food_urls': len(set(f['url'] for f in foods['en'])),
    'ar_food_urls': len(set(f['url'] for f in foods['ar'])),
    'ar_with_arabic_displayname': len(arabic_named),
    'ar_arabicless_displayname': len(arabicless),
    'arabicless_sample': list(arabicless.items())[:5],
}
with open(f'{OUT}/listing-summary.json', 'w') as f:
    json.dump(summary, f, ensure_ascii=False, indent=1)
print(json.dumps(summary, ensure_ascii=False, indent=1))
