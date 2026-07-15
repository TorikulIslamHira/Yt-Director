# Production Server Setup (one-time)

Your server is local (no public IP) and already exposes an existing app
through a Cloudflare Tunnel. GitHub's cloud runners can't SSH into a machine
with no public IP, so instead of SSH we use a **self-hosted GitHub Actions
runner**: a small agent you install once on this machine. It only makes
*outbound* connections to GitHub — no port needs to be opened, and it doesn't
touch your existing Cloudflare Tunnel setup for the other app.

Every push to `main` then runs directly on this machine and does a
zero-downtime `pm2 reload`.

## 1. Install Node.js, PM2, git (skip whatever you already have for the existing app)

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
```

## 2. Install the self-hosted GitHub Actions runner

1. Go to: `https://github.com/TorikulIslamHira/Yt-Director` → **Settings** →
   **Actions** → **Runners** → **New self-hosted runner** → pick Linux/macOS
   matching your machine.
2. GitHub shows you a short set of commands with a **registration token**
   baked in (valid ~1 hour, unique to you — don't reuse the example below).
   Run them on the server, e.g.:

```bash
mkdir actions-runner && cd actions-runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/vX.X.X/actions-runner-linux-x64-X.X.X.tar.gz
tar xzf actions-runner.tar.gz
./config.sh --url https://github.com/TorikulIslamHira/Yt-Director --token <TOKEN_FROM_GITHUB_PAGE>
```

3. Install it as a persistent background service so it survives reboots and
   keeps polling GitHub for jobs:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

Confirm it shows up as "Idle" under Settings → Actions → Runners.

## 3. First-time app checkout, `.env`, and PM2 start

The runner keeps its working directory between runs (it's not wiped like
GitHub-hosted runners), so the checkout persists and becomes your deploy
directory.

```bash
cd actions-runner/_work/Yt-Director/Yt-Director/YT-Director   # created after the first workflow run
```

To create it right away rather than waiting for the first push, just push
any commit to `main` once — the workflow will check the repo out here
automatically. Then:

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

```bash
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it prints, so PM2 survives a reboot
```

`ecosystem.config.js` runs 2 cluster instances on port 3001, so `pm2 reload`
(used by the deploy workflow) restarts one instance at a time — the other
keeps serving traffic, giving zero-downtime deploys. From now on, every push
to `main` reuses this same PM2 process via `pm2 reload`; you don't need to
run `pm2 start` again.

## 4. Expose it through your existing Cloudflare Tunnel

Edit your tunnel's config (commonly `~/.cloudflared/config.yml`) and add a
new ingress rule alongside your existing app's rule — don't remove the
existing one:

```yaml
ingress:
  - hostname: your-existing-app-domain.com
    service: http://localhost:3000   # your existing app, unchanged
  - hostname: ytdirector.your-domain.com
    service: http://localhost:3001   # matches the port in ecosystem.config.js
  - service: http_status:404
```

Then point DNS at the tunnel for the new hostname and restart cloudflared:

```bash
cloudflared tunnel route dns <YOUR_TUNNEL_NAME> ytdirector.your-domain.com
sudo systemctl restart cloudflared
```

## Done

From now on: work on `Dev`, merge `Dev` into `main` when ready. The moment
`main` is updated, the self-hosted runner on your machine picks up the job,
rebuilds, and does a zero-downtime `pm2 reload` — no SSH, no manual steps.
