#!/usr/bin/env node
/**
 * P1-4 (PERFORMANCE-AUDIT-2026-11-08, owner order 2026-11-08) — precompress
 * the build's static text assets into Brotli + gzip sidecar files.
 *
 * WHY (measured live 2026-11-08): every mainstream browser sends
 * `Accept-Encoding: gzip, deflate, br, zstd` — and for those requests the
 * edge serves the ORIGIN's gzip for /_next/static JS/CSS (measured: AE
 * "br" only → br; AE "zstd, gzip, br" → gzip). The only deterministic way
 * to hand those clients Brotli is for the ORIGIN to reply
 * `Content-Encoding: br` for every br-capable request — which Caddy's
 * `file_server precompressed br gzip` does from these sidecar files
 * (deploy/Caddyfile P1-4 handle block). Expected saving: ~5-8% of the
 * ~356KB initial JS/CSS per cold visit (~25KB).
 *
 * LAW (next.config.ts Batch-2 §12.53 / migration plan §8): the release
 * ships the FULL .next — the sidecars live INSIDE .next/static, so the
 * existing `tar -czf release.tgz .next …` packaging picks them up with
 * zero packaging changes.
 *
 * Sidecar discipline:
 *   - Only text families gain sidecars: .js .css .json .svg .txt
 *     (already-compressed binaries — woff2/webp/png/avif — gain nothing).
 *   - `.br` = zlib brotli level 11 (one-time build cost in CI, ~15-60s
 *     for the whole tree); `.gz` = level 9. gzip-only clients (ancient
 *     browsers/bots) keep today's byte size, never identity.
 *   - Idempotent: re-running refreshes sidecars; originals never touched.
 *   - Zero dependency: Node/bun built-in zlib only (no brotli CLI on the
 *     runner — the CI environment is not assumed beyond Node 22).
 *
 * Usage: node scripts/precompress-static.mjs [.next/static dir]
 * Exit 0 on success; nonzero with a per-file error list otherwise.
 */

import { brotliCompressSync, gzipSync } from "node:zlib";
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT =
  process.argv[2] ?? new URL("../.next/static", import.meta.url).pathname;
const TEXT_EXT = new Set([".js", ".css", ".json", ".svg", ".txt"]);

let files = 0;
let sidecars = 0;
let bytesBefore = 0;
let bytesBr = 0;
let bytesGz = 0;
const errors = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
      continue;
    }
    const dot = entry.lastIndexOf(".");
    const ext = dot === -1 ? "" : entry.slice(dot).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;
    // never touch existing sidecars on a re-run
    if (/\.(br|gz)$/.test(entry)) continue;
    files += 1;
    try {
      const buf = readFileSync(p);
      bytesBefore += buf.length;
      const br = brotliCompressSync(buf, { level: 11 });
      const gz = gzipSync(buf, { level: 9 });
      writeFileSync(`${p}.br`, br);
      writeFileSync(`${p}.gz`, gz);
      sidecars += 2;
      bytesBr += br.length;
      bytesGz += gz.length;
    } catch (e) {
      errors.push(`${p}: ${e.message}`);
    }
  }
}

walk(ROOT);

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
console.log(
  `[precompress] ${files} text assets -> ${sidecars} sidecars (${ROOT})`,
);
console.log(
  `[precompress] original ${kb(bytesBefore)} · br ${kb(bytesBr)} (${(
    (1 - bytesBr / bytesBefore) * 100
  ).toFixed(1)}% smaller) · gz ${kb(bytesGz)}`,
);

if (errors.length) {
  console.error(`[precompress] ${errors.length} errors:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
