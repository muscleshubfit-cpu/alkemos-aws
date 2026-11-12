#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Slug-anchored injector: replace nameAr for the batch's slugs in foods.ts.
Verifies: entry count, slug order, nameEn untouched, curated rows untouched,
only nameAr changed, exactly the batch slugs modified."""
import json, re, hashlib, sys

FOODS = "/home/z/my-project/alkemos-aws/src/lib/foods.ts"
BASE = "/home/z/my-project/alkemos-aws/scripts/repro/food-arabization-batch5"

final = json.load(open(f"{BASE}/final_names.json", encoding="utf-8"))
src = open(FOODS, encoding="utf-8").read()
orig_len = len(src)

# hashes before
def sha(s): return hashlib.sha256(s.encode()).hexdigest()

entry_re = re.compile(
    r'\{\s*slug:\s*"((?:[^"\\]|\\.)+)",\s*nameAr:\s*"((?:[^"\\]|\\.)+)",\s*nameEn:\s*"((?:[^"\\]|\\.)+)",\s*category:\s*"([^"]+)"'
)
entries = list(entry_re.finditer(src))
slugs_before = [m.group(1) for m in entries]
nameEn_before = {m.group(1): m.group(3) for m in entries}
nameAr_before = {m.group(1): m.group(2) for m in entries}
print(f"entries: {len(entries)}")
assert len(entries) == 8830, "entry count changed!"

# curated rows (tags non-empty) — approximate check via the 80 slugs snapshot
curated_slugs = [m.group(1) for m in re.finditer(
    r'\{\s*slug:\s*"((?:[^"\\]|\\.)+)",\s*nameAr:\s*"((?:[^"\\]|\\.)+)",\s*nameEn:\s*"((?:[^"\\]|\\.)+)",\s*category:\s*"[^"]+",[^}]*?tags:\s*\[\s*"[^"]+"', src)]
print(f"curated (tags non-empty): {len(curated_slugs)}")

changed = 0
skipped_same = 0
errors = []
for slug, new_ar in final.items():
    if slug not in nameAr_before:
        errors.append(f"slug not found: {slug}")
        continue
    old_ar = nameAr_before[slug]
    if old_ar == new_ar:
        skipped_same += 1
        continue
    if slug in curated_slugs:
        errors.append(f"CURATED ROW TOUCHED: {slug}")
        continue
    # slug-anchored replacement
    pat = re.compile(
        r'(slug:\s*"' + re.escape(slug) + r'",\s*\n\s*nameAr:\s*")((?:[^"\\]|\\.)*)(")'
    )
    def repl(m):
        return m.group(1) + new_ar.replace("\\", "\\\\").replace('"', '\\"') + m.group(3)
    new_src, n = pat.subn(repl, src, count=1)
    if n != 1:
        errors.append(f"replace failed: {slug}")
        continue
    src = new_src
    changed += 1

print(f"changed: {changed} | skipped (same value): {skipped_same} | errors: {len(errors)}")
for e in errors[:10]: print("  ERR:", e)

# post-verification
entries2 = list(entry_re.finditer(src))
slugs_after = [m.group(1) for m in entries2]
nameEn_after = {m.group(1): m.group(3) for m in entries2}
nameAr_after = {m.group(1): m.group(2) for m in entries2}
assert slugs_before == slugs_after, "SLUG ORDER CHANGED!"
diff_en = [s for s in slugs_before if nameEn_before[s] != nameEn_after[s]]
print(f"nameEn changes: {len(diff_en)} (must be 0)")
changed_rows = [s for s in slugs_before if nameAr_before[s] != nameAr_after[s]]
print(f"nameAr rows changed: {len(changed_rows)}")
# every changed row must be in the batch
not_in_batch = [s for s in changed_rows if s not in final]
print(f"changed rows outside batch: {len(not_in_batch)} (must be 0)")
# every batch row now has the exact new value
mismatch = [s for s, v in final.items() if nameAr_after.get(s) != v]
print(f"batch rows with mismatched value: {len(mismatch)} (must be 0)")
for s in mismatch[:10]: print("   MISMATCH:", s, repr(nameAr_after.get(s))[:60], "expected", repr(final[s])[:60])
# excluded rows untouched (pork/alcohol)
excl = set(json.load(open(f"{BASE}/excluded_pork.json"))) | set(json.load(open(f"{BASE}/excluded_alcohol.json")))
touched_excl = [s for s in excl if nameAr_before[s] != nameAr_after[s]]
print(f"excluded rows touched: {len(touched_excl)} (must be 0)")
# arabicless count after
AR = re.compile(r"[\u0600-\u06FF]")
still_english = [s for s in slugs_after if not AR.search(nameAr_after[s])]
print(f"rows still arabicless: {len(still_english)} (expect 674 = 597 pork + 77 alcohol)")
assert len(still_english) == 674, f"unexpected arabicless count {len(still_english)}"

if errors or diff_en or not_in_batch or mismatch or touched_excl:
    print("\n!!! VERIFICATION FAILED — NOT WRITING")
    sys.exit(1)

open(FOODS, "w", encoding="utf-8").write(src)
print(f"\nWRITTEN: {orig_len} -> {len(src)} bytes ({len(src)-orig_len:+})")
