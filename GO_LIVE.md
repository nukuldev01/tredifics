# Tredific® — Go-Live Runbook (Hostinger VPS · tredific.com)

This is the canonical step-by-step for taking the production-hardened
codebase and deploying it on a fresh Hostinger Ubuntu 22 VPS.

> **What I produced for you (in this repo):** every config file, hardening
> setting, deploy/backup/firewall script, and Nginx/systemd/.env template
> needed for a clean go-live.
>
> **What only you can do:** SSH into your VPS, point DNS, paste real
> Razorpay live keys / Gmail App Password into `.env`, and run the scripts.
> I cannot remotely access your server, and I won't take or paste your
> production secrets — they belong only on your machine.

---

## 0. What's in this repo (deliverables)

```
tredfits/
├── README.md                       # project + dev quick start
├── DEPLOYMENT.md                   # extended deploy reference
├── GO_LIVE.md                      # ← THIS FILE (runbook)
├── CHANGES.md                      # diff of every update pass
├── deploy/
│   ├── jail.local                  # fail2ban SSH brute-force jail
│   ├── nginx/tredific.conf         # final Nginx server blocks
│   └── systemd/
│       ├── tredific-api.service    # Gunicorn unit
│       └── tredific-web.service    # Next.js unit
├── scripts/
│   ├── deploy.sh                   # zero-downtime deploy
│   ├── backup.sh                   # daily pg_dump + media tar
│   ├── restore.sh                  # restore from backup
│   └── firewall.sh                 # one-time UFW setup
├── backend/
│   ├── .env.example                # dev env
│   ├── .env.production.example     # production env template
│   └── ...
└── frontend/
    ├── .env.local.example          # dev env
    ├── .env.production.example     # production env template
    └── ...
```

---

## 1. Server initialization

SSH into the VPS as root, then:

```bash
# 1.1 Create a non-root user
adduser tredific && usermod -aG sudo tredific
rsync --archive --chown=tredific:tredific ~/.ssh /home/tredific  # copy SSH key
su - tredific

# 1.2 Update + base packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip \
                    postgresql postgresql-contrib nginx git \
                    build-essential libpq-dev curl ufw fail2ban

# 1.3 Node.js 20 (for Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Firewall + SSH hardening

```bash
cd ~ && git clone https://github.com/<you>/tredific.git && cd tredific

# Open only 22/80/443
bash scripts/firewall.sh

# Brute-force protection on SSH
sudo cp deploy/jail.local /etc/fail2ban/jail.local
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd

# Disable password SSH (only after confirming key login works!)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload ssh
```

---

## 3. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE tredific;
CREATE USER tredific WITH PASSWORD 'CHANGE_THIS_TO_A_STRONG_PASSWORD';
ALTER ROLE tredific SET client_encoding TO 'utf8';
ALTER ROLE tredific SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE tredific TO tredific;
\c tredific
GRANT ALL ON SCHEMA public TO tredific;
SQL
```

Tighten Postgres `pg_hba.conf` so only local `127.0.0.1` / `::1`
connections require a password (default on Ubuntu — verify).

---

## 4. DNS

In your domain registrar's panel, point **all** of these at your VPS IP:

| Record | Value |
|---|---|
| `A`     `tredific.com`         | `<your-vps-ip>` |
| `A`     `www.tredific.com`     | `<your-vps-ip>` |
| `A`     `api.tredific.com`     | `<your-vps-ip>` |

Wait until `dig +short tredific.com` returns the IP before proceeding to SSL.

---

## 5. Backend deploy

```bash
cd ~/tredific/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.production.example .env
nano .env
# Fill in every value — see "Environment variables checklist" below.

mkdir -p logs media staticfiles
python manage.py migrate
python manage.py seed_catalog
python manage.py import_products /path/to/tredfit_products_info.xlsx
python manage.py createsuperuser
python manage.py collectstatic --noinput

# Verify (still as venv)
python manage.py check --deploy
```

---

## 6. Frontend deploy

```bash
cd ~/tredific/frontend
cp .env.production.example .env.local
nano .env.local
# NEXT_PUBLIC_API_URL=https://api.tredific.com
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
# NEXT_PUBLIC_SITE_URL=https://tredific.com

npm ci
npm run build
```

Drop your **logo PNG** at `frontend/public/logo.png` (and the favicon
files) before the build, so they get bundled.

---

## 7. systemd services

```bash
sudo cp ~/tredific/deploy/systemd/tredific-api.service /etc/systemd/system/
sudo cp ~/tredific/deploy/systemd/tredific-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tredific-api tredific-web
sudo systemctl status tredific-api tredific-web
```

