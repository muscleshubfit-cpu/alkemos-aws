import re
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Specialized family handlers: seafood, babyfood, formula, soup, beverage, fastfood."""
from engine import phrase_translate, split_tokens, STATE, PACK, SEAFOOD, POULTRY, ALL_PHRASES
from lexicon import ORIGIN
from brands import BRANDS

def seafood_handler(self, row):
    nameEn = row["nameEn"]
    toks = split_tokens(nameEn)
    tribal = None
    clean = []
    for t in toks:
        tl = t.lower()
        if "alaska native" in tl:
            tribal = "قبائل ألاسكا"
            rest = re.sub(r"\(?\s*alaska native\s*\)?", "", t, flags=re.I).strip(" ,()")
            if rest:
                clean.append(rest)
            continue
        clean.append(t)
    toks = clean
    if toks and toks[0].lower().startswith("turtle"):
        # Turtle rows are not fish
        ar_all, unk_all = " ".join(phrase_translate(t)[0] for t in toks), []
        for t in toks:
            unk_all += phrase_translate(t)[1]
        if not unk_all and ar_all.strip():
            self.emit(row["slug"], f"سلحفاة {ar_all.replace('سلحفاة', '').strip()}".strip(), nameEn)
        else:
            self.manual.append(row["slug"])
        return
    species_ar, quals, extras, unknown = [], [], [], []
    is_eggs = False
    prev_species = None
    for t in toks:
        tl = t.lower()
        if tl in ("fish", "mollusks", "crustaceans", "mixed species", "turtle", "frog legs"):
            continue
        if tl == "eggs" and prev_species:
            is_eggs = True
            continue
        if tl.endswith("eggs") and tl != "eggs":
            spname = tl.replace("eggs", "").strip()
            if spname in SEAFOOD:
                species_ar = [SEAFOOD[spname]]
                is_eggs = True
                prev_species = spname
                continue
        if tl in STATE:
            quals.append(STATE[tl]); continue
        if tl in PACK:
            extras.append(PACK[tl]); continue
        if tl in ("dry heat", "moist heat"):
            quals.append("حرارة جافة" if tl == "dry heat" else "حرارة رطبة"); continue
        if tl in SEAFOOD:
            v = SEAFOOD[tl]
            if v not in species_ar:
                species_ar.append(v)
            prev_species = tl
            continue
        ar, unk = phrase_translate(t)
        if unk:
            unknown += unk
        elif ar:
            (extras if t.lower() in PACK else quals).append(ar)
    if unknown:
        self.manual.append(row["slug"]); return
    sp = " ".join(dict.fromkeys(x for x in species_ar if x)).strip() or "سمك"
    if is_eggs:
        sp = f"بطارخ {sp}"
    # prefix سمك only when species is not already a creature name
    elif not any(w in sp for w in ("سمك", "جمبري", "كابوريا", "استاكوزا", "محار", "بطلينوس", "أخطبوط", "سبيط", "سكالوب", "بلح", "كركند", "بطارخ", "سلحفاة", "قوقع", "حبار")):
        sp = f"سمك {sp}"
    # merge "حرارة جافة/رطبة" into the method
    if "حرارة جافة" in quals and "مطهو" in quals:
        quals = [q for q in quals if q not in ("حرارة جافة", "مطهو")]
        quals.append("مطهو بحرارة جافة")
    if "حرارة رطبة" in quals and "مطهو" in quals:
        quals = [q for q in quals if q not in ("حرارة رطبة", "مطهو")]
        quals.append("مطهو بالحرارة الرطبة")
    name = sp
    qs = [x for x in quals if x]
    if qs:
        name += " — " + "، ".join(qs)
    if extras:
        name += f" ({'، '.join(dict.fromkeys(extras))})"
    if tribal:
        name += f" ({tribal})"
    self.emit(row["slug"], name, nameEn, differentiators=extras + ([tribal] if tribal else []))

def baby_handler(self, row):
    nameEn = row["nameEn"]
    toks = split_tokens(nameEn)
    parts, stage, form, unknown = [], None, None, []
    for t in toks[1:]:
        tl = t.lower()
        if tl in ("strained",):
            stage = "مهروس"; continue
        if tl in ("junior",):
            stage = "جونيور"; continue
        if tl in ("toddler",):
            stage = "للأطفال الصغار"; continue
        if tl in ("dry", "dry form"):
            form = "جاف"; continue
        ar, unk = phrase_translate(t)
        if unk:
            unknown += unk
        elif ar:
            parts.append(ar)
    if unknown:
        self.manual.append(row["slug"]); return
    desc = " ".join(x for x in parts if x).strip()
    if not desc:
        self.manual.append(row["slug"]); return
    # leading category word (فواكه/خضار/حبوب/لحم...)
    name = f"طعام أطفال — {desc}"
    tail = []
    if form:
        tail.append(form)
    if stage and stage != "مهروس":
        tail.append(stage)
    if tail:
        name += f" ({'، '.join(tail)})"
    self.emit(row["slug"], name, nameEn, differentiators=[stage, form])

def formula_handler(self, row):
    nameEn = row["nameEn"]
    toks = split_tokens(nameEn)
    brand = None
    rest = []
    for t in toks[1:]:
        if t in BRANDS or t.upper() in BRANDS:
            b = BRANDS.get(t) or BRANDS.get(t.upper())
            if brand is None:
                brand = b
            # parent companies skipped unless no product brand followed
            continue
        rest.append(t)
    if brand is None:
        # last chance: first rest token is a brand
        if rest and (rest[0] in BRANDS or rest[0].upper() in BRANDS):
            brand = BRANDS.get(rest[0]) or BRANDS.get(rest[0].upper()); rest = rest[1:]
    if brand is None:
        self.manual.append(row["slug"]); return
    quals, unknown = [], []
    for t in rest:
        ar, unk = phrase_translate(t)
        if unk:
            unknown += unk
        elif ar:
            quals.append(ar)
    if unknown:
        self.manual.append(row["slug"]); return
    qs = [x for x in quals if x]
    name = f"حليب أطفال {brand}"
    if qs:
        name += " — " + "، ".join(qs)
    self.emit(row["slug"], name, nameEn, differentiators=qs)

def soup_handler(self, row):
    nameEn = row["nameEn"]
    toks = split_tokens(nameEn)
    parts, extras, unknown = [], [], []
    for t in toks[1:]:
        tl = t.lower()
        if tl in PACK:
            extras.append(PACK[tl]); continue
        if tl in STATE:
            extras.append(STATE[tl]); continue
        ar, unk = phrase_translate(t)
        if unk:
            unknown += unk
        elif ar:
            parts.append(ar)
    if unknown:
        self.manual.append(row["slug"]); return
    desc = " ".join(x for x in parts if x).strip()
    if not desc:
        desc = "مشكلة"
    name = f"شوربة {desc}"
    if extras:
        name += f" ({'، '.join(dict.fromkeys(extras))})"
    self.emit(row["slug"], name, nameEn, differentiators=extras)

def beverage_handler(self, row):
    nameEn = row["nameEn"]
    toks = split_tokens(nameEn)
    parts, extras, unknown = [], [], []
    for t in toks[1:]:
        tl = t.lower()
        if tl in PACK:
            extras.append(PACK[tl]); continue
        ar, unk = phrase_translate(t)
        if unk:
            unknown += unk
        elif ar:
            parts.append(ar)
    if unknown:
        self.manual.append(row["slug"]); return
    desc = " ".join(x for x in parts if x).strip()
    if not desc:
        self.manual.append(row["slug"]); return
    name = desc if desc.startswith(("مشروب", "عصير", "شاي", "قهوة", "ماء", "ميلك", "سموذي", "رحيق")) else f"مشروب {desc}"
    if extras:
        name += f" ({'، '.join(dict.fromkeys(extras))})"
    self.emit(row["slug"], name, nameEn, differentiators=extras)

DISH_OVERRIDE = {
    "biscuit": "بسكويت إفطار",
    "croissant": "كرواسون",
    "english muffin": "مافن إنجليزي",
    "bagel": "بيجل",
    "griddle cake sandwich": "ساندويتش بان كيك",
    "hotcake sandwich": "ساندويتش بان كيك",
    "muffin": "مافن",
    "nachos": "ناتشوز",
    "french toast sticks": "أصابع توست فرنسي",
    "hash browns": "هاش براون",
    "potato wedges": "أصابع بطاطس",
    "cheeseburger": "برجر جبنة",
    "hamburger": "برجر لحم",
    "double cheeseburger": "دوبل برجر جبنة",
    "bacon cheeseburger": "برجر جبنة وبيكون",
    "cheese pizza": "بيتزا جبنة",
    "pepperoni pizza": "بيتزا بيبروني",
    "sausage pizza": "بيتزا نقانق",
    "vegetable pizza": "بيتزا خضار",
    "supreme pizza": "بيتزا سوبريم",
    "chicken sandwich": "ساندويتش دجاج",
    "chicken nuggets": "ناجتس دجاج",
    "chicken tenders": "تندرز دجاج",
    "chicken wings": "أجنحة دجاج",
    "chicken drumstick": "دبابيس دجاج",
    "chicken thigh": "فخذ دجاج",
    "chicken breast": "صدر دجاج",
    "fried chicken": "دجاج مقلي",
    "grilled chicken": "دجاج مشوي",
    "roast chicken": "دجاج محمر",
    "chicken fillet": "فيليه دجاج",
    "fish sandwich": "ساندويتش سمك",
    "fish fillet": "فيليه سمك",
    "egg and cheese": "بيض وجبنة",
    "scrambled eggs": "بيض مخفوق",
    "pancakes": "بان كيك",
    "waffles": "وافل",
    "french fries": "بطاطس محمرة",
    "onion rings": "حلقات بصل",
    "coleslaw": "سلطة ملفوف",
    "mashed potatoes": "بطاطس مهروسة",
    "baked potato": "بطاطس مشوية",
    "corn on the cob": "كوز ذرة",
    "taco": "تاكو",
    "burrito": "بوريتو",
    "quesadilla": "كيساديلا",
    "enchilada": "انشيلادا",
    "salad": "سلطة",
    "wrap": "راب",
    "submarine sandwich": "ساندويتش غواصة",
    "pizza": "بيتزا",
}

def fastfood_handler(self, row):
    nameEn = row["nameEn"]
    toks = split_tokens(nameEn)
    head = toks[0]
    brand = None
    if head in BRANDS or head.upper() in BRANDS:
        brand = BRANDS.get(head) or BRANDS.get(head.upper())
        rest = toks[1:]
        prefix = None
    else:
        rest = toks[1:]
        prefix = {"Fast foods": "وجبة سريعة", "Fast Foods": "وجبة سريعة",
                  "Fast food": "وجبة سريعة", "Fast Food": "وجبة سريعة",
                  "Restaurant": "مطعم", "School Lunch": "وجبة مدرسية",
                  "USDA Commodity": "تموين حكومي"}.get(head)
    # translate the dish tokens
    parts, unknown, extras = [], [], []
    for t in rest:
        tl = t.lower()
        if tl in PACK:
            extras.append(PACK[tl]); continue
        if tl in STATE:
            extras.append(STATE[tl]); continue
        if tl in DISH_OVERRIDE:
            parts.append(DISH_OVERRIDE[tl]); continue
        ar, unk = phrase_translate(t)
        if unk:
            unknown += unk
        elif ar:
            parts.append(ar)
    if unknown:
        self.manual.append(row["slug"]); return
    dish = " ".join(x for x in parts if x).strip()
    if not dish:
        self.manual.append(row["slug"]); return
    if brand:
        name = f"{dish} {brand}".strip()
    elif prefix == "مطعم":
        name = f"{dish} — مطعم"
    elif prefix == "وجبة مدرسية":
        name = f"{dish} — وجبة مدرسية"
    elif prefix == "تموين حكومي":
        name = f"{dish} — تموين حكومي"
    else:
        name = dish
    if extras:
        name += f" ({'، '.join(dict.fromkeys(extras))})"
    self.emit(row["slug"], name, nameEn, differentiators=extras)
