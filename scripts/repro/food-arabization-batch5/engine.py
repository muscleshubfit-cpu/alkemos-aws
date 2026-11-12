#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compositional translator for the final arabization batch (batch 5).
Family handlers mirror the established batches 1-4 naming conventions.
Fail-closed validation mirrors foods-ar-purity.test.ts exactly:
non-empty · Arabic present · ZERO Latin · differs from nameEn · 2-80 chars · no CJK · unique.
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lexicon import STATE, STATE_ALT, PACK, ORIGIN, GRADE, TRIM, SPECIES, CUTS, LAMB_PARTS, POULTRY, SEAFOOD
from lexicon_foods import VEG, FRUIT, GRAIN, LEGUME, DAIRY, FAT, SOUP, SWEET, DRINK, BABY, GENERIC
from lexicon_words import WORDS
from lexicon_r3 import WORDS3
from lexicon_r4 import WORDS4
from lexicon_r5 import WORDS5
from lexicon_r6 import WORDS6
from lexicon_r7 import WORDS7
from lexicon_r8 import WORDS8
from lexicon_r9 import WORDS9
from lexicon_r10 import WORDS10
from brands import BRANDS

BASE = os.path.dirname(os.path.abspath(__file__))
ARABIC = re.compile(r"[\u0600-\u06FF]")
LATIN = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]")

# merged lookup for token translation (longest key first)
ALL_PHRASES = {}
# brands first — food-word lexicons override on conflicts (e.g. "drumstick" is a
# poultry part, not the Nestle ice-cream line, in every food-name context)
ALL_PHRASES.update({k.lower(): v for k, v in BRANDS.items()})
for d in (STATE, PACK, ORIGIN, GRADE, TRIM, SPECIES, CUTS, LAMB_PARTS, POULTRY,
          SEAFOOD, VEG, FRUIT, GRAIN, LEGUME, DAIRY, FAT, SOUP, SWEET, DRINK, BABY, GENERIC, WORDS, WORDS3, WORDS4, WORDS5, WORDS6, WORDS7, WORDS8, WORDS9, WORDS10):
    ALL_PHRASES.update({k.lower(): v for k, v in d.items()})
PHRASE_KEYS = sorted(ALL_PHRASES.keys(), key=len, reverse=True)

def unescape(s):
    return s.replace('\\"', '"').replace("\\\\", "\\")

def split_tokens(nameEn):
    return [unescape(t.strip()) for t in nameEn.split(",")]

def phrase_translate(token: str):
    """Translate a comma-token via longest-match phrase substitution. Returns (arabic, unknown_words)."""
    t = unescape(token.strip())
    tl = t.lower()
    if tl in ALL_PHRASES:
        return ALL_PHRASES[tl], []
    # "X flavor" pattern -> بنكهة {X}
    m_fl = re.match(r"(.+?)[ -]flavou?red?$", tl)
    if m_fl and len(m_fl.group(1)) > 2:
        inner_ar, inner_unk = phrase_translate(m_fl.group(1))
        if not inner_unk and inner_ar:
            return f"بنكهة {inner_ar}", []
    # longest-first phrase replacement inside the token
    rest = t
    out = []
    unknown = []
    while rest:
        matched = False
        for k in PHRASE_KEYS:
            if len(k) < 3:
                continue
            if rest.lower().startswith(k):
                tail = rest[len(k):]
                # word-boundary guard: phrase must end at a non-alphanumeric
                if tail and re.match(r"[A-Za-z0-9]", tail[0]):
                    continue
                out.append(ALL_PHRASES[k])
                rest = tail
                rest = rest.lstrip(" ,.-–—/'&()").strip()
                matched = True
                break
        if not matched:
            m = re.match(r"[A-Za-z&''.0-9%/()-]+", rest)
            if not m:
                out.append(rest[0]); rest = rest[1:]; continue
            w = m.group(0)
            wl = w.lower().strip("'’")
            if wl.endswith("'s") or wl.endswith("’s"):
                wl = wl[:-2]
            if wl in ALL_PHRASES:
                out.append(ALL_PHRASES[wl])
            elif wl in ("and", "&"):
                out.append("و")
            elif wl == "with":
                out.append("بـ")
            elif wl == "or":
                out.append("أو")
            elif wl == "of":
                out.append("")
            elif re.fullmatch(r"[0-9./%]+", wl):
                out.append(wl)
            else:
                unknown.append(w)
            rest = rest[m.end():]
            rest = rest.lstrip(" ,.-–—/'&()").strip()
    return " ".join(x for x in out if x), unknown

