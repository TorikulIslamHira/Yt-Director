# Production Server Setup (one-time)

This guide sets up a fresh Ubuntu VPS to host YT-Director with zero-downtime
deploys triggered by `.github/workflows/deploy.yml` on every push to `main`.

## 1. Install Node.js, PM2, nginx, git

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2
```

## 2. Create a deploy user (recommended) and SSH key for GitHub Actions

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy   # optional, only if it needs sudo
su - deploy
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/gh_actions_key -N ""
cat ~/.ssh/gh_actions_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/gh_actions_key   # copy this PRIVATE key -> GitHub secret DEPLOY_SSH_KEY
```

## 3. Clone the repo

```bash
mkdir -p /var/www/yt-director
cd /var/www/yt-director
git clone https://github.com/TorikulIslamHira/Yt-Director.git .
cd YT-Director
```

## 4. Create the production `.env` (never committed to git)

```bash
nano .env
```

Fill in whatever the app needs at runtime:

```
GEMINI_API_KEY=...
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
LOUDLY_API_KEY=...
```

## 5. First build and start with PM2

```bash
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it prints, so PM2 survives a reboot
```

`ecosystem.config.js` runs 2 cluster instances, so `pm2 reload` (used by the
deploy workflow) restarts one instance at a time — the other keeps serving
traffic, giving zero-downtime deploys.

## 6. nginx reverse proxy

`/etc/nginx/sites-available/yt-director`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/yt-director /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Optional HTTPS: `sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d your-domain.com`

## 7. Add GitHub repo secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret            | Value                                              |
|-------------------|-----------------------------------------------------|
| `DEPLOY_HOST`     | Server IP or domain                                  |
| `DEPLOY_USER`     | `deploy`                                             |
| `DEPLOY_SSH_KEY`  | Contents of `~/.ssh/gh_actions_key` (private key)    |
| `DEPLOY_PATH`     | `/var/www/yt-director/YT-Director`                   |
| `DEPLOY_PORT`     | `22` (optional, only if not the default port)        |

## Done

From now on: work on `Dev`, merge `Dev` into `main` when ready. The moment
`main` is updated, GitHub Actions SSHes into the server, pulls the new code,
rebuilds, and does a zero-downtime `pm2 reload`.
