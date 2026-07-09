# Deployment runbook (AWS EC2 Ubuntu, IP-only)

This app is deployed as: nginx serving the built React app + reverse-proxying `/api/*`
to a Fastify process managed by systemd, with a SQLite database file living outside
the code directory. There is no Docker and no TLS yet — TLS/a domain can be added
later (see the note at the bottom) without any application code changes.

## Prerequisites on the VM

- Ubuntu (any version with systemd), t2/t3.micro or larger.
- Security group: allow port 22 (SSH, ideally restricted to your IP) and port 80
  (HTTP, open) inbound.

## First deploy

Run these as a user with `sudo`.

```bash
# 1. System packages
sudo apt update
sudo apt install -y nginx sqlite3 git

# 2. Node.js 22+ (needed for the built-in node:sqlite module)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Dedicated system user + directories
sudo useradd -r -m -d /opt/vocab-app -s /usr/sbin/nologin vocab-app
sudo mkdir -p /var/lib/vocab-app/backups /etc/vocab-app
sudo chown -R vocab-app:vocab-app /var/lib/vocab-app

# 4. Get the code
sudo -u vocab-app git clone <YOUR_GITHUB_REPO_URL> /opt/vocab-app/current
cd /opt/vocab-app/current

# 5. Install deps and build everything (shared package, API, web)
sudo -u vocab-app npm ci
sudo -u vocab-app npm run build

# 6. Secrets -- generate the random values first, then write the file (an
# unquoted heredoc would work too, but generating them as variables first
# means you can echo/verify them before they're written to disk).
ACCESS_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET_VAL=$(openssl rand -hex 32)

sudo tee /etc/vocab-app/api.env > /dev/null <<EOF
NODE_ENV=production
PORT=3000
DB_PATH=/var/lib/vocab-app/vocab.db
JWT_ACCESS_SECRET=$ACCESS_SECRET
JWT_REFRESH_SECRET=$REFRESH_SECRET
COOKIE_SECRET=$COOKIE_SECRET_VAL
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=http://YOUR_VM_PUBLIC_IP
EOF
sudo chown vocab-app:vocab-app /etc/vocab-app/api.env
sudo chmod 640 /etc/vocab-app/api.env

# 7. Create the database and run migrations
# (run as vocab-app so it can read the 640-permissioned env file, and source
# it into the shell since this is a one-off command outside of systemd)
sudo -u vocab-app bash -c '
  set -a
  source /etc/vocab-app/api.env
  set +a
  cd /opt/vocab-app/current
  npm run db:migrate -w apps/api
'

# 8. systemd service
sudo cp infra/systemd/vocab-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vocab-api
sudo systemctl status vocab-api   # should say "active (running)"

# 9. nginx
sudo cp infra/nginx/vocab-app.conf /etc/nginx/sites-available/vocab-app
sudo ln -s /etc/nginx/sites-available/vocab-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 10. Daily SQLite backup
sudo crontab -u vocab-app -e
# add this line:
# 0 3 * * * /usr/bin/bash /opt/vocab-app/current/infra/scripts/backup-db.sh
```

Then open `http://<VM_PUBLIC_IP>` in a browser, register an account, and confirm
the flashcards/list/quiz flow works and progress survives a page reload.

## Redeploying after a code change

```bash
cd /opt/vocab-app/current
sudo -u vocab-app git pull
sudo -u vocab-app npm ci
sudo -u vocab-app npm run build
sudo -u vocab-app bash -c '
  set -a
  source /etc/vocab-app/api.env
  set +a
  cd /opt/vocab-app/current
  npm run db:migrate -w apps/api   # no-op if no new migrations
'
sudo systemctl restart vocab-api
sudo systemctl reload nginx        # only if nginx.conf changed
```

## Adding a domain + TLS later

Once you have a domain pointed at the VM's IP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

Certbot edits the nginx config to add the HTTPS server block and redirect — update
`server_name` in `infra/nginx/vocab-app.conf` to your domain first (or just let
certbot's interactive prompt do it), and update `CORS_ORIGIN` in
`/etc/vocab-app/api.env` to `https://your-domain.example`, then
`sudo systemctl restart vocab-api`.

## Not built yet (intentionally, for v1)

- Docker / CI-CD: not needed for a single small VM with one deployer; add later if
  that changes.
- Sign in with Apple: the `users` table already has a nullable `password_hash` and
  an `auth_provider` column so this is an additive change, not a rewrite.
