# LICENSES-DATA.md — Data Licenses & Attribution Ledger

> **Scope:** the licensing + attribution ledger for every OPEN DATA dataset the
> platform stores or serves (AGENTS §3.8 + the F3-ب acceptance criterion 2 of
> `docs/opencalory-integration-review-2026-11-28/`). Code licenses live in
> `LICENSE`; this file governs DATA only. The public-facing attribution page
> (`/data-credits`, gate D-4) is executed in a later wave by its own owner
> order; this file is the internal source it will render from.
>
> **Law (D-2 / 05 §1.2 — owner order 2026-11-28):** open-data rows live in
> their own SEPARATE table (`food_catalog`), carrying source rows VERBATIM —
> never merged with the private Alkemos library inside storage. The logical
> merge happens at the query layer only. This keeps the private library
> (`src/lib/foods.ts`, `nutrient_reference`) pure commercial property while
> every open-license obligation stays scoped to its own table.

## 1) The food catalog aggregate — ODbL-1.0

- **Where:** `public.food_catalog` + `public.food_catalog_aliases`
  (migration `20261128180000_0123_food_catalog_foundation.sql`; data imported
  by `.github/workflows/food-catalog-import.yml` from the F3-a CI artifact —
  `scripts/food-catalog/` builds it).
- **Aggregate license:** **ODbL-1.0** (Open Database License) — declared by
  the build manifest (`catalog-manifest.json` → `license`). The aggregate
  includes ODbL sources, so it is an ODbL Derived Database.
- **What ODbL requires on distribution (Convey) of the database:** (1) full
  attribution of the sources, (2) Share-Alike — the derived database is
  distributed under ODbL-1.0 too.
- **What it does NOT require:** internal use, and serving search results or
  individual food rows through the site (that is not distribution of the
  database itself). Attribution remains proactive good practice — hence the
  `/data-credits` page (gate D-4).
- **Current build composition (measured from the imported artifact):**
  USDA FoodData Central (multiple datasets), Health Canada CNF, Open Food
  Facts, and the forked curated regional packs. OpenNutrition is OPT-IN in
  the build and contributed zero rows to the default import.

## 2) Per-source obligations (the base layer)

| Source | License | Obligation when used | Attribution statement |
|---|---|---|---|
| USDA FoodData Central | CC0 1.0 / public domain (US works) | none legally; attribution is good practice | "Data from USDA FoodData Central" |
| Health Canada — Canadian Nutrient File (CNF) | OGL-Canada 2.0 | explicit attribution | **"Contains information licensed under the Open Government Licence – Canada."** |
| Open Food Facts | ODbL-1.0 | attribution + Share-Alike on distributing the derived database | "Data from Open Food Facts — https://world.openfoodfacts.org" (ODbL) |
| Curated regional packs (the F3-a fork's `data/curated/`) | ODbL-1.0 / CC0 — per pack | per pack | per pack (see the pack headers in `scripts/food-catalog/data/curated/`) |
| OpenNutrition (opt-in builds only) | ODbL-1.0 | attribution + Share-Alike on distribution | "Data from OpenNutrition" (only in builds run with `--with-opennutrition`) |

## 3) Rules (binding on every future data import)

1. **No commercial API aggregation inside repo assets** (03 §3-4 / 05 §1.6):
   FatSecret / Edamam / Nutritionix are never adopted (subscription cost +
   restrictive ToS).
2. **Every new source = an explicit owner order after its license review**
   (the F3-هـ pattern — CC BY 4.0 / Licence Ouverte / CC0 sources each get a
   per-source decision).
3. **The private library never mixes into open tables at the storage layer**
   (D-2 separation) — and open rows never present as proprietary content in
   the UI.
4. **Any future distribution of the catalog itself** (export, download,
   dataset product) is an owner decision gated on this ledger + legal review
   (05 §2 R1) — the site serving search results is not distribution.
5. Platform-owned authored content (e.g., the future Egyptian pack F3-ج) is
   released **CC0 by us** — authored from documented sources
   (`nutrient_reference`, independent verification, USDA equivalents), never
   copied from ODbL rows.

## 4) Attribution statement (internal boilerplate)

The migration comment of every catalog-carrying table + the `/data-credits`
page render from this section (single source — AGENTS §3.8):

> The food catalog is an Open Database (ODbL-1.0) compiled from: USDA
> FoodData Central (CC0), Health Canada CNF (Contains information licensed
> under the Open Government Licence – Canada), Open Food Facts (ODbL), and
> curated regional packs (ODbL/CC0).
