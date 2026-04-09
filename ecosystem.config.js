module.exports = {
  apps: [
    {
      name: 'et3am-backend',
      script: 'dist/server.js',
      cwd: './backend',
      env_file: './backend/.env.production',
    },
  ],
};
