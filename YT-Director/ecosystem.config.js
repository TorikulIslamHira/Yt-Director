module.exports = {
  apps: [
    {
      name: "yt-director",
      script: "node_modules/.bin/next",
      // Pick a port that's free on your server (your existing app already
      // owns one, e.g. 3000) and reuse the same port in the Cloudflare
      // Tunnel ingress rule for this app.
      args: "start -p 3001",
      cwd: __dirname,
      exec_mode: "cluster",
      instances: 2,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