If anything errors, check logs:

```bash
journalctl -u tredific-api -n 60 --no-pager
journalctl -u tredific-web -n 60 --no-pager
```

---

## 8. Nginx + SSL

```bash
sudo cp ~/tredific/deploy/nginx/tredific.conf /etc/nginx/sites-available/tredific
sudo ln -sf /etc/nginx/sites-available/tredific /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free Let's Encrypt SSL (this also adds www→apex + HTTP→HTTPS redirects
# and the 443 server blocks).
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
    -d tredific.com -d www.tredific.com -d api.tredific.com \
    --non-interactive --agree-tos -m Tredific@gmail.com --redirect

# Auto-renewal is already configured by certbot. Verify:
sudo certbot renew --dry-run
```

---

## 9. Razorpay live config

In the Razorpay Dashboard (`dashboard.razorpay.com`):

1. **Settings → API Keys → Live mode → Generate Live Keys**.
   Paste them into `backend/.env` as `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET`, and `frontend/.env.local` as
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

2. **Settings → International Payments → Enable** USD, GBP, CAD.

3. **Settings → Webhooks → Add new webhook**:
   - URL: `https://api.tredific.com/api/payments/webhook/`
   - Active events: `payment.captured`, `payment.failed`,
     `refund.processed`
   - Secret: generate a strong random string, set it as
     `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`.

4. Redeploy: `sudo systemctl restart tredific-api`

5. Test with a ₹1 test payment from the live storefront. Check
   the order in `/admin/`, and verify a `PaymentEvent` row is
   recorded with `event=webhook.paid`.

---

## 10. Email — Gmail SMTP

1. Sign in to `Tredific@gmail.com`, enable **2-Step Verification**.
2. Visit `myaccount.google.com/apppasswords` → generate a 16-char
   App Password named "Tredific Server".
3. Paste it into `backend/.env` as `EMAIL_HOST_PASSWORD` (no spaces).
4. Restart the API: `sudo systemctl restart tredific-api`.
5. Verify by triggering an OTP from `https://tredific.com/account` —
   you should receive the code within seconds.

Gmail's daily send limit is ~500/day; if you outgrow it switch to
Zoho Mail or a transactional provider (Resend, Postmark) by changing
`EMAIL_BACKEND` and the SMTP host.

---

## 11. Backups

```bash
# One-off test
bash ~/tredific/scripts/backup.sh
ls -la /var/backups/tredific/

# Daily cron at 03:00 server time
sudo crontab -e -u tredific
# Add:
0 3 * * * /home/tredific/tredific/scripts/backup.sh >> /var/log/tredific-backup.log 2>&1

# (Optional) Off-site: install rclone, configure a remote, then set
# BACKUP_REMOTE=<rclone-remote-name>:tredific-backups in backend/.env.
```

Restore in disaster:

```bash
bash ~/tredific/scripts/restore.sh 20260507-030000
```

---

## 12. Final QA (do this AFTER step 8 succeeds)

| Flow | Check |
|---|---|
| Storefront loads | `https://tredific.com` returns 200, no console errors |
| Collection page | `/collections/all` shows products, filters work, sort works |
| Product page | Image gallery, size chart modal opens, sticky ATC on mobile |
| Cart | Add → adjust qty → remove → persists across reload |
| Checkout | Country switch shows IN/US/GB/CA shipping rates in correct currency |
| Razorpay | Place a ₹1 live test order — payment succeeds, order shows Confirmed in admin |
| Webhook | Visit /admin/payments/paymentevent/ — event chain matches the order |
| Auth | Signup, login, OTP all work; rate limit blocks after the 20th rapid signup |
| Account | Order history + addresses load |
| CMS | All 11 policy pages render with sticky TOC |
| WhatsApp | Floating button → wa.me opens with prefilled message |
| Trademark | Footer link downloads `tredific-trademark-certificate.pdf` |
| Reviews | Homepage Google Reviews carousel scrolls + GMB link works |
| SEO | `/sitemap.xml` and `/robots.txt` return 200; product pages have JSON-LD |
| Mobile | iPhone Safari + Android Chrome — header, drawer, sticky ATC, footer |
| HTTPS | All requests redirect to https; HSTS header present |
| Admin | `https://api.tredific.com/admin/` works; staff can edit products + orders |

---

## 13. Search Console submission

1. `https://search.google.com/search-console` → **Add property** →
   choose *Domain* → enter `tredific.com` → verify via DNS TXT.
