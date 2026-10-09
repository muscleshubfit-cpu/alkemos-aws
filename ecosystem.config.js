// PM2 process definition — Alkemos production origin (AWS Lightsail).
// From docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md ملحق أ —
// created on the test branch test/aws-lightsail-migration (owner order
// 2026-10-09, migration Phase 1).
//
// 2026-10-09 (2) — TEST-BUNDLE TUNE ($7 plan, 1GB RAM — owner order
// «ابدأ تنفيذ خطة النقل باستخدام باقة $7»): measured runtime (same
// Phase-1 methodology, demo build): 209MB RSS at boot → 262MB warm →
// 356MB peak after 3 back-to-back OG/Satori (Arabic) renders. On 1GB:
// OS ~200MB + Caddy ~40MB + PM2 ~60MB ⇒ ≈660MB worst case, ≥340MB
// headroom — plan's «RAM < 700MB» criterion for the $7 bundle is met.
// Two belts replace the old single 1500M valve (which was tuned for the
// retired $12/2GB plan and would never fire on 1GB before the kernel
// OOM-killer):
//   • max_memory_restart 600M — PM2 restarts the app before the box
//     starves (600M app + ~300MB OS/Caddy/PM2 ≈ 900M < 1GB).
//   • NODE_OPTIONS=--max-old-space-size=512 — V8 old-space cap: a leak
//     GC-thrashes under the cap instead of ballooning into the OS.
//     Third belt: 2GB swap + swappiness=10 (deploy/setup-server.sh).
// صفر اقتران بـVercel؛ worker واحد كافٍ للحمل المقيس (~0.2 req/s بعد ISR)
// — على 1GB لا cluster (نسخة ثانية تضاعف RSS الأساسي)؛ ارفع instances
// عند ترقية الباقة عبر snapshot ($7→$12 ممكنة؛ التنزّل العكسي غير مدعوم).
// cwd is the `current` symlink — deploy/deploy.sh flips it atomically
// between /srv/alkemos/releases/<sha> directories (capistrano-style).
module.exports = {
  apps: [
    {
      name: "alkemos",
      cwd: "/srv/alkemos/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork", // cluster عند الحاجة لاحقًا
      instances: 1,
      max_memory_restart: "600M", // صمام PM2 على خطة 1GB ($7) — كانت 1500M لخطة 2GB
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
        NODE_OPTIONS: "--max-old-space-size=512", // سقف V8 old-space (2026-10-09 (2))
      },
      time: true,
      out_file: "/var/log/alkemos/out.log",
      error_file: "/var/log/alkemos/error.log",
    },
  ],
};
