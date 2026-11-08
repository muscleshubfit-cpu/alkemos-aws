# Project Images

This folder contains all images used by the Alkemos project.

## Where to Upload Your Images

### 📁 `categories/foods/` — 9 food category thumbnails

Upload square images (400×400 recommended, JPG/PNG/WebP/SVG).

| Filename | Category | Used in |
|---|---|---|
| `protein.jpg` | بروتين | `/foods` page + landing page |
| `carb.jpg` | كارب | `/foods` page + landing page |
| `fat.jpg` | دهون | `/foods` page + landing page |
| `vegetable.jpg` | خضار | `/foods` page |
| `fruit.jpg` | فواكه | `/foods` page |
| `dairy.jpg` | ألبان | `/foods` page |
| `nuts.jpg` | مكسرات | `/foods` page |
| `snack.jpg` | سناك | `/foods` page |
| `drink.jpg` | مشروبات | `/foods` page |

### 📁 `categories/exercises/` — 8 exercise category thumbnails

Upload square images (400×400 recommended).

| Filename | Category | Used in |
|---|---|---|
| `chest.jpg` | صدر | `/exercises` page + landing page |
| `back.jpg` | ظهر | `/exercises` page |
| `shoulders.jpg` | أكتاف | `/exercises` page |
| `legs.jpg` | أرجل | `/exercises` page + landing page |
| `biceps.jpg` | بايسبس | `/exercises` page |
| `triceps.jpg` | ترايسبس | `/exercises` page |
| `core.jpg` | كور | `/exercises` page + landing page |
| `cardio.jpg` | كارديو | `/exercises` page + landing page |

> **Note:** The 8 category thumbnails above are LOCAL `.png` files, served
> from this folder. The 868 exercise PHOTOS themselves live in
> `public/images/exercises/` — see the next section.

### 📁 `exercises/` — 1,736 self-hosted exercise photos (batch 2, §12.53 item 2)

The per-exercise start/end photos (`<Exercise>/0.webp` and `<Exercise>/1.webp`)
were previously hot-linked from `raw.githubusercontent.com/yuhonas/free-exercise-db`.
As of 2026-09-16 (owner order «نفّذ دفعة 2 الخاصة باستضافة صور التمارين ذاتيًا»)
they are **self-hosted here as optimized WebP**:

- **Source:** [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  — MIT license. Attribution: `© yuhonas/free-exercise-db contributors`
  (see the MIT license at the source repo). Redistribution of the derived
  WebP re-encodes is permitted under the same MIT terms.
- **Optimization:** JPEG → WebP, quality 85, method 6, **original dimensions
  preserved** (no resize — content quality unchanged by owner law).
  ~94 MB source → ~79 MB on disk.
- **Naming law:** the dataset's `<Exercise_Folder>/<0|1>.webp` names are
  preserved EXACTLY (only the extension changed); `src/lib/exercise-images.ts`
  maps the dataset `.jpg` keys to these `.webp` assets — do NOT rename files.
- **Caching:** served with `Cache-Control: public, max-age=31536000, immutable`
  (rules in `next.config.ts` + `vercel.json`). If a file is ever re-encoded,
  ship it under a NEW filename (or a versioned directory) to avoid stale caches.
- **Guard:** `src/lib/__tests__/exercise-images-selfhost.test.ts` fails the
  build if any exercise `imageKey` has no matching `.webp` on disk.

### 📁 `tools/` — 6 tool thumbnails

Upload square images (400×400 recommended).

| Filename | Tool | Used in |
|---|---|---|
| `calorie-calculator.jpg` | حاسبة السعرات | `/tools` page + landing page |
| `bmi-calculator.jpg` | حاسبة BMI | `/tools` page + landing page |
| `macro-calculator.jpg` | حاسبة الماكروز | `/tools` page + landing page |
| `body-fat-calculator.jpg` | حاسبة الدهون | `/tools` page + landing page |
| `water-tracker.jpg` | متتبع الماء | `/tools` page + landing page |
| `meal-planner.jpg` | مخطط الوجبات | `/tools` page + landing page |

### 📁 `programs/` — 3 workout program thumbnails

Upload wider images (600×400 recommended, 16:10 aspect).

| Filename | Program | Used in |
|---|---|---|
| `home-workout.jpg` | منزلي بدون معدات | landing page |
| `full-gym.jpg` | جيم كامل | landing page |
| `hiit.jpg` | حرق دهون HIIT | landing page |

## How to Upload

1. **Add images via GitHub web UI:**
   - Open the folder on GitHub (e.g. `public/images/categories/foods/`)
   - Click "Add file" → "Upload files"
   - Drag your images, name them exactly as listed above
   - Commit with message: `chore(images): add food category thumbnails`

2. **Or via git CLI:**
   ```bash
   # Copy your images to the right folders
   cp ~/Downloads/protein.jpg public/images/categories/foods/
   cp ~/Downloads/chest.jpg public/images/categories/exercises/
   # ...etc
   git add public/images/
   git commit -m "chore(images): add local category thumbnails"
   git push
   ```

3. **After uploading, tell me** and I'll update the code to use local paths
   (`/images/categories/foods/protein.jpg`) instead of Unsplash URLs.

## Image Specs

- **Format:** JPG (preferred for photos), PNG (for transparency), WebP (best compression), or SVG (for vector)
- **Size:** 400×400 for categories/tools, 600×400 for programs
- **File size:** < 100 KB each (compress before upload if larger)
- **Compression tool:** https://tinypng.com/ (free, handles JPG/PNG/WebP)

### 📁 `hero/` — section hero photos (responsive WebP triplets)

P0-4 (PERFORMANCE-AUDIT-2026-11-08, owner order 2026-11-08): the two
REFERENCED hero photos (`coaching-1`, `coaching-2` — used by `/coaching`,
`/ar/coaching` and `/for-coaches`) ship as responsive WebP triplets on the
`hero-light-*` pattern: `<name>.webp` (native) + `<name>-640.webp` +
`<name>-828.webp` (q85, method 6). The old single-size JPGs were deleted —
mobile now loads the 640w file (60.3KB vs 160KB, ~63% saving). The
remaining `*.jpg` files in this folder are unreferenced by any page
(verified by `rg` on `src/` + live-production HTML grep) and are kept only
as owner source material.

## Existing Images (already in repo)

The following images already exist in `public/images/` (root level, not in subfolders):

- `accessories.jpg`, `ahmed-*.jpg`, `coach-portrait.jpg`, `dumbbell-gym.jpg`
- `evo-*.jpg`, `fitness-*.jpg`, `gym-interior.jpg`, `hero-ahmed.jpg`
- `founder-certificates.{jpg,webp}` — the founder's eight professional certificates
  (ACSM · ACE · ISSA · NASM), isolated from the owner-supplied collage onto a
  clean background (P2-11, 2026-09-28). Used on `/authors/ahmed-zake` +
  `/ar/authors/ahmed-zake`. Do not edit the certificate pixels — the source
  of truth is the owner's original image.
- `meal-*.jpg`, `running-outdoor.jpg`, `yoga-studio.jpg`

These are used on the landing page hero, About, Coaching, and EVO sections. No action needed for these.

## Why Local Images?

Previously, the project used Unsplash URLs like
`https://images.unsplash.com/photo-XXXX?w=400`. This had problems:

1. **404 errors:** Many photo IDs became invalid (Unsplash removed them).
2. **External dependency:** Site performance depended on Unsplash uptime.
3. **Privacy:** External requests leak visitor IP to Unsplash.

By hosting images locally, the site is fully self-contained and reliable.
