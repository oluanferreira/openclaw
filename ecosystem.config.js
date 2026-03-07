module.exports = {
  apps: [
    {
      name: 'openclaw-web',
      cwd: '/root/openclaw',
      script: 'bash',
      args: '-c "pnpm --filter web start"',
      instances: 1,
      exec_mode: 'fork',
      // Reinicia automaticamente se ultrapassar 1.2GB (Next.js prod fica em ~300-500MB)
      max_memory_restart: '1200M',
      // Evita restart loop: só reinicia se crashou após 10s de uptime
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 3000,
      // Passa as variáveis de ambiente
      env: {
        NODE_ENV: 'production',
      },
      // Logs
      error_file: '/root/.pm2/logs/openclaw-web-error.log',
      out_file: '/root/.pm2/logs/openclaw-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
