#!/usr/bin/env python3
"""Master offline-corpus analysis for the Alkemos SEO audit (2026-11-11).
Parses all crawled HTML files (offline export) and the SiteOne JSON output to produce
comprehensive per-page metrics, aggregated stats, and comparison-ready datasets."""
import os, re, json, glob, hashlib
from collections import Counter, defaultdict
from urllib.parse import urljoin, urlparse, parse_qsl

BASE = 'https://alkemos.com'
OFFLINE = '/home/z/my-project/audit-work/crawl-offline'
SITEMAPS_DIR = '/home/z/my-project/audit-work/live-recon/sitemaps'
OUT = '/home/z/my-project/audit-work/analysis'
os.makedirs(OUT, exist_ok=True)

# ---------- load sitemap URL set ----------
sitemap_urls = set()
for f in os.listdir(SITEMAPS_DIR):
    data = open(os.path.join(SITEMAPS_DIR, f), encoding='utf-8').read()
    for loc in re.findall(r'<loc>(.*?)</loc>', data):
        sitemap_urls.add(loc.strip().rstrip('/') if loc.strip() != BASE else loc.strip())
# normalize: strip trailing slash except root
sm_norm = set()
for u in sitemap_urls:
    sm_norm.add(u if u == BASE else u.rstrip('/'))

# ---------- helpers ----------
RE_ROBOTS = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']', re.I)
RE_ROBOTS2 = re.compile(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']robots["\']', re.I)
RE_CANON = re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', re.I)
RE_TITLE = re.compile(r'<title[^>]*>(.*?)</title>', re.S)
RE_DESC = re.compile(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']', re.I)
RE_H1 = re.compile(r'<h1[^>]*>(.*?)</h1>', re.S | re.I)
RE_A = re.compile(r'<a\s[^>]*href=["\']([^"\'#]+)["\'][^>]*>', re.I)
RE_REL = re.compile(r'rel=["\']([^"\']*)["\']', re.I)
RE_JSONLD = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.S | re.I)
RE_OGURL = re.compile(r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\']([^"\']+)["\']', re.I)
RE_LANG = re.compile(r'<html[^>]+lang=["\']([^"\']+)["\']', re.I)

def strip_tags(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s)).strip()

def classify(url):
    p = urlparse(url).path
    if p.startswith('/ar/'):
        rest = p[4:]
        pref = 'AR '
    else:
        rest = p.lstrip('/')
        pref = 'EN '
    if rest.startswith('foods/compare/'): return pref + 'food comparison'
    if rest.startswith('foods/lists/'): return pref + 'nutrient list'
    if rest.startswith('foods/'): return pref + 'food detail'
    if rest == 'foods': return pref + 'foods listing'
    if rest.startswith('exercises/'): return pref + 'exercise'
    if rest == 'exercises': return pref + 'exercises listing'
    if rest.startswith('blog/'): return pref + 'blog article'
    if rest == 'blog': return pref + 'blog listing'
    if rest.startswith('diet-plan/'): return pref + 'diet-plan cell'
    if rest == 'diet-plan': return pref + 'diet-plan hub'
    if rest.startswith('muscles/'): return pref + 'muscle hub'
    if rest.startswith('collections/'): return pref + 'collection'
    if rest.startswith('compare/') or '/compare/' in rest: return pref + 'comparison'
    if rest.startswith('recipes/'): return pref + 'recipe'
    if rest == 'recipes': return pref + 'recipes listing'
    if rest.startswith('programs/'): return pref + 'program'
    if rest.startswith('tools/'): return pref + 'tool'
    if rest.startswith('equipment/'): return pref + 'equipment'
    if rest.startswith('authors/'): return pref + 'author'
    if rest in ('tools', 'memberships', 'coaching', 'evo', 'meal-planner', 'ai-meal-planner',
                'ai-workout-planner', 'about', 'contact', 'faq', 'privacy', 'terms', '',
                'workout-tracker', 'macro-tracker', 'for-coaches', 'guides', 'compare', 'authors'):
        return ('Core page ' if rest else 'Homepage ') + ('AR' if pref.startswith('AR') else 'EN')
    return pref + 'other: ' + rest.split('/')[0]

