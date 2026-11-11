#!/usr/bin/env python3
"""Focused live-sample verification for the Alkemos audit round 2 (2026-11-11).

Evaluates the actual library value of foods/exercises pages (data fields,
images, internal links, sections) on a small polite sample — NOT a re-crawl.
Rate-limited to ~1 request/1.2s, ~12 requests total.
"""
import re, time, json, urllib.request
from collections import Counter

BASE = 'https://alkemos.com'
UA = 'AlkemosSEOVerify/1.0 (focused verification round 2026-11-11; site owner)'

SAMPLES = [
    ('/foods?page=2', 'EN foods listing p2'),
    ('/foods?page=440', 'EN foods listing p440 (deep tail)'),
    ('/foods/chicken-breast', 'EN food CURATED (enriched, in sitemap)'),
    ('/foods/cheese-tilsit', 'EN food TAIL (no tags, not in sitemap)'),
    ('/foods/cheese-pasteurized-process-pimento', 'EN food TAIL deep (USDA long name)'),
    ('/ar/foods/chicken-breast', 'AR food named (indexable band)'),
    ('/ar/foods/cheese-tilsit', 'AR food arabicless (should be noindex)'),
    ('/exercises', 'EN exercises listing'),
    ('/exercises/34-sit-up', 'EN exercise (has images)'),
    ('/exercises/incline-bench-press', 'EN exercise enriched?'),
    ('/ar/exercises/34-sit-up', 'AR exercise'),
    ('/foods?cat=protein&page=2', 'EN foods category-filtered listing'),
]

def fetch(url):
    req = urllib.request.Request(BASE + url, headers={'User-Agent': UA, 'Accept-Language': 'en,ar'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, r.read().decode('utf-8', errors='ignore'), dict(r.headers)

def strip_tags(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s)).strip()

def analyze(url, label):
    status, html, headers = fetch(url)
    title = re.search(r'<title[^>]*>(.*?)</title>', html, re.S)
    robots = re.search(r'<meta[^>]+name="robots"[^>]+content="([^"]*)"', html)
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    h2s = [strip_tags(h) for h in re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.S)]
    h3s = [strip_tags(h) for h in re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.S)]
    body = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', html, flags=re.S | re.I)
    body = re.sub(r'<(header|footer|nav)[^>]*>.*?</\1>', ' ', body, flags=re.S | re.I)
    text = strip_tags(re.sub(r'<[^>]+>', ' ', body))
    words = len(text.split())
    imgs = re.findall(r'<img[^>]+src="([^"]+)"', html)
    ogimg = re.search(r'property="og:image"[^>]+content="([^"]+)"', html)
    hrefs = re.findall(r'<a\s[^>]*href="(/[^"]*)"', html)
    internal = [h for h in hrefs if not any(h.endswith(e) for e in ('.js','.css','.png','.webp','.svg','.ico','.woff2'))]
    uniq_internal = set(internal)
    food_links = [h for h in uniq_internal if re.match(r'/(ar/)?foods/[a-z0-9-]+$', h)]
    ex_links = [h for h in uniq_internal if re.match(r'/(ar/)?exercises/[a-z0-9-]+$', h)]
    page_links = [h for h in uniq_internal if 'page=' in h]
    ld_types = []
    for m in re.finditer(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        try:
            obj = json.loads(m.group(1).strip())
            def walk(o):
                if isinstance(o, dict):
                    t = o.get('@type')
                    if isinstance(t, str): ld_types.append(t)
                    for v in o.values(): walk(v)
                elif isinstance(o, list):
                    for v in o: walk(v)
            walk(obj)
        except Exception: ld_types.append('PARSE_ERROR')
    tables = len(re.findall(r'<table', html))
    return {
        'url': url, 'label': label, 'status': status,
        'title': strip_tags(title.group(1))[:90] if title else '',
        'robots': robots.group(1) if robots else '(none)',
        'canonical': canon.group(1) if canon else '',
        'h1': strip_tags(h1s[0])[:70] if h1s else '',
        'h2_count': len(h2s), 'h3_count': len(h3s),
        'h2_list': h2s[:12],
        'words': words,
        'img_count': len(imgs), 'img_sample': imgs[:3],
        'og_image': ogimg.group(1) if ogimg else '',
        'internal_links_unique': len(uniq_internal),
        'food_links': len(food_links), 'exercise_links': len(ex_links),
        'page_param_links': len(page_links),
        'tables': tables,
        'ld_types': sorted(set(ld_types)),
        'html_kb': len(html)//1024,
    }

results = []
for url, label in SAMPLES:
    try:
        r = analyze(url, label)
        results.append(r)
        print(f"[{r['status']}] {url} — {r['words']}w | imgs {r['img_count']} | intLinks {r['internal_links_unique']} | foodLinks {r['food_links']} | pagLnks {r['page_param_links']} | robots: {r['robots']}")
        time.sleep(1.2)
    except Exception as e:
        print(f"ERR {url}: {e}")
        results.append({'url': url, 'label': label, 'error': str(e)})
        time.sleep(1.2)

with open('/home/z/my-project/audit-verify/live-samples.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print('\nsaved to audit-verify/live-samples.json')
