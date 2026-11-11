#!/usr/bin/env python3
"""Check AI-crawler response times on key paths + external link statuses (sample)."""
import re, json, time, urllib.request, urllib.error, csv
from collections import Counter

UA_AI = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot'
UA_CC = 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'
UA_PER = 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'

def timed_get(url, ua):
    req = urllib.request.Request(url, headers={'User-Agent': ua})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, round((time.time() - t0) * 1000), len(r.read())
    except urllib.error.HTTPError as e:
        return e.code, round((time.time() - t0) * 1000), 0
    except Exception as e:
        return str(e)[:40], round((time.time() - t0) * 1000), 0

print('=== AI CRAWLER RESPONSE TIMES (same path x 3 UAs) ===')
paths = ['/', '/foods/chicken-breast', '/ar/foods/chicken-breast', '/exercises/34-sit-up',
         '/tools/body-fat-calculator', '/blog/hiit-home-fat-burning-workout', '/foods?page=2',
         '/ar/blog/hiit-home-workout-guide', '/diet-plan/2500/balanced']
ai_results = []
for p in paths:
    row = {'path': p}
    for name, ua in [('GPTBot', UA_AI), ('ClaudeBot', UA_CC), ('PerplexityBot', UA_PER)]:
        s, ms, sz = timed_get('https://alkemos.com' + p, ua)
        row[name] = f'{s}/{ms}ms'
        time.sleep(0.4)
    ai_results.append(row)
    print(' ', p, '|', row)
json.dump(ai_results, open('/home/z/my-project/audit-work/analysis/ai-crawler-times.json', 'w'), indent=1)

print()
print('=== EXTERNAL LINK STATUS CHECK (top-occurrence + random sample) ===')
rows = list(csv.DictReader(open('/home/z/my-project/audit-work/analysis/all-pages-metrics.csv', encoding='utf-8-sig')))
# rebuild external URL list from corpus quickly (top + pubmed sample)
import os, glob
ext = Counter()
RE_A = re.compile(r'<a\s[^>]*href="(https?://[^"]+)"[^>]*>', re.I)
OFFLINE = '/home/z/my-project/audit-work/crawl-offline'
files = []
for root, dirs, fs in os.walk(OFFLINE):
    if '/_next' in root: continue
    for f in fs:
        if f.endswith('.html'): files.append(os.path.join(root, f))
import random
random.seed(42)
random.shuffle(files)
for fp in files[:2500]:
    html = open(fp, encoding='utf-8', errors='ignore').read()
    for m in RE_A.finditer(html):
        u = m.group(1)
        if 'alkemos.com' not in u:
            ext[u] += 1
top = [u for u, _ in ext.most_common(60)]
pubmed = [u for u in ext if 'pubmed' in u]
random.shuffle(pubmed)
sample = top + pubmed[:60]
seen_status = Counter()
detail = []
for u in sample:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; AlkemosAudit/1.0)', 'Accept': '*/*'})
    try:
        req.get_method = lambda: 'HEAD'
        with urllib.request.urlopen(req, timeout=15) as r:
            st = r.status
    except urllib.error.HTTPError as e:
        st = e.code
    except Exception as e:
        st = 'ERR:' + str(e)[:30]
    if st == 405 or st == 403:  # some sites reject HEAD; retry GET
        try:
            req2 = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36'})
            with urllib.request.urlopen(req2, timeout=15) as r:
                st = r.status
        except urllib.error.HTTPError as e:
            st = e.code
        except Exception as e:
            st = 'ERR:' + str(e)[:30]
    key = '2xx' if isinstance(st, int) and 200 <= st < 300 else ('3xx' if isinstance(st, int) and 300 <= st < 400 else ('4xx' if isinstance(st, int) and 400 <= st < 500 else str(st)))
    seen_status[key] += 1
    detail.append({'url': u, 'status': st, 'occurrences': ext.get(u, 0)})
    time.sleep(0.35)
print('sample checked:', len(detail), '| status distribution:', dict(seen_status))
json.dump(detail, open('/home/z/my-project/audit-work/analysis/external-link-status.json', 'w'), indent=1)
for dd in detail:
    if not (isinstance(dd['status'], int) and 200 <= dd['status'] < 300):
        print('  non-200:', dd['status'], dd['url'][:100])
