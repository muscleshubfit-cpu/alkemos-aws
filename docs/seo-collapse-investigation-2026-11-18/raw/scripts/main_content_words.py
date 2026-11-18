#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Main-content size measurement — Alkemos 2026-11-18 (read-only).
Measures words inside <main> (falls back to body minus header/footer/nav)
for a cross-group sample, to compare with prior-audit word counts.
"""
import requests, json, statistics
from bs4 import BeautifulSoup

GB = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

SAMPLES = {
    "foods-en": [
        "https://alkemos.com/foods/salmon",
        "https://alkemos.com/foods/white-rice",
        "https://alkemos.com/foods/banana",
        "https://alkemos.com/foods/tofu",
        "https://alkemos.com/foods/worthington-choplets-canned-unprepared",
        "https://alkemos.com/foods/mcdonalds-chicken-mcnuggets",
        "https://alkemos.com/foods/cereal",
        "https://alkemos.com/foods/egg",
    ],
    "foods-ar": [
        "https://alkemos.com/ar/foods/olive-oil",
        "https://alkemos.com/ar/foods/tuna",
        "https://alkemos.com/ar/foods/potato",
        "https://alkemos.com/ar/foods/salmon",
    ],
    "exercises-en": [
        "https://alkemos.com/exercises/dumbbell-bench-press-with-neutral-grip",
        "https://alkemos.com/exercises/crunches",
        "https://alkemos.com/exercises/standing-calf-raises",
        "https://alkemos.com/exercises/ez-bar-curl",
        "https://alkemos.com/exercises/flutter-kicks",
        "https://alkemos.com/exercises/ab-roller",
    ],
    "exercises-ar": [
        "https://alkemos.com/ar/exercises/shoulder-circles",
        "https://alkemos.com/ar/exercises/lateral-bound",
        "https://alkemos.com/ar/exercises/single-arm-push-up",
    ],
    "blog-en": [
        "https://alkemos.com/blog/protein-after-workout-grams-guide",
        "https://alkemos.com/blog/hiit-home-fat-burning-workout",
    ],
    "blog-ar": [
        "https://alkemos.com/ar/blog/hiit-home-workout-guide",
        "https://alkemos.com/ar/blog/nutrition-before-workout-guide",
    ],
    "tools-en": [
        "https://alkemos.com/tools/calorie-calculator",
        "https://alkemos.com/tools/body-fat-calculator",
        "https://alkemos.com/tools/bmi-calculator",
    ],
    "commercial": [
        "https://alkemos.com/evo",
        "https://alkemos.com/coaching",
        "https://alkemos.com/meal-planner",
    ],
    "muscles": [
        "https://alkemos.com/muscles/biceps",
        "https://alkemos.com/muscles/chest",
    ],
}

def main_words(url):
    r = requests.get(url, headers={"User-Agent": GB}, timeout=40)
    soup = BeautifulSoup(r.text, "html.parser")
    main = soup.find("main") or soup.find("article")
    if main is None:
        # fallback: body minus header/footer/nav/aside
        body = soup.find("body")
        for t in body.find_all(["header", "footer", "nav", "aside"]):
            t.decompose()
        main = body
    txt = main.get_text(" ", strip=True)
    h2s = [h.get_text(strip=True) for h in main.find_all("h2")]
    return len(txt.split()), len(h2s), r.status_code

results = {}
for group, urls in SAMPLES.items():
    counts, h2counts, fails = [], [], 0
    for u in urls:
        try:
            w, h2, sc = main_words(u)
            counts.append(w)
            h2counts.append(h2)
        except Exception:
            fails += 1
    results[group] = {
        "n": len(urls), "fails": fails,
        "median_words": statistics.median(counts) if counts else None,
        "min": min(counts) if counts else None,
        "max": max(counts) if counts else None,
        "median_h2": statistics.median(h2counts) if h2counts else None,
        "words": counts,
    }
    print(f"{group:14s} n={len(urls)} median={results[group]['median_words']:.0f} min={results[group]['min']} max={results[group]['max']} h2~{results[group]['median_h2']} words={counts}")

with open("/home/z/my-project/gsc-data/main-content-words.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print("\nsaved -> /home/z/my-project/gsc-data/main-content-words.json")