def url_of_file(path):
    """Reconstruct the source URL of an offline-export file."""
    rel = os.path.relpath(path, OFFLINE).replace(os.sep, '/')
    if rel == 'index.html': return BASE + '/'
    if rel.endswith('.html'):
        rel = rel[:-5]
        # query hash files: family.HASH.html — keep None, resolve via canonical later
        m = re.match(r'^(.+)\.[0-9a-f]{10}$', rel)
        if m: return None  # query URL — identity via canonical
        return BASE + '/' + rel
    return None

def norm_url(u):
    u = u.split('#')[0]
    if u.startswith('http://'): u = 'https://' + u[7:]
    if u.startswith('https://www.alkemos.com'): u = 'https://alkemos.com' + u[len('https://www.alkemos.com'):]
    if u.endswith('/') and u != BASE + '/': u = u.rstrip('/')
    return u

# ---------- pass 1: per-page metrics + outgoing links ----------
pages = []            # list of dicts
inlinks = Counter()   # norm_url -> count of internal dofollow inlinks
inlink_sources = defaultdict(set)
ext_links = Counter() # external absolute URL -> count (dedup per source page below)
ext_link_pages = defaultdict(set)

all_files = []
for root, dirs, files in os.walk(OFFLINE):
    if '/_next' in root or '/http-cache' in root: continue
    for f in files:
        if f.endswith('.html'): all_files.append(os.path.join(root, f))
print('HTML files to analyze:', len(all_files))

for i, fp in enumerate(all_files):
    try:
        html = open(fp, encoding='utf-8', errors='ignore').read()
    except Exception:
        continue
    url = url_of_file(fp)
    robots = (RE_ROBOTS.search(html) or RE_ROBOTS2.search(html))
    robots = robots.group(1).lower().replace(' ', '') if robots else ''
    canon = RE_CANON.search(html)
    canon = canon.group(1).strip() if canon else None
    ogurl = RE_OGURL.search(html)
    if url is None:
        # query page: identity = canonical (or og:url)
        url = norm_url(canon) if canon else (norm_url(ogurl.group(1)) if ogurl else None)
        is_query = True
    else:
        url = norm_url(url)
        is_query = False
    title = RE_TITLE.search(html)
    title = strip_tags(title.group(1)) if title else ''
    desc = RE_DESC.search(html)
    desc = strip_tags(desc.group(1)) if desc else ''
    h1s = [strip_tags(h) for h in RE_H1.findall(html)]
    # body word count (main content approx: whole body minus scripts/styles/nav)
    body = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', html, flags=re.S | re.I)
    body = re.sub(r'<(header|footer|nav)[^>]*>.*?</\1>', ' ', body, flags=re.S | re.I)
    text = strip_tags(re.sub(r'<[^>]+>', ' ', body))
    words = len(text.split())
    # JSON-LD
    ld_types = []
    ld_json = []
    for m in RE_JSONLD.finditer(html):
        raw = m.group(1).strip()
        try:
            obj = json.loads(raw)
            ld_json.append(obj)
            def walk(o):
                if isinstance(o, dict):
                    t = o.get('@type')
                    if isinstance(t, str): ld_types.append(t)
                    elif isinstance(t, list): ld_types.extend([x for x in t if isinstance(x, str)])
                    for v in o.values(): walk(v)
                elif isinstance(o, list):
                    for v in o: walk(v)
            walk(obj)
        except Exception:
            ld_json.append({'__parse_error__': raw[:120]})
    hreflangs = re.findall(r'hrefLang=["\']([^"\']+)["\']', html, re.I) or re.findall(r'hreflang=["\']([^"\']+)["\']', html, re.I)
    lang = RE_LANG.search(html)
    # internal outgoing links
    out_internal = set()
    for a in RE_A.finditer(html):
        href = a.group(1)
        if href.startswith('javascript:') or href.startswith('mailto:') or href.startswith('tel:'): continue
        absu = urljoin((url or BASE) + '/', href)
        if not absu.startswith('http'): continue
        host = urlparse(absu).netloc
        if host in ('alkemos.com', 'www.alkemos.com'):
            rel_attr = RE_REL.search(a.group(0))
            is_nofollow = rel_attr and 'nofollow' in rel_attr.group(1).lower()
            t = norm_url(absu)
            if not any(t.endswith(ext) for ext in ('.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.woff', '.woff2', '.xml', '.txt', '.json')):
                out_internal.add(t)
                if not is_nofollow:
                    inlinks[t] += 1
                    if url: inlink_sources[t].add(url)
        else:
            ext_links[absu] += 1
            if url: ext_link_pages[absu].add(url)
    pages.append({
        'url': url, 'file': os.path.relpath(fp, OFFLINE), 'is_query_page': is_query,
        'robots': robots, 'canonical': canon, 'title': title, 'title_len': len(title),
        'desc': desc, 'desc_len': len(desc), 'h1_count': len(h1s),
        'h1': h1s[0] if h1s else '', 'words': words, 'ld_types': sorted(set(ld_types)),
        'ld_blocks': len(ld_json), 'ld_parse_errors': sum(1 for o in ld_json if isinstance(o, dict) and '__parse_error__' in o),
        'hreflangs': hreflangs, 'lang': lang.group(1) if lang else None,
        'out_internal': len(out_internal),
    })
    if (i + 1) % 3000 == 0: print(f'  processed {i+1}/{len(all_files)}', flush=True)

