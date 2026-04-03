module.exports = {
  apps: [{
    name: 'et3am-backend',
    script: 'dist/server.js',
    cwd: '/home/ubuntu/et3am/backend',
    interpreter: 'node',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
