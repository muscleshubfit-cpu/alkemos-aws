import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";

/**
 * SOCIAL-OG-3 (2026-09-30) — OG CARD VISUAL LAW.
 *
 * History: the 2026-09-30 audits proved the root cause of the
 * owner-reported «المربع الأزرق» (blue/placeholder share cards) was the
 * card DESIGN itself: a dark #1d1d1f → #0071e3 Apple-blue gradient that
 * matched nothing in the brand (the site is a LIGHT monochrome marble &
 * chrome system — --bg #FAF8F5, --text #201D1A, --edge #E5DFD6 — zero
 * blue anywhere). Every previous "fix" verified status/content-type
 * only, so the cards stayed green in tests while looking like a generic
 * blue placeholder on every platform.
 *
 * This file guards the pixels themselves — a dependency-free PNG decode
 * (zlib inflate + scanline unfilter, no image libs) asserts for EVERY
 * card in public/images/og/:
 *
 *   1. true 1200×630 dimensions,
 *   2. ZERO strong-blue pixels (the retired #0071e3 class can never
 *      come back unnoticed),
 *   3. warm-light background at the corners (the brand gradient
 *      #FAF8F5 → #EAE3D8 — warm: red ≥ blue),
 *   4. dark ink present (a card that silently renders BLANK fails).
 *
 * If this fails after editing scripts/generate-og-cards.py, re-run the
 * generator and re-check the design against globals.css.
 */

const OG_DIR = resolve(__dirname, "../../../public/images/og");

// ── minimal PNG decoder (8-bit RGB/RGBA, non-interlaced) ────────────────
// PIL writes exactly this profile (Image.convert("RGB").save(..., "PNG")).
type Px = [number, number, number];

function decodePng(buf: Buffer): { width: number; height: number; px: (x: number, y: number) => Px } {
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); // PNG signature
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString("ascii");
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      expect(bitDepth, "8-bit depth required").toBe(8);
      expect(colorType === 2 || colorType === 6, "RGB/RGBA color type required").toBe(true);
      expect(interlace, "non-interlaced required").toBe(0);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len; // len + type + data + crc
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  expect(raw.length, "decompressed size must match height*(1+stride)").toBe(height * (1 + stride));

  // unfilter scanlines (filters 0-4: None, Sub, Up, Average, Paeth)
  const out = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    for (let i = 0; i < stride; i++) {
      const filt = raw[src + i];
      const left = i >= bpp ? out[y * stride + i - bpp] : 0;
      const up = y > 0 ? out[(y - 1) * stride + i] : 0;
      const upLeft = y > 0 && i >= bpp ? out[(y - 1) * stride + i - bpp] : 0;
      let val: number;
      switch (filter) {
        case 0: val = filt; break;
        case 1: val = filt + left; break;
        case 2: val = filt + up; break;
        case 3: val = filt + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          val = filt + pred;
          break;
        }
        default: throw new Error(`unknown PNG filter ${filter}`);
      }
      out[y * stride + i] = val & 0xff;
    }
    src += stride;
  }
  return {
    width,
    height,
    px: (x: number, y: number): Px => {
      const o = y * stride + x * bpp;
      return [out[o], out[o + 1], out[o + 2]];
    },
  };
}

describe("SOCIAL-OG-3 — OG card visual law (warm-light brand palette, never blue)", () => {
  // SOCIAL-OG-4 (2026-11-06): the og-home pair is the ONLY static card on
  // disk — the 54 family/comparison cards are retired (fallback law).
  const cards = readdirSync(OG_DIR).filter((f) => f.endsWith(".png"));
  expect(cards.length).toBe(2);

  it.each(cards)("og-image-visual: %s is 1200×630, warm-light, zero blue, not blank", (file) => {
    const img = decodePng(readFileSync(resolve(OG_DIR, file)));
    expect(img.width).toBe(1200);
    expect(img.height).toBe(630);

    let blue = 0;
    let darkInk = 0;
    let samples = 0;
    for (let y = 0; y < 630; y += 8) {
      for (let x = 0; x < 1200; x += 8) {
        const [r, g, b] = img.px(x, y);
        samples++;
        if (b > r + 40 && b > 100) blue++;
        if ((r + g + b) / 3 < 90) darkInk++;
      }
    }
    // Law 2: the retired Apple-blue gradient (#0071e3 = r0 g113 b227)
    // must be gone — not a single strong-blue sample anywhere.
    expect(blue, `${file}: ${blue} strong-blue pixels — the retired blue gradient is back`).toBe(0);
    // Law 4: the card actually rendered text/brand ink.
    expect(darkInk, `${file}: card looks blank (no dark ink sampled)`).toBeGreaterThan(100);

    // Law 3: warm-light background at the four corners (padding 60 keeps
    // corners pure background): the #FAF8F5 → #EAE3D8 gradient is warm
    // (red ≥ blue) and light — never dark, never blue.
    for (const [x, y] of [[10, 10], [1189, 10], [10, 619], [1189, 619]] as const) {
      const [r, g, b] = img.px(x, y);
      expect(r, `${file}: corner (${x},${y}) red ${r} — not the light brand bg`).toBeGreaterThan(220);
      expect(g, `${file}: corner (${x},${y}) green ${g}`).toBeGreaterThan(214);
      expect(b, `${file}: corner (${x},${y}) blue ${b}`).toBeGreaterThan(200);
      expect(r >= b, `${file}: corner (${x},${y}) cool/blue-shifted (r${r} < b${b})`).toBe(true);
    }
  });

  it("the dynamic generator route stays on the light brand palette (source-level twin of the pixel law)", () => {
    const raw = readFileSync(
      resolve(__dirname, "../../../src/app/api/og-image/[slug]/route.tsx"),
      "utf8",
    );
    // code-only: strip comments so the route's HISTORICAL docblock (which
    // documents the retired hexes) doesn't fail the law — only the CODE
    // must stay on the light palette.
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(src).toContain("#FAF8F5");
    expect(src).toContain("#EAE3D8");
    expect(src).not.toContain("#0071e3");
    expect(src).not.toContain("#1d1d1f");
  });
});
