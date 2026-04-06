module.exports = {
  apps: [
    {
      name: 'averneth-web',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/var/www/averneth-web',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/averneth-web-error.log',
      out_file: '/var/log/averneth-web-out.log',
      log_file: '/var/log/averneth-web.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
