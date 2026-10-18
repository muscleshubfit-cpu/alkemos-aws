#!/usr/bin/env python3
"""PRIORITY-PAGES implementation check: glued Arabic-Latin adjacency scan.

Mirrors the GLUED_RE rule of src/lib/blog-msa.ts scanLatinContamination
(the rule that caught «وEVO» in tool-msa-surface.test.ts): direct letter
adjacency between an Arabic letter and a Latin letter inside a string is
never legitimate — a real gloss always separates with spaces/parens.

Run over the files touched by the 2026-10-19 implementation frame.
Exit 1 on any hit.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FILES = [
    "src/app/(en)/ai-workout-planner/page.tsx",
    "src/app/(en)/ai-meal-planner/page.tsx",
    "src/app/(en)/evo/page.tsx",
    "src/app/(en)/memberships/page.tsx",
    "src/app/(en)/coaching/page.tsx",
    "src/app/(en)/tools/page.tsx",
    "src/lib/evo-faq.ts",
    "src/lib/coaching-faq.ts",
    "src/lib/faq-content.ts",
    "src/lib/content/bmi-calculator.ts",
    "src/app/(en)/evo/layout.tsx",
    "src/app/(ar)/ar/evo/layout.tsx",
    "src/components/views/StaticPageView.tsx",
]

# Arabic letters (the scanner's ARABIC_LETTER_CLASS is letters-only by
# design — \u0600-\u06FF also holds punctuation like ، ؟ ؛ which would
# false-positive on every whitelisted token before an Arabic comma).
AR = (
    "\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062a"
    "\u062b\u062c\u062d\u062e\u062f\u0630\u0631\u0632\u0633\u0634\u0635"
    "\u0636\u0637\u0638\u0639\u063a\u063b\u063c\u063d\u063e\u063f\u0640"
    "\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064a\u064b"
    "\u064c\u064d\u064e\u064f\u0650\u0651\u0652\u0671"
)
GLUED = re.compile(f"[{AR}]([A-Za-z]+)|([A-Za-z]+)[{AR}]")

# String literals only (single-run heuristic over .ts/.tsx: strip comments).
STRING = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"')

failures = []
for rel in FILES:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    # strip // and /* */ comments (scanner law: comments are not copy)
    text = re.sub(r"/\*[\s\S]*?\*/", " ", text)
    text = re.sub(r"//[^\n]*", " ", text)
    for m in STRING.finditer(text):
        lit = m.group(1)
        if not re.search(r"[\u0600-\u06FF]", lit):
            continue  # EN-only literal: skipped for Latin (scanner law)
        for g in GLUED.finditer(lit):
            tok = g.group(1) or g.group(2)
            failures.append(f"{rel}: glued «…{lit[:60]}…» token={tok}")

if failures:
    print("GLUED ARABIC-LATIN HITS:")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("GLUED SCAN CLEAN: 0 hits across", len(FILES), "files")