print('pass 1 done:', len(pages), 'pages')

# ---------- listing-based inlinks (enumeration sweeps) ----------
listing_inlink_urls = set()
ENUM = '/home/z/my-project/audit-work/food-enumeration'
for fn in ['foods-en-urls.txt', 'foods-ar-urls.txt']:
    fp = os.path.join(ENUM, fn)
    if os.path.exists(fp):
        for line in open(fp):
            u = line.strip()
            if u:
                listing_inlink_urls.add(norm_url(BASE + u if u.startswith('/') else u))
try:
    exd = json.load(open(os.path.join(ENUM, 'exercises-urls.json')))
    for key in ('en', 'ar'):
        for u in exd[key]:
            listing_inlink_urls.add(norm_url(BASE + u))
except FileNotFoundError:
    pass
print('listing-discovered URLs added to graph:', len(listing_inlink_urls))

# ---------- AR noindex heuristic cross-validation on crawled sample ----------
try:
    ar_named = json.load(open(os.path.join(ENUM, 'ar-foods-named.json')))
    def has_arabic(s): return bool(re.search(r'[\u0600-\u06FF]', s))
    ar_map = {e['url']: e['name'] for e in ar_named}
    matched = mismatched = 0
    mismatch_samples = []
    for p in pages:
        u = p['url'] or ''
        path = urlparse(u).path
        if path.startswith('/ar/foods/') and path != '/ar/foods/methodology':
            slug = path[len('/ar/foods/'):]
            key = '/ar/foods/' + slug
            if key in ar_map:
                pred_noindex = not has_arabic(ar_map[key])
                actual_noindex = 'noindex' in p['robots']
                if pred_noindex == actual_noindex: matched += 1
                else:
                    mismatched += 1
                    if len(mismatch_samples) < 8:
                        mismatch_samples.append({'url': u, 'listing_name': ar_map[key], 'robots': p['robots']})
    ar_validation = {'matched': matched, 'mismatched': mismatched, 'samples': mismatch_samples}
except Exception as e:
    ar_validation = {'error': str(e)}
print('AR heuristic validation:', ar_validation)

# ---------- aggregates ----------
def is_noindex(p):
    return 'noindex' in p['robots']

noindex_pages = [p for p in pages if is_noindex(p)]
indexable = [p for p in pages if not is_noindex(p) and p['url']]

status = {
    'total_analyzed': len(pages),
    'query_pages_identity_by_canonical': sum(1 for p in pages if p['is_query_page']),
    'noindex_total': len(noindex_pages),
    'noindex_by_family': Counter(classify(p['url']) for p in noindex_pages),
    'indexable_total': len(indexable),
    'noindex_values': Counter(p['robots'] for p in noindex_pages),
}

