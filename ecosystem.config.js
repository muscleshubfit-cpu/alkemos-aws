// PM2 process definition — Alkemos production origin (AWS Lightsail).
// From docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md ملحق أ —
// created on the test branch test/aws-lightsail-migration (owner order
// 2026-10-09, migration Phase 1).
//
// صفر اقتران بـVercel؛ worker واحد كافٍ للحمل المقيس (~0.2 req/s بعد ISR)
// — ارفع instances إلى 2 عند الحاجة (cluster mode) بعد قياس RAM.
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
      max_memory_restart: "1500M", // صمام أمان على خطة 2GB
      env: { NODE_ENV: "production", PORT: "3000", HOSTNAME: "127.0.0.1" },
      time: true,
      out_file: "/var/log/alkemos/out.log",
      error_file: "/var/log/alkemos/error.log",
    },
  ],
};
