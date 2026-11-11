#!/usr/bin/env python3
"""Build the classified affected-pages deliverable (CSV) from analysis outputs."""
import csv, json, re
from urllib.parse import urlparse

OUT = '/home/z/my-project/audit-work/analysis'
rows = list(csv.DictReader(open(f'{OUT}/all-pages-metrics.csv', encoding='utf-8-sig')))

# clean listing/hub pages missing ItemList (from earlier check)
no_itemlist = {'https://alkemos.com/ar/blog', 'https://alkemos.com/ar/diet-plan', 'https://alkemos.com/ar/exercises',
               'https://alkemos.com/ar/foods', 'https://alkemos.com/ar/recipes', 'https://alkemos.com/blog',
               'https://alkemos.com/diet-plan', 'https://alkemos.com/exercises', 'https://alkemos.com/foods',
               'https://alkemos.com/recipes'}
broken_404 = {'https://alkemos.com/blog/how-to-calc-daily-protein-athletes': 'هدف رابط داخلي مكسور من /blog/hiit-home-fat-burning-workout',
              'https://alkemos.com/ar/blog/magnesium-forms-sleep-recovery': 'هدف رابط داخلي مكسور من /ar/blog/choose-vitamin-d-supplement-athletes',
              'https://alkemos.com/ar/auth': 'هدف رابط مكسور من /ar/workout-tracker (المسار الصحيح /auth وليس /ar/auth)',
              'https://alkemos.com/cdn-cgi/l/email-protection': 'أثر فني من Cloudflare (صفحة /contact) — غير قابل للإصلاح من الموقع'}
orphan = 'https://alkemos.com/ar/blog/carb-needs-athletes-by-training-intensity'

out_rows = []
# P0: broken link targets (404s discovered by the crawl)
for u, desc in broken_404.items():
    out_rows.append({'url': u, 'family': 'broken-link target', 'severity': 'P0', 'problems': desc, 'inlinks': ''})
# P0: source pages carrying the broken links
out_rows.append({'url': 'https://alkemos.com/blog/hiit-home-fat-burning-workout', 'family': 'EN blog article', 'severity': 'P0',
                 'problems': 'يحوي رابطًا داخليًا إلى صفحة 404 (/blog/how-to-calc-daily-protein-athletes)', 'inlinks': ''})
out_rows.append({'url': 'https://alkemos.com/ar/blog/choose-vitamin-d-supplement-athletes', 'family': 'AR blog article', 'severity': 'P0',
                 'problems': 'يحوي رابطًا داخليًا إلى صفحة 404 (/ar/blog/magnesium-forms-sleep-recovery)', 'inlinks': ''})
out_rows.append({'url': 'https://alkemos.com/ar/workout-tracker', 'family': 'AR core page', 'severity': 'P0',
                 'problems': 'يحوي رابطًا داخليًا إلى صفحة 404 (/ar/auth)', 'inlinks': ''})
out_rows.append({'url': 'https://alkemos.com/contact', 'family': 'EN core page', 'severity': 'P2',
                 'problems': 'رابط حماية بريد Cloudflare (/cdn-cgi/l/email-protection) يظهر 404 للزواحف — أثر فني خارجي', 'inlinks': ''})
for r in rows:
    url = r['url']
    if not url or r.get('is_query_page') == 'True':
        continue  # query pages: canonicalized, tracked at aggregate level
    fam = r['family']
    noindex = 'noindex' in (r.get('robots') or '')
    issues = []
    if url in broken_404:
        issues.append(('404 هدف رابط داخلي مكسور', 'P0'))
    if url == orphan:
        issues.append(('صفحة معزولة: صفر روابط داخلية (معلنة في sitemap)', 'P1'))
    if url in no_itemlist:
        issues.append(('صفحة تصنيف/فهرس بلا ItemList Schema', 'P2'))
    if not noindex:
        tl = int(r['title_len'] or 0); dl = int(r['desc_len'] or 0); w = int(r['words'] or 0)
        if tl > 60: issues.append((f'عنوان طويل ({tl} حرفًا)', 'P2'))
        if dl > 160: issues.append((f'وصف Meta طويل ({dl} حرفًا)', 'P2'))
        if 0 < dl < 50: issues.append((f'وصف Meta قصير ({dl} حرفًا)', 'P2'))
        if w < 400 and ('food detail' in fam or 'exercise' in fam or fam.endswith('recipe')):
            issues.append((f'محتوى رقيق ({w} كلمة)', 'P1'))
    else:
        issues.append(('noindex مقصود (سياسة ذيل USDA العربي P2-12)', 'موثّق — ليس خللًا'))
    if issues:
        sev_rank = {'P0': 0, 'P1': 1, 'P2': 2, 'م': 3}
        worst = min((sev for _, sev in issues), key=lambda s: sev_rank.get(s, 9))
        out_rows.append({'url': url, 'family': fam, 'severity': worst,
                         'problems': ' | '.join(p for p, _ in issues), 'inlinks': r.get('inlinks_dofollow', '')})

out_rows.sort(key=lambda x: ({'P0': 0, 'P1': 1, 'P2': 2, 'م': 3}.get(x['severity'], 9), x['url']))
with open(f'{OUT}/affected-pages-classified.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['url', 'family', 'severity', 'problems', 'inlinks_dofollow'])
    for r in out_rows:
        w.writerow([r['url'], r['family'], r['severity'], r['problems'], r['inlinks']])

from collections import Counter
print('affected pages rows:', len(out_rows))
print('by severity:', dict(Counter(r['severity'] for r in out_rows)))
print('P0 rows:', [r['url'] for r in out_rows if r['severity'] == 'P0'])
