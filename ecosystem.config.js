module.exports = {
  apps: [
    {
      name: 'et3am-backend',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env_file: './backend/.env.production',
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 5000,
      max_memory_restart: '500M',
      error_file: './backend/logs/pm2-error.log',
      out_file: './backend/logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
