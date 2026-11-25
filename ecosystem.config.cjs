// PM2 (solo si usas VPS): pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [{
    name: 'laplace',
    script: 'server/server.js',
    instances: 1,
    env: { NODE_ENV: 'production', PORT: 3000 },
    max_memory_restart: '200M'
  }]
};