def tok(tokens, *names, default=None):
    """Fetch first matching token value from list of tokens (case-normalized)."""
    for n in names:
        nl = n.lower()
        for t in tokens:
            if t.lower() == nl:
                return t
    return default

def has_tok(tokens, *names):
    return tok(tokens, *names) is not None

def find_sub(tokens, phrase):
    pl = phrase.lower()
    for t in tokens:
        if pl in t.lower():
            return t
    return None

def validate(name, nameEn):
    problems = []
    if not name or not name.strip():
        problems.append("empty")
    if not ARABIC.search(name or ""):
        problems.append("no-arabic")
    if LATIN.search(name or ""):
        problems.append("latin")
    if name == nameEn:
        problems.append("same-as-en")
    if not (2 <= len(name or "") <= 80):
        problems.append("length")
    if CJK.search(name or ""):
        problems.append("cjk")
    return problems

class Engine:
    def __init__(self, existing_names):
        self.used = set(existing_names)  # includes the 2,538 existing translations
        self.results = {}   # slug -> nameAr
        self.manual = []    # rows needing hand translation
        self.notes = []

    def emit(self, slug, name, nameEn, differentiators=None, alt_state=None):
        """Try name; on collision try differentiator suffixes; on exhaustion -> manual queue."""
        candidates = [name]
        if differentiators:
            for d in differentiators:
                if d:
                    candidates.append(f"{name} ({d})")
            # combos of two differentiators
            ds = [d for d in differentiators if d]
            for i in range(len(ds)):
                for j in range(i + 1, len(ds)):
                    candidates.append(f"{name} ({ds[i]}، {ds[j]})")
        if alt_state:
            base = name.rsplit("، ", 1)[0]
            candidates.append(f"{base}، {alt_state}")
        import re as _re
        candidates = [_re.sub(r"(?<![\u0600-\u06FF])و ([\u0600-\u06FF])", r"و\1", c) for c in candidates]
        candidates = [_re.sub("\u0628\u0640 ([\u0600-\u06FF]\u0644)", lambda m: "\u0628" + m.group(1), c) for c in candidates]  # بـ ال -> بال
        candidates = [_re.sub("\u0628\u0640 ([\u0600-\u06FF])", lambda m: "\u0628\u0640" + m.group(1), c) for c in candidates]  # بـ X -> بـX
        for c in candidates:
            if c in self.used:
                continue
            if validate(c, nameEn):
                continue
            self.used.add(c)
            self.results[slug] = c
            return True
        self.manual.append(slug)
        return False

    # ---------------- family handlers ----------------
    def meat_cut(self, row):
        nameEn = row["nameEn"]
        toks = split_tokens(nameEn)
        head = toks[0]
        species = SPECIES.get(head.lower(), "")
        game_animal = None
        if head.lower() == "game meat":
            for t in toks[1:3]:
                an, unk = phrase_translate(t)
                if not unk and an:
                    game_animal = an
                    toks.remove(t)
                    break
            species = f"لحم {game_animal} (صيد)" if game_animal else "لحم صيد"
        elif not species:
            for t in toks[:2]:
                if t.lower() in SPECIES:
                    species = SPECIES[t.lower()]
                    toks.remove(t)
                    break
        rest = toks[1:]
        origin_words, grade_words, trim_words, state_words, bone_words, lean_words, other = [], [], [], [], [], [], []
        for t in rest:
            tl = t.lower()
            if tl in ORIGIN:
                origin_words.append(ORIGIN[tl])
            elif tl in GRADE:
                grade_words.append(GRADE[tl])
            elif tl in TRIM:
                trim_words.append(TRIM[tl])
            elif tl in STATE:
                state_words.append(STATE[tl])
            elif tl in ("boneless", "bone-in", "bone in", "with rib", "bone-in (with skin)"):
                bone_words.append(CUTS.get(tl, ALL_PHRASES.get(tl, "")))
            elif tl in ("lip-on", "lip on", "lip off", "frenched", "denuded", "netted", "rolled", "tied", "single"):
                bone_words.append(ALL_PHRASES.get(tl, TRIM.get(tl, "")) or tl)
            elif tl in ("separable lean only", "separable lean and fat", "lean only", "meat only",
                        "meat and fat", "separable fat", "mechanically deboned", "with added solution",
                        "separable lean only, trimmed", "meat and skin", "meat and skin with breading",
                        "mechanically separated meat", "skin and breading removed", "skinless"):
                lean_words.append(CUTS.get(tl, ALL_PHRASES.get(tl, "")))
            else:
                other.append(t)
        cut_ar, unknown, tribal = [], [], None
        for t in other:
            tl = t.lower()
            if "alaska native" in tl or "indians" in tl or "shoshone" in tl or "klamath" in tl or "hopi" in tl or "navajo" in tl or "apache" in tl or "pueblo" in tl or "eskimo" in tl:
                ar, unk = phrase_translate(t)
                tribal = ar
                unknown += unk
                continue
            ar, unk = phrase_translate(t)
            if unk:
                unknown += unk
            elif ar:
                cut_ar.append(ar)
        if unknown:
            self.manual.append(row["slug"]); return
        if not cut_ar:
            cut_ar = ["قطع"]
        # Arabic idafa chain: reverse the English order, cap at 2 levels for readability
        PRIMALS = {"ضلوع", "كتف", "فخذ خلفي", "قطنية", "القطنية القصيرة", "صدر سفلي",
                   "سيرلوين", "بريسكت (صدر)", "فلانك (خاصرة)", "الصدر السفلي", "الفخذ الخلفي"}
        chain = list(reversed(cut_ar))
        if len(chain) > 1:
            chain = [chain[0]] + [c for c in chain[1:] if c not in PRIMALS] or [chain[0]]
        if len(chain) > 2:
            chain = chain[:2]
        if cut_ar == ["قطع"]:
            chain = []
        head_noun = (" ".join(chain) + " " + species).strip()
        head_noun = re.sub(r"\s+", " ", head_noun).strip()
        if tribal:
            head_noun += f" ({tribal})"
        # qualifiers: lean, bone, states (merge cooked+method)
        quals = []
        if lean_words:
            quals.append(lean_words[0])
        if bone_words and bone_words[0]:
            quals.append(bone_words[0])
        if state_words:
            sw = "، ".join(state_words[:3])
            quals.append(sw)
        name = head_noun
        if quals:
            name += " — " + "، ".join(quals)
        if origin_words:
            name += f" ({' '.join(origin_words)})"
        diffs = []
        if grade_words:
            diffs.append(" ".join(grade_words))
        if trim_words:
            diffs.append(" ".join(trim_words))
        alt = None
        if state_words:
            for sw in reversed(state_words):
                key = next((k for k, v in STATE.items() if v == sw), None)
                if key and key in STATE_ALT:
                    alt = STATE_ALT[key]
                    break
        if alt:
            diffs.append(alt)
        self.emit(row["slug"], name, nameEn, differentiators=diffs, alt_state=alt)

    def poultry_handler(self, row):
        nameEn = row["nameEn"]
        toks = split_tokens(nameEn)
        head = toks[0]
        species = POULTRY.get(head.lower(), SPECIES.get(head.lower(), ""))
        if not species:
            self.manual.append(row["slug"]); return
        rest = toks[1:]
        part_ar, quals, extras, unknown = [], [], [], []
        meat_tone = None
        coating = None
        for t in rest:
            tl = t.lower()
            if tl in ("broilers or fryers", "all classes", "young", "mature", "fryer-roasters",
                      "white pekin", "young duckling", "duckling", "roasting", "stewing",
                      "broiler or fryers", "class i, class ii"):
                if tl == "stewing":
                    extras.append("دجاج للطبخ البطيء")
                elif tl == "roasting":
                    extras.append("دجاج للشوي")
                continue
            if tl in ("dark meat", "light meat"):
                meat_tone = POULTRY[tl]; continue
            if tl in ("flour", "batter"):
                coating = "مقلي بالدقيق" if tl == "flour" else "مقلي بالخليط"; continue
            if tl in ("meat and skin", "meat only", "with added solution", "meat and skin with breading"):
                quals.append(POULTRY.get(tl) or CUTS.get(tl, tl)); continue
            if tl in ("retail parts", "from whole bird", "from retail parts"):
                extras.append(POULTRY[tl]); continue
            if tl in ("rotisserie", "bbq", "rotisserie, bbq"):
                extras.append(POULTRY.get(tl, ALL_PHRASES.get(tl, ""))); continue
            if tl in POULTRY:
                part_ar.append(POULTRY[tl]); continue
            if tl in STATE:
                quals.append(STATE[tl]); continue
            if tl in PACK:
                extras.append(PACK[tl]); continue
            ar, unk = phrase_translate(t)
            if unk:
                unknown += unk
            elif ar:
                part_ar.append(ar)
        if unknown:
            self.manual.append(row["slug"]); return
        part_str = " ".join(x for x in part_ar if x).strip() or "قطع"
        if meat_tone:
            part_str += f" ({meat_tone})"
        name = f"{part_str} {species}".strip()
        # retail-parts / whole-bird parenthetical style (existing convention)
        if "قطع تجزئة" in extras:
            name += " (قطع تجزئة)"
            extras = [e for e in extras if e != "قطع تجزئة"]
        q = [x for x in quals if x]
        if coating:
            q = [c for c in q if c not in ("مقلي", "مطهو")] + [coating]
        if q:
            name += " — " + "، ".join(q)
        if extras:
            name += f" ({'، '.join(dict.fromkeys(extras))})"
        self.emit(row["slug"], name, nameEn, differentiators=extras)

    def produce_handler(self, row):
        nameEn = row["nameEn"]
        toks = split_tokens(nameEn)
        head = toks[0]
        head_ar = ALL_PHRASES.get(head.lower())
        if not head_ar:
            ar, unk = phrase_translate(head)
            if unk:
                self.manual.append(row["slug"]); return
            head_ar = ar
        quals, extras, unknown, colors = [], [], [], []
        COLORS = {"red": "أحمر", "green": "أخضر", "yellow": "أصفر", "white": "أبيض",
                  "purple": "بنفسجي", "black": "أسود", "orange": "برتقالي", "pink": "وردي",
                  "dark green": "أخضر داكن", "red, ripe": "ناضج أحمر"}
        for t in toks[1:]:
            tl = t.lower()
            if tl in COLORS:
                colors.append(COLORS[tl]); continue
            if tl in STATE:
                quals.append(STATE[tl]); continue
            if tl in PACK:
                extras.append(PACK[tl]); continue
            ar, unk = phrase_translate(t)
            if unk:
                unknown += unk
            elif ar:
                quals.append(ar)
        if unknown:
            self.manual.append(row["slug"]); return
        # colors attach to the head noun (Arabic adjective order)
        for c in dict.fromkeys(colors):
            if c.split(" ")[0] not in head_ar:
                head_ar += " " + c
        # drop quals whose words already appear in the head
        qs = [q for q in quals if q and not any(w in head_ar for w in q.split(" ") if len(w) > 3)]
        if qs:
            name = head_ar + " — " + "، ".join(qs)
        else:
            name = head_ar
        if extras:
            name += f" ({'، '.join(dict.fromkeys(extras))})"
        self.emit(row["slug"], name, nameEn, differentiators=extras)

    def branded_handler(self, row):
        """Brand-first rows: [product noun chain reversed] + brand + (qualifiers)."""
        nameEn = row["nameEn"]
        toks = split_tokens(nameEn)
        brand_ar = BRANDS.get(toks[0]) or BRANDS.get(toks[0].upper())
        rest = toks[1:]
        if not brand_ar:
            for i, t in enumerate(toks[:3]):
                if t in BRANDS or t.upper() in BRANDS:
                    brand_ar = BRANDS.get(t) or BRANDS.get(t.upper())
                    rest = toks[:i] + toks[i+1:]
                    break
        if not brand_ar:
            self.manual.append(row["slug"]); return
        PRODUCT_NOUNS = {
            "كوكيز", "كراكرز", "بوريتو", "شوربة", "ساندويتش", "ساندويتشات", "برجر", "بيتزا",
            "حبوب", "كيك", "وافل", "فطيرة", "فطائر", "بودينج", "آيس كريم", "مشروب", "مشروبات",
            "عصير", "عصائر", "تورتيلا", "رقائق", "سالسا", "صوص", "مرقة", "زبدة", "جبنة",
            "زبادي", "حليب", "دجاج", "سمك", "توفو", "جراهامز", "مافن", "دونات", "كرواسون",
            "بان كيك", "معجنات", "ألواح", "رول", "مكرونة", "سباجيتي", "باستا", "نودلز",
            "لازانيا", "رافيولي", "تشيلي", "سلطة", "تاكو", "بسكويت", "حلوى", "شوكولاتة",
            "رحيق", "شاي", "قهوة", "مربى", "كريمة", "مهروس", "أقراص", "دبابيس", "أجنحة",
            "ناجتس", "تندرز", "شرائح", "كوكتيل", "جيلي", "مارشميلو", "كراميل", "توست",
            "خبز", "رغيف", "شوربات", "مقلية", "أصابع", "كيساديلا", "مكعبات", "بولز",
            "بارفيه", "ساندي", "مثلجات", "كاسترد", "كوكي", "شطيرة", "عجينة",
        }
        products, quals, unknown = [], [], []
        for t in rest:
            tl = t.lower()
            if tl in PACK:
                quals.append(PACK[tl]); continue
            if tl in STATE:
                quals.append(STATE[tl]); continue
            ar, unk = phrase_translate(t)
            if unk:
                unknown += unk
            elif ar:
                words = ar.split()
                if any(w in PRODUCT_NOUNS for w in words) and len(words) <= 5:
                    # move the product noun to the front (Arabic noun-first order)
                    idx = next(i for i, w in enumerate(words) if w in PRODUCT_NOUNS)
                    if idx > 0:
                        ar = words[idx] + " " + " ".join(words[:idx] + words[idx+1:])
                    products.append(ar)
                else:
                    quals.append(ar)
        if unknown:
            self.manual.append(row["slug"]); return
        if products:
            dish = " ".join(reversed(products))
        else:
            dish = " ".join(quals).strip() or "منتج"
            quals = []
        name = f"{dish} {brand_ar}".strip()
        if quals:
            uniq = list(dict.fromkeys(q for q in quals if q))
            name += f" ({'، '.join(uniq)})"
        self.emit(row["slug"], name, nameEn, differentiators=quals)

    def generic_handler(self, row):
        """Token-by-token translation for rows whose every token is known."""
        nameEn = row["nameEn"]
        toks = split_tokens(nameEn)
        head_ar, unk0 = phrase_translate(toks[0])
        if unk0 or not head_ar:
            self.manual.append(row["slug"]); return
        quals, extras, unknown = [], [], []
        for t in toks[1:]:
            ar, unk = phrase_translate(t)
            if unk:
                unknown += unk
            elif ar:
                (extras if t.lower() in PACK else quals).append(ar)
        if unknown:
            self.manual.append(row["slug"]); return
        name = head_ar
        qs = [x for x in quals if x]
        if qs:
            name += " — " + "، ".join(qs)
        if extras:
            name += f" ({'، '.join(dict.fromkeys(extras))})"
        self.emit(row["slug"], name, nameEn, differentiators=extras)

