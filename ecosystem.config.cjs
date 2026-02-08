module.exports = {
  apps: [
    {
      name: 'moltmail',
      script: './build/index.js',
      cwd: '/root/.openclaw/workspace/moltmail',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'moltmail',
        DB_USER: 'moltmail',
        DB_PASSWORD: 'moltmail123'
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      autorestart: true
    }
  ]
};