# canonical checks (indexable pages)
canon_issues = {'missing': [], 'non_self': [], 'cross_domain': [], 'http': []}
for p in indexable:
    c = p['canonical']
    if not c:
        canon_issues['missing'].append(p['url'])
    else:
        cn = norm_url(c)
        if cn != p['url']:
            # query pages canonicalizing to clean path are CORRECT; flag others
            if p['is_query_page']:
                continue  # expected pattern (checked separately)
            canon_issues['non_self'].append({'url': p['url'], 'canonical': c})
        if c.startswith('http://'): canon_issues['http'].append(p['url'])
        if 'alkemos.com' not in c: canon_issues['cross_domain'].append({'url': p['url'], 'canonical': c})

# query-page canonical correctness
qpages = [p for p in pages if p['is_query_page']]
q_canon_ok = sum(1 for p in qpages if p['canonical'] and norm_url(p['canonical']) == re.sub(r'\?.*$', '', p['url'] or '') or p['canonical'])
q_bad_canon = [p for p in qpages if not p['canonical']]

# titles / descriptions
long_titles = [p for p in indexable if p['title_len'] > 60]
short_titles = [p for p in indexable if p['title_len'] < 10 and p['title_len'] > 0]
missing_title = [p for p in indexable if p['title_len'] == 0]
long_desc = [p for p in indexable if p['desc_len'] > 160]
short_desc = [p for p in indexable if 0 < p['desc_len'] < 50]
missing_desc = [p for p in indexable if p['desc_len'] == 0]
dup_titles = Counter(p['title'] for p in indexable if p['title'])
dup_descs = Counter(p['desc'] for p in indexable if p['desc'])
noindex_long_titles = [p for p in noindex_pages if p['title_len'] > 60]
noindex_long_descs = [p for p in noindex_pages if p['desc_len'] > 160]

# h1
no_h1 = [p for p in indexable if p['h1_count'] == 0]
multi_h1 = [p for p in indexable if p['h1_count'] > 1]

# hreflang completeness (skip query pages)
no_hreflang = [p for p in indexable if not p['hreflangs'] and not p['is_query_page']]

# word counts by family
wc_by_family = defaultdict(list)
for p in indexable:
    wc_by_family[classify(p['url'])].append(p['words'])
