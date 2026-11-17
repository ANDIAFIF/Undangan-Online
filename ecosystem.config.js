// Optional for a new PM2 process. Existing deployments can keep their current process.
// Set APP_PORT to the port already used by the reverse proxy before starting.
module.exports = {
  apps: [{
    name: 'undangan',
    cwd: __dirname,
    script: './node_modules/next/dist/bin/next',
    args: `start --hostname 127.0.0.1 --port ${process.env.APP_PORT || '3000'}`,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    time: true,
    env: { NODE_ENV: 'production' },
  }],
};
