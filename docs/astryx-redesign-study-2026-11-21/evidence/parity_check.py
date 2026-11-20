# -*- coding: utf-8 -*-
"""PARITY CHECK — prototype.html vs the live alkemos.com homepage (AR + EN).
Compares: visible text lines, image URLs, link hrefs.
Known intentional omissions are whitelisted with reasons."""
import json, re, sys, urllib.parse

def load(path):
    d = json.load(open(path, encoding="utf-8"))
    return json.loads(d["data"]["result"])

def norm(s):
    return re.sub(r"\s+", " ", s).strip()

def lines(text):
    out = []
    for ln in text.splitlines():
        ln = norm(ln)
        if len(ln) < 3:
            continue
        if re.fullmatch(r"[\d\s.,:+%$/-]+", ln):  # pure numerals/counts
            continue
        out.append(ln)
    return out

# ---- lines that the prototype intentionally does not carry (functional overlays / chrome) ----
OMIT_AR = [
    "نستخدم ملفات تعريف الارتباط لتشغيل الموقع", "تفاصيل الفئات (٤)", "رفض", "قبول",
    "الضرورية — دائمًا مفعلة", "التفضيلات — لغتك ومظهرك المفضل",
    "التحليلات — قياس الاستخدام والأداء", "الإعلانات — إعلانات مخصصة",
    "يُحفظ اختيارك 365 يومًا",
]
OMIT_EN = [
    "We use cookies to run the site", "Category details (4)", "Reject", "Accept",
    "Necessary — always on", "Preferences — your language", "Analytics — usage & performance",
    "Advertising — personalized ads", "Your choice is stored for 365 days",
]

def check(lang, live_path, proto_path, omit):
    live, proto = load(live_path), load(proto_path)
    lt, pt = live["t"], proto["t"]
    lset, pset = lines(lt), lines(pt)
    ptext = "\n".join(pset)
    ptext_norm = norm(ptext)

    missing = []
    for ln in lset:
        if any(o in ln for o in omit):
            continue
        # countup duplicate digits (live renders "868+868+868+تمرينًا" style runs) — check per-token
        toks = [norm(t) for t in re.split(r"(?<=[+])", ln) if norm(t)]
        ok = norm(ln) in ptext_norm
        if not ok:
            # try token-level (live countup concatenates digits)
            ok = all(tok in ptext_norm for tok in toks if len(tok) > 2)
        if not ok:
            missing.append(ln)

    # images
    def imgkey(u):
        p = urllib.parse.urlparse(u)
        path = p.path
        # collapse responsive variants to the base artwork (0-400.webp == 0.webp family)
        path = re.sub(r"-(?:256|512|640|828|200|400)\.webp$", ".webp", path)
        return path + (("?" + p.query) if p.query and "auto=compress" not in p.query and "h=" not in p.query else "")
    live_imgs = {imgkey(u) for u in live["imgs"] if "/images/" in u or "pexels.com" in u or u.startswith("data:")}
    proto_imgs = {imgkey(u) for u in proto["imgs"] if "/images/" in u or "pexels.com" in u}
    proto_all = "\n".join(proto["hrefs"]) + norm(pt)  # for srcset-only refs
    missing_imgs = sorted(i for i in live_imgs if i not in proto_imgs)

    # links (only meaningful in-page destinations)
    def hrefkey(h):
        if h.startswith("http"):
            p = urllib.parse.urlparse(h)
            return p.path or "/"
        return h.split("?")[0] or "/"
    live_hrefs = {hrefkey(h) for h in live["hrefs"] if h and not h.startswith("#") and "javascript" not in h}
    proto_hrefs = {hrefkey(h) for h in proto["hrefs"] if h and not h.startswith("#")}
    missing_hrefs = sorted(h for h in live_hrefs if h not in proto_hrefs)

    print(f"===== {lang.upper()} =====")
    print(f"live lines: {len(lset)} | proto lines: {len(pset)}")
    print(f"MISSING TEXT LINES ({len(missing)}):")
    for m in missing[:40]:
        print("  ✗", m[:130])
    print(f"MISSING IMAGES ({len(missing_imgs)}):")
    for m in missing_imgs[:20]:
        print("  ✗", m[:130])
    print(f"MISSING HREFS ({len(missing_hrefs)}):")
    for m in missing_hrefs[:25]:
        print("  ✗", m[:110])
    print()
    return missing, missing_imgs, missing_hrefs

if __name__ == "__main__":
    check("ar", "/tmp/live-ar-extracted.json", "/tmp/proto-ar-full.json", OMIT_AR)
