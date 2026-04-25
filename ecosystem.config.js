module.exports = {
  apps: [
    {
      name: 'AvernethWebV2',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/var/www/AvernethWebV2',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/AvernethWebV2-error.log',
      out_file: '/var/log/AvernethWebV2-out.log',
      log_file: '/var/log/AvernethWebV2.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
