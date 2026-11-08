import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { EXERCISES } from "../exercises";
import {
  getExerciseImageUrl,
  getExerciseImages,
  getExerciseImageSrcSet,
} from "../exercise-images";

/**
 * Batch 2 law (§12.53 item 2, 2026-09-16 — owner order «نفّذ دفعة 2 الخاصة
 * باستضافة صور التمارين ذاتيًا»): every exercise image is a SELF-HOSTED
 * WebP asset under public/images/exercises/ — the raw.githubusercontent.com
 * hot-link dependency is retired (not a CDN: max-age=300, rate limits,
 * repo-move risk). The dataset's folder/number naming is preserved; only
 * the extension maps .jpg → .webp (q85, method 6, original dimensions —
 * content quality unchanged by owner law).
 *
 * Guarded contracts:
 *   1. The URL builder maps dataset .jpg keys to local .webp assets.
 *   2. Passthrough laws (http / leading-slash / empty) are unchanged.
 *   3. EVERY imageKey of EVERY exercise resolves to an existing,
 *      non-empty .webp file on disk (868 exercises × 2 images).
 *   4. The builder source contains no raw.githubusercontent.com URL.
 */
const PUBLIC_DIR = resolve(__dirname, "../../../public");

describe("exercise images self-hosting (batch 2 — §12.53 item 2)", () => {
  it("maps dataset .jpg keys to self-hosted .webp assets", () => {
    expect(getExerciseImageUrl("Bench_Press/0.jpg")).toBe(
      "/images/exercises/Bench_Press/0.webp",
    );
    expect(getExerciseImageUrl("3_4_Sit-Up/1.jpg")).toBe(
      "/images/exercises/3_4_Sit-Up/1.webp",
    );
  });

  it("keeps the passthrough laws unchanged", () => {
    expect(getExerciseImageUrl("/images/categories/exercises/chest.webp")).toBe(
      "/images/categories/exercises/chest.webp",
    );
    expect(getExerciseImageUrl("https://example.com/photo.jpg")).toBe(
      "https://example.com/photo.jpg",
    );
    expect(getExerciseImageUrl("")).toBe("");
  });

  it("splits comma-separated keys and maps each to its local WebP", () => {
    expect(getExerciseImages("A_Pose/0.jpg, A_Pose/1.jpg")).toEqual([
      "/images/exercises/A_Pose/0.webp",
      "/images/exercises/A_Pose/1.webp",
    ]);
  });

  it("every exercise imageKey resolves to an existing non-empty .webp on disk", () => {
    const missing: string[] = [];
    for (const ex of EXERCISES) {
      for (const url of getExerciseImages(ex.imageKey)) {
        if (!url.startsWith("/images/exercises/")) {
          missing.push(`${ex.slug}: unexpected non-local url ${url}`);
          continue;
        }
        const p = resolve(PUBLIC_DIR, url.slice(1));
        if (!existsSync(p)) {
          missing.push(`${ex.slug}: missing file ${url}`);
        } else if (statSync(p).size === 0) {
          missing.push(`${ex.slug}: empty file ${url}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("the URL builder code no longer references raw.githubusercontent.com", () => {
    // Comments may narrate the migration history (repo law: history
    // narration in comments is allowed) — the CODE path must not carry
    // the retired host.
    const stripComments = (s: string) =>
      s
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    const src = stripComments(
      readFileSync(resolve(__dirname, "../exercise-images.ts"), "utf8"),
    );
    expect(src).not.toContain("raw.githubusercontent.com");
  });
});

/**
 * P1-2 (PERFORMANCE-AUDIT-2026-11-08, owner order 2026-11-08): the
 * responsive-variant law. Every self-hosted exercise photo ships prebuilt
 * 400w + 200w siblings (-400.webp / -200.webp, q85 method 6 — content
 * quality law; originals untouched — immutable-cache family law), and the
 * srcset builder offers exactly 640w/400w/200w in that order. Guarded
 * contracts:
 *   1. getExerciseImageSrcSet builds the three candidates from a
 *      self-hosted URL.
 *   2. Non-exercise URLs (http / other local paths / empty) → undefined
 *      (the caller then renders WITHOUT srcset — byte-identical to
 *      pre-P1-2 markup).
 *   3. EVERY variant file of EVERY exercise imageKey exists on disk,
 *      non-empty (same existence law as the originals above).
 */
describe("exercise images responsive variants (P1-2 — PERFORMANCE-AUDIT-2026-11-08)", () => {
  it("builds the 640w/400w/200w candidate list for a self-hosted URL", () => {
    expect(getExerciseImageSrcSet("/images/exercises/Bench_Press/0.webp")).toBe(
      "/images/exercises/Bench_Press/0.webp 640w, /images/exercises/Bench_Press/0-400.webp 400w, /images/exercises/Bench_Press/0-200.webp 200w",
    );
  });

  it("returns undefined for non-exercise urls (render stays srcset-free)", () => {
    expect(getExerciseImageSrcSet("https://example.com/x.webp")).toBeUndefined();
    expect(getExerciseImageSrcSet("/images/brand/hero-light.webp")).toBeUndefined();
    expect(getExerciseImageSrcSet("")).toBeUndefined();
    expect(getExerciseImageSrcSet("/images/exercises/not-a-photo.txt")).toBeUndefined();
  });

  it("every exercise imageKey resolves to existing non-empty variant files on disk", () => {
    const missing: string[] = [];
    for (const ex of EXERCISES) {
      for (const url of getExerciseImages(ex.imageKey)) {
        const srcSet = getExerciseImageSrcSet(url);
        if (!srcSet) {
          missing.push(`${ex.slug}: no srcset for ${url}`);
          continue;
        }
        for (const candidate of srcSet.split(", ")) {
          const file = candidate.split(" ")[0];
          const p = resolve(PUBLIC_DIR, file.slice(1));
          if (!existsSync(p)) {
            missing.push(`${ex.slug}: missing variant ${file}`);
          } else if (statSync(p).size === 0) {
            missing.push(`${ex.slug}: empty variant ${file}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
