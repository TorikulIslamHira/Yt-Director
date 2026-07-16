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
sudo apt-get install -y nodejs git build-essential python3
sudo npm install -g pm2
```

`build-essential`/`python3` are needed because the app uses `better-sqlite3`
(a native module compiled via node-gyp during `npm ci`) for its local
project database — everything the app persists (script text, generated
scenes, BGM tracks) lives in `data/` at the repo root, a plain SQLite file
plus generated `.mp3`s. That directory is git-ignored and excluded from the
deploy workflow's checkout-clean step (see `.github/workflows/deploy.yml`),
so it survives every deploy — just make sure the runner's user can write to
`data/` (it's created automatically on first run).

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

## 3. API keys, first-time app checkout, and PM2 start

The app is multi-user (added 2026-07-16): every signed-up user adds their
**own** Gemini/Groq/Pexels/Pixabay/Telegram keys from the in-app Settings
page (encrypted at rest), so one user's usage never touches another's
quota or bill. `GEMINI_API_KEY`/`GROQ_API_KEY`/`PEXELS_API_KEY`/
`PIXABAY_API_KEY`/`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` env vars are
**not read at runtime anymore** — they only matter once, as a one-time
seed for the bootstrapped admin account (see below).

Go to `Settings` → `Secrets and variables` → `Actions` → `New repository
secret` on GitHub and add:

```
API_KEY_ENCRYPTION_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
```

`API_KEY_ENCRYPTION_SECRET` encrypts every user's saved API keys at rest
(AES-256-GCM, `src/lib/crypto.ts`). Generate it **once** with
`openssl rand -hex 32` and never rotate it — rotating makes every already-
saved key undecryptable for every user.

`ADMIN_EMAIL`/`ADMIN_PASSWORD` only matter on the very first boot after
this feature shipped: if the `users` table is empty, the app creates that
one account, hands it every project that existed before multi-user support,
and — if `GEMINI_API_KEY`/`GROQ_API_KEY`/`PEXELS_API_KEY`/`PIXABAY_API_KEY`/
`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` secrets are *also* still set at that
moment — seeds that admin's own API keys from them (`src/db/client.ts`,
`bootstrapAdmin`). It's a no-op on every boot after the first, so these can
stay in secrets harmlessly or be removed once you've confirmed you can log
in. Anyone else creates their own account from `/signup` and adds their own
keys from `/settings` — nothing else needs to be shared.

The deploy workflow's "Write .env from GitHub Secrets" step regenerates
`.env` from all of these on **every** deploy — rotating a value is just
updating the GitHub Secret and pushing/re-running the workflow, never SSH.
(The `clean-exclude` on `.env*` is still there as a safety net, but the
write step means it's no longer load-bearing for normal operation.)

The runner keeps its working directory between runs (it's not wiped like
GitHub-hosted runners), so the checkout persists and becomes your deploy
directory:

```bash
cd actions-runner/_work/Yt-Director/Yt-Director   # created after the first workflow run
```

Push any commit to `main` once — the workflow checks the repo out here,
writes `.env` from the secrets above, and builds it automatically. Then,
one time only, start the PM2 process from that same directory:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it prints, so PM2 survives a reboot
```

### Forgot password

No email-sending service is configured, so there's no self-serve "forgot
password" link. If a user forgets their password, reset it yourself directly
on the server (`scripts/reset-password.mjs`) — it also logs the user out of
every existing session:

```bash
cd actions-runner/_work/Yt-Director/Yt-Director
npm run reset-password -- user@example.com newPassword123
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
