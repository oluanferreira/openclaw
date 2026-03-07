module.exports = {
  apps: [
    {
      name: "openclaw-web",
      cwd: "/root/openclaw/apps/web",
      script: "/root/openclaw/node_modules/next/dist/bin/next",
      args: "start",

      // ── Cluster Mode ──────────────────────────────────────────────
      // Two workers behind PM2 load balancer for zero-downtime reloads.
      exec_mode: "cluster",
      instances: 2,

      // Graceful startup: worker must call process.send("ready") or
      // PM2 waits up to listen_timeout ms before considering it online.
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // ── Stability ─────────────────────────────────────────────────
      // Restart if memory exceeds 1.2 GB (prod usage is ~300-500 MB)
      max_memory_restart: "1200M",
      // Avoid restart loops: only restart if process ran for >= 10 s
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,

      // ── Environment ───────────────────────────────────────────────
      env: {
        NODE_ENV: "production",
      },

      // ── Logs ──────────────────────────────────────────────────────
      error_file: "/root/.pm2/logs/openclaw-web-error.log",
      out_file: "/root/.pm2/logs/openclaw-web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // ── Known Limitations ─────────────────────────────────────────
      // RATE LIMITER: The in-memory Map rate limiter in
      // packages/api/src/middleware.ts does NOT share state between
      // cluster workers. Each worker maintains its own counter, so the
      // effective limit is multiplied by the number of instances
      // (e.g., 120 req/min becomes ~240 req/min across 2 workers).
      // This is acceptable for the current user base (~5 users) and
      // will be resolved in SR-1.9 by migrating to a Redis-backed
      // rate limiter with shared state.
    },
  ],
};
