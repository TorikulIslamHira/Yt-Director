module.exports = {
  apps: [
    {
      name: "yt-director",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      exec_mode: "cluster",
      instances: 2,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
