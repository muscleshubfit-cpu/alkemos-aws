#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analyze manual-queue rows: which unknown words block them (frequency-ranked)."""
import json, re, collections, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import phrase_translate, route

BASE = os.path.dirname(os.path.abspath(__file__))
target = json.load(open(f"{BASE}/target_translatable.json", encoding="utf-8"))
generated = set(json.load(open(f"{BASE}/generated_names.json", encoding="utf-8")).keys())

unknown_by_row = {}
word_freq = collections.Counter()
row_unknown = {}
for row in target:
    if row["slug"] in generated:
        continue
    toks = [t.strip() for t in row["nameEn"].split(",")]
    unk = []
    for t in toks:
        ar, u = phrase_translate(t)
        unk += u
    if unk:
        row_unknown[row["slug"]] = unk
        for w in unk:
            word_freq[w.lower()] += 1

print(f"manual rows with unknown words: {len(row_unknown)}")
print(f"distinct unknown words: {len(word_freq)}")
print("\nTop 250 unknown words:")
for w, n in word_freq.most_common(250):
    print(f"  {n:4d}  {w}")
json.dump({r: row_unknown[r] for r in row_unknown}, open(f"{BASE}/unknown_words_by_row.json", "w"), ensure_ascii=False, indent=1)