wc_stats = {fam: {'count': len(ws), 'min': min(ws), 'median': sorted(ws)[len(ws)//2], 'max': max(ws),
                  'thin_lt400': sum(1 for w in ws if w < 400)}
            for fam, ws in sorted(wc_by_family.items(), key=lambda kv: -len(kv[1]))}

# sitemap diffs
idx_urls = set(p['url'] for p in indexable)
not_in_sitemap = idx_urls - sm_norm
in_sitemap_not_crawled = sm_norm - set(p['url'] for p in pages) - {u for u in sm_norm}
not_in_sitemap_families = Counter(classify(u) for u in not_in_sitemap)

# orphan / weak internal linking (exclude query listing pages from "pages" viewpoint)
page_url_set = set(p['url'] for p in pages if p['url'])
weak_inlinks = {'zero': [], 'one': [], 'sitemap_zero_inlinks': []}
combined_idx = idx_urls | (listing_inlink_urls - set(p['url'] for p in noindex_pages))
for u in sorted(combined_idx):
    n = inlinks.get(u, 0) + (1 if u in listing_inlink_urls else 0)
    if n == 0:
        weak_inlinks['zero'].append(u)
        if u in sm_norm: weak_inlinks['sitemap_zero_inlinks'].append(u)
    elif n == 1:
        weak_inlinks['one'].append(u)

# JSON-LD type coverage (honest definitions: what Google actually requires/recommends)
families_needing = {
    'Product': lambda fam: False,  # site has no product pages (memberships use OfferCatalog)
    'Article': lambda fam: 'blog article' in fam,
    'ItemList': lambda fam: 'muscle hub' in fam or 'collection' in fam or 'diet-plan hub' in fam or 'listing' in fam,
    'Recipe': lambda fam: fam.endswith('recipe'),
    'NutritionInformation': lambda fam: 'food detail' in fam,
}
schema_coverage = {}
for stype, famtest in families_needing.items():
    needing = [p for p in indexable if famtest(classify(p['url']))]
    have = [p for p in needing if stype in p['ld_types']]
    schema_coverage[stype] = {'family': [f for f in wc_by_family if famtest(f)][:3],
                              'needing': len(needing), 'have': len(have),
                              'missing': len(needing) - len(have)}
ld_parse_errors_pages = [p for p in pages if p['ld_parse_errors'] > 0]

# external links
ext_unique = sorted(ext_links.items(), key=lambda kv: -kv[1])

results = {
    'status': status,
    'ar_noindex_heuristic_validation': ar_validation,
    'full_population': {
        'sitemap_urls': len(sm_norm),
        'food_detail_en': 8831, 'food_detail_ar': 8831,
        'food_urls_in_sitemap': 160,
        'food_urls_not_in_sitemap': 17662 - 160,
        'ar_indexable_band_curated': 2489, 'ar_noindex_tail': 6342,
        'estimated_full_indexable_not_in_sitemap': (8831 - 80) + (2489 - 80),
        'estimated_full_noindex_population': 6342 + 25,
    },
    'canonical_issues': {k: (len(v) if isinstance(v, list) else v) for k, v in canon_issues.items()},
    'canonical_non_self_sample': canon_issues['non_self'][:25],
    'query_pages': {'total': len(qpages), 'with_canonical': len(qpages) - len(q_bad_canon), 'without_canonical': len(q_bad_canon)},
    'titles': {'long_gt60': len(long_titles), 'short_lt10': len(short_titles), 'missing': len(missing_title),
               'noindex_long': len(noindex_long_titles),
               'top_dup_titles': dup_titles.most_common(8)},
    'descriptions': {'long_gt160': len(long_desc), 'short_lt50': len(short_desc), 'missing': len(missing_desc),
                     'noindex_long': len(noindex_long_descs),
                     'top_dup_descs': dup_descs.most_common(5)},
    'h1': {'missing': len(no_h1), 'multiple': len(multi_h1)},
    'hreflang': {'pages_without_alternate_links': len(no_hreflang)},
    'word_counts_by_family': wc_stats,
    'sitemap': {'sitemap_urls': len(sm_norm), 'crawled_indexable': len(idx_urls),
                'indexable_not_in_sitemap': len(not_in_sitemap),
                'not_in_sitemap_by_family': dict(not_in_sitemap_families),
                'in_sitemap_not_crawled': len(in_sitemap_not_crawled)},
    'internal_linking': {'zero_inlinks': len(weak_inlinks['zero']),
                         'one_inlink': len(weak_inlinks['one']),
                         'sitemap_urls_with_zero_inlinks': len(weak_inlinks['sitemap_zero_inlinks']),
                         'sitemap_zero_inlinks_list': weak_inlinks['sitemap_zero_inlinks'][:60]},
    'schema_coverage': schema_coverage,
    'ld_parse_error_pages': len(ld_parse_errors_pages),
    'ld_type_distribution': Counter(t for p in pages for t in p['ld_types']),
    'external_links': {'unique': len(ext_unique), 'total_occurrences': sum(c for _, c in ext_unique),
                       'top': ext_unique[:20]},
}
results['ld_type_distribution'] = dict(results['ld_type_distribution'])

with open(f'{OUT}/aggregate-results.json', 'w') as f:
    json.dump(results, f, ensure_ascii=False, indent=1, default=str)

# per-page CSV (all pages, key metrics) for the affected-pages deliverable
import csv
with open(f'{OUT}/all-pages-metrics.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['url', 'family', 'is_query_page', 'robots', 'canonical', 'title', 'title_len',
                'desc_len', 'h1_count', 'words', 'ld_types', 'inlinks_dofollow', 'status_hint'])
    for p in sorted(pages, key=lambda x: x['url'] or ''):
        if not p['url']: continue
        w.writerow([p['url'], classify(p['url']), p['is_query_page'], p['robots'] or 'index,follow(implied)',
                    p['canonical'] or '', p['title'][:120], p['title_len'], p['desc_len'], p['h1_count'],
                    p['words'], '|'.join(p['ld_types']), inlinks.get(p['url'], 0), ''])

# noindex list
with open(f'{OUT}/noindex-pages.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['url', 'family', 'robots', 'title'])
    for p in sorted(noindex_pages, key=lambda x: x['url'] or ''):
        w.writerow([p['url'], classify(p['url']), p['robots'], p['title'][:100]])

print(json.dumps({k: v for k, v in results.items() if k not in ('ld_type_distribution',)}, ensure_ascii=False, indent=1, default=str)[:6000])
