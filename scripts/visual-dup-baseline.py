#!/usr/bin/env python3
"""
visual-dup-baseline.py — BLOG-DIVERSITY-ENGINE §7 baseline measurement.

Downloads every stock image of the N most-recent published blog articles
(both languages), computes a 64-bit dHash per image (mirroring
src/lib/blog-image-discovery.ts: 9×8 box-sampled grayscale, horizontal
bit comparisons), and reports CROSS-ARTICLE near-duplicate pairs
(Hamming < 10) and similar pairs (10..18) — the exact thresholds the
new P3 discovery gate uses. This is the "before" number; the articles
produced by the new engine (from 2026-11-16) are measured against it.
"""
import re
import sys
import hashlib
import urllib.request

SITEMAP = "https://alkemos.com/sitemap-blog.xml"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
N_RECENT = 14
THUMB_W = 96  # same scale the production hasher downloads


def dhash(pixels, w, h):
    # 9×8 box-sample like the TS module (bilinear-free box average)
    GW, GH = 9, 8
    gray = [0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
            for i in range(0, len(pixels), 4)]
    rows = []
    for gy in range(GH):
        y0, y1 = (gy * h) // GH, max(((gy + 1) * h) // GH, (gy * h) // GH + 1)
        row = []
        for gx in range(GW):
            x0, x1 = (gx * w) // GW, max(((gx + 1) * w) // GW, (gx * w) // GW + 1)
            s = n = 0
            for y in range(y0, min(y1, h)):
                for x in range(x0, min(x1, w)):
                    s += gray[y * w + x]
                    n += 1
            row.append(s / n if n else 0)
        rows.append(row)
    bits = ""
    for y in range(8):
        for x in range(8):
            bits += "0" if rows[y][x] < rows[y][x + 1] else "1"
    return bits


def hamming(a, b):
    return sum(1 for x, y in zip(a, b) if x != y)


def load_sitemap():
    req = urllib.request.Request(SITEMAP, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read().decode("utf-8", "replace")
    entries = re.findall(r"<url>(.*?)</url>", data, re.S)
    rows = []
    for e in entries:
        loc = re.search(r"<loc>([^<]+)</loc>", e)
        mod = re.search(r"<lastmod>([^<]+)</lastmod>", e)
        if loc:
            rows.append((mod.group(1) if mod else "", loc.group(1)))
    rows.sort(reverse=True)
    return rows[:N_RECENT]


def article_images(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            h = r.read().decode("utf-8", "replace")
    except Exception as e:
        print(f"  ! fetch failed {url}: {e}")
        return []
    urls = re.findall(r'<img[^>]+src="(https://images\.pexels\.com/[^"]+)"', h)
    # dedupe by photo id
    seen, out = set(), []
    for u in urls:
        pid = u.split("/photos/")[1].split("/")[0] if "/photos/" in u else u
        if pid not in seen:
            seen.add(pid)
            out.append(u)
    return out


def thumb(url):
    m = re.match(r"(https://images\.pexels\.com/photos/[^?]+)", url)
    if not m:
        return None
    return m.group(1) + f"?auto=compress&cs=tinysrgb&w={THUMB_W}"


def jpeg_gray(url):
    t = thumb(url)
    if not t:
        return None
    try:
        req = urllib.request.Request(t, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            buf = r.read()
    except Exception:
        return None
    # minimal baseline JPEG decode via PIL if available, else ctypes-free fallback
    try:
        from PIL import Image
        import io
        im = Image.open(io.BytesIO(buf)).convert("RGBA")
        w, h = im.size
        px = list(im.tobytes())
        return dhash(px, w, h)
    except ImportError:
        print("  ! PIL unavailable — install pillow for the visual baseline")
        sys.exit(2)


def main():
    arts = load_sitemap()
    print(f"measuring the {len(arts)} most recent articles (old engine baseline)")
    # article -> {url: hash}
    art_hashes = {}
    for mod, url in arts:
        imgs = article_images(url)
        hashes = {}
        for u in imgs[:6]:
            hsh = jpeg_gray(u)
            if hsh:
                hashes[u] = hsh
        art_hashes[url] = hashes
        print(f"  {mod}  {url.replace('https://alkemos.com', '')}  imgs={len(hashes)}")

    items = []  # (article, url, hash)
    for a, hs in art_hashes.items():
        for u, hh in hs.items():
            items.append((a, u, hh))

    near, similar = [], []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a1, u1, h1 = items[i]
            a2, u2, h2 = items[j]
            if a1 == a2:
                continue  # cross-article only
            d = hamming(h1, h2)
            if d < 10:
                near.append((d, a1, a2, u1, u2))
            elif d < 18:
                similar.append((d, a1, a2))

    print(f"\ncross-article image pairs measured: {len(items)} images across {len(arts)} articles")
    print(f"NEAR-DUPLICATES (Hamming <10 — the same scene; the new gate REJECTS): {len(near)}")
    for d, a1, a2, u1, u2 in near[:10]:
        print(f"  d={d}  {a1.replace('https://alkemos.com', '')}  <->  {a2.replace('https://alkemos.com', '')}")
        print(f"       {u1.split('?')[0]}  <->  {u2.split('?')[0]}")
    print(f"SIMILAR (10..18 — visually close; the new gate penalizes): {len(similar)}")


if __name__ == "__main__":
    main()