2. **Sitemaps** → submit `https://tredific.com/sitemap.xml`.
3. **URL inspection** → fetch the homepage → request indexing.
4. Repeat for Bing Webmaster Tools (`bing.com/webmasters`) for
   double coverage.

---

## 14. Environment variables checklist

`backend/.env`:

- [ ] `SECRET_KEY` (60+ random chars)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS=tredific.com,www.tredific.com,api.tredific.com`
- [ ] `DATABASE_URL=postgres://...`
- [ ] `CORS_ALLOWED_ORIGINS=https://tredific.com,https://www.tredific.com`
- [ ] `CSRF_TRUSTED_ORIGINS=https://tredific.com,https://www.tredific.com,https://api.tredific.com`
- [ ] `FRONTEND_URL=https://tredific.com`
- [ ] `RAZORPAY_KEY_ID` (live)
- [ ] `RAZORPAY_KEY_SECRET` (live)
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `EMAIL_HOST_USER=Tredific@gmail.com`
- [ ] `EMAIL_HOST_PASSWORD` (Google App Password)
- [ ] `DEFAULT_FROM_EMAIL=Tredific <Tredific@gmail.com>`
- [ ] `SENTRY_DSN` (optional)

`frontend/.env.local`:

- [ ] `NEXT_PUBLIC_API_URL=https://api.tredific.com`
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...`
- [ ] `NEXT_PUBLIC_SITE_URL=https://tredific.com`

---

## 15. Day-2 operations

### Deploy an update

```bash
cd ~/tredific && bash scripts/deploy.sh
```

Pulls latest, runs migrations, collectstatic, rebuilds Next, restarts
services, runs a health check.

### Restart services

```bash
sudo systemctl restart tredific-api    # Django/Gunicorn
sudo systemctl restart tredific-web    # Next.js
sudo systemctl reload nginx
```

### View logs

```bash
journalctl -u tredific-api -f          # live API logs
journalctl -u tredific-web -f          # live storefront logs
tail -f ~/tredific/backend/logs/django.log
sudo tail -f /var/log/nginx/access.log
```

### SSL renewal

Certbot installs a systemd timer automatically. Verify:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### Monitoring

- `htop` — CPU/RAM at a glance
- `df -h` — disk usage
- `systemctl status tredific-api tredific-web` — service health
- `/healthz` returns "ok" — wire to UptimeRobot or Hostinger's monitor
- Sentry (if configured) auto-captures unhandled exceptions

---

## 16. Final URLs

| Purpose | URL |
|---|---|
| Storefront | `https://tredific.com` |
| Storefront (www) | `https://www.tredific.com` (redirects to apex) |
| API | `https://api.tredific.com/api/` |
| Admin | `https://api.tredific.com/admin/` |
| Health | `https://api.tredific.com/healthz` |
| Sitemap | `https://tredific.com/sitemap.xml` |
| Robots | `https://tredific.com/robots.txt` |
| Trademark | `https://tredific.com/tredific-trademark-certificate.pdf` |

---

## 17. Known limitations / follow-ups

- **Logo PNG and favicon** still need to be dropped into
  `frontend/public/`. Until then, `<Brand />` renders the wordmark in
  serif type with a superscript ®.
- **Currency conversion** uses static rates in
  `frontend/lib/currency.ts`. Swap for a daily-cached live FX feed for
  perfect accuracy.
- **Razorpay settlement** is in INR. Your customers' banks convert
  USD/GBP/CAD to INR at their card rate. If you need true USD/GBP/CAD
  settlement, request International Card Settlement on your Razorpay
  account.
- **Google Reviews** widget shows curated highlights with a deep-link
  to your Google Business Profile. Wire to the Google Places API
  (paid) for live pulls if needed.
- **Email templates** are plain-text. Move to HTML transactional
  templates via Resend / Postmark when ready.
- **Spec's full custom CMS admin panel** (blog manager, web stories,
  sitemap visual editor, redirect manager, image alt audit, etc.) is
  out of scope for the MVP — Django admin covers core operations
  (products, variants, orders, content pages, shipping, payments).
- **Sentry SDK** is installed but inert until you set `SENTRY_DSN`.

---

## 18. What I cannot do for you

I can't actually run the deploy from this environment — I have no SSH
access to your VPS and I don't accept your live secrets here.
**Run steps 1–11 yourself** (or have a sysadmin run them) and the
codebase + scripts I've shipped will take care of every other detail.

If you hit a specific error during go-live, paste the failing command
+ output here and I'll diagnose it. I just cannot type your Razorpay
key, your Gmail App Password, or your DB password into your terminal —
those stay with you.