# routing tables
PRODUCE_HEADS = set(VEG) | set(FRUIT) | {"Turnip greens", "Cowpeas", "Soybeans", "Lima beans", "Corn", "Sweet potato"}
MEAT_HEADS = {"Beef", "Lamb", "Veal", "Game meat", "Bison", "Ostrich", "Emu", "Caribou", "Elk", "Moose"}
POULTRY_HEADS = {"Chicken", "Turkey", "Duck", "Goose", "Quail", "Pheasant"}
SEAFOOD_HEADS = {"Fish", "Mollusks", "Crustaceans", "Turtle", "Frog legs", "Squid", "Octopus"}

def route(row):
    head = row["nameEn"].split(",")[0].strip()
    hl = head.lower()
    if head in MEAT_HEADS:
        return "meat"
    if head in POULTRY_HEADS or head == "Fried Chicken":
        return "poultry"
    if head in SEAFOOD_HEADS:
        return "seafood"
    if hl in SEAFOOD:
        return "seafood"
    if head in PRODUCE_HEADS or hl in VEG or hl in FRUIT:
        return "produce"
    if head in BRANDS or head.upper() in BRANDS:
        return "branded"
    return "generic"

def main():
    target = json.load(open(f"{BASE}/target_translatable.json", encoding="utf-8"))
    existing = json.load(open(f"{BASE}/translated_names.json", encoding="utf-8"))
    eng = Engine([v for v in existing.values()])
    from handlers_extra import seafood_handler, baby_handler, formula_handler, soup_handler, beverage_handler, fastfood_handler
    eng.seafood_handler = seafood_handler.__get__(eng)
    eng.baby_handler = baby_handler.__get__(eng)
    eng.formula_handler = formula_handler.__get__(eng)
    eng.soup_handler = soup_handler.__get__(eng)
    eng.beverage_handler = beverage_handler.__get__(eng)
    eng.fastfood_handler = fastfood_handler.__get__(eng)
    counts = {}
    for row in target:
        fam = route(row)
        counts[fam] = counts.get(fam, 0) + 1
        if fam == "meat":
            eng.meat_cut(row)
        elif fam == "poultry":
            eng.poultry_handler(row)
        elif fam == "seafood":
            eng.seafood_handler(row)
        elif fam == "produce":
            eng.produce_handler(row)
        elif fam == "branded":
            eng.branded_handler(row)
        elif fam == "generic":
            # route some generics to specialized handlers
            head = row["nameEn"].split(",")[0].strip()
            if head == "Babyfood":
                eng.baby_handler(row)
            elif head in ("Infant formula", "Infant Formula"):
                eng.formula_handler(row)
            elif head == "Soup":
                eng.soup_handler(row)
            elif head in ("Beverages", "Beverage"):
                eng.beverage_handler(row)
            elif head in ("Fast foods", "Fast Foods", "Fast Food", "Fast food", "Restaurant", "School Lunch", "USDA Commodity"):
                eng.fastfood_handler(row)
            else:
                eng.generic_handler(row)
        else:
            eng.manual.append(row["slug"])
    print("family route counts:", counts)
    print(f"generated: {len(eng.results)} | manual queue: {len(eng.manual)}")
    json.dump(eng.results, open(f"{BASE}/generated_names.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(eng.manual, open(f"{BASE}/manual_queue.json", "w"), indent=1)
    # validation summary of all generated
    bad = 0
    for slug, name in eng.results.items():
        en = next(r["nameEn"] for r in target if r["slug"] == slug)
        if validate(name, en):
            bad += 1
    print("invalid generated names:", bad)

if __name__ == "__main__":
    main()
