# Tredific® — Deployment Guide (Hostinger VPS)

Target: Ubuntu 22.04 LTS VPS on Hostinger, with a public domain pointing at it.

## 0. Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Nginx (80/443, Let's Encrypt)                             │
│   ├─ tredific.com           → Next.js (port 3000)          │
│   └─ api.tredific.com       → Gunicorn → Django (port 8000)│
└────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
   PostgreSQL                       Static / media
   (port 5432, local)               served by Whitenoise
```

You can host both apps on the same VPS for the launch and split later.

## 1. VPS prep

```bash
ssh root@your-vps-ip
adduser tredific && usermod -aG sudo tredific
su - tredific

sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip \
                    postgresql postgresql-contrib nginx git \
                    build-essential libpq-dev curl

# Node 20 for Next.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE tredific;
CREATE USER tredific WITH PASSWORD 'change-this-strong-password';
ALTER ROLE tredific SET client_encoding TO 'utf8';
ALTER ROLE tredific SET default_transaction_isolation TO 'read committed';
ALTER ROLE tredific SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE tredific TO tredific;
\c tredific
GRANT ALL ON SCHEMA public TO tredific;
SQL
```

## 3. Pull the code

```bash
cd ~
git clone https://github.com/<you>/tredific.git
cd tredific
```

## 4. Backend

```bash
cd ~/tredific/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — see "Environment variables" section below
nano .env

python manage.py migrate
python manage.py seed_catalog
python manage.py import_products /path/to/tredfit_products_info.xlsx
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### Gunicorn systemd service

`/etc/systemd/system/tredific-api.service`:

```ini
[Unit]
Description=Tredific Django API
After=network.target

[Service]
User=tredific
Group=www-data
WorkingDirectory=/home/tredific/tredific/backend
EnvironmentFile=/home/tredific/tredific/backend/.env
ExecStart=/home/tredific/tredific/backend/.venv/bin/gunicorn \
          --workers 3 --timeout 60 \
          --bind 127.0.0.1:8000 tredific.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tredific-api
sudo systemctl status tredific-api
```

## 5. Frontend

```bash
cd ~/tredific/frontend
npm ci
cp .env.local.example .env.local
nano .env.local
# Set:
#   NEXT_PUBLIC_API_URL=https://api.tredific.com
#   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
#   NEXT_PUBLIC_SITE_URL=https://tredific.com

npm run build
```

### Next systemd service

`/etc/systemd/system/tredific-web.service`:

```ini
[Unit]
Description=Tredific Next.js storefront
After=network.target

[Service]
User=tredific
WorkingDirectory=/home/tredific/tredific/frontend
EnvironmentFile=/home/tredific/tredific/frontend/.env.local
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tredific-web
```

## 6. Nginx + SSL

`/etc/nginx/sites-available/tredific`:

```nginx
server {
    server_name tredific.com www.tredific.com;
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
}

server {
    server_name api.tredific.com;
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/tredific/tredific/backend/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /home/tredific/tredific/backend/media/;
        expires 30d;
    }

    listen 80;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tredific /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tredific.com -d www.tredific.com -d api.tredific.com
```

## 7. Razorpay

In the Razorpay Dashboard:

1. Generate live keys → set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in
   `backend/.env` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `frontend/.env.local`.
2. Settings → International Payments → enable USD, GBP, CAD.
3. Settings → Webhooks → add `https://api.tredific.com/api/payments/webhook/`
   with a strong secret. Subscribe to `payment.captured`, `payment.failed`,
   `refund.processed`. Set the same secret in `RAZORPAY_WEBHOOK_SECRET`.

## 8. Environment variables

### `backend/.env`

```
SECRET_KEY=                     # generate: python -c "import secrets;print(secrets.token_urlsafe(60))"
DEBUG=False
ALLOWED_HOSTS=tredific.com,www.tredific.com,api.tredific.com
DATABASE_URL=postgres://tredific:STRONG_PASSWORD@localhost:5432/tredific

CORS_ALLOWED_ORIGINS=https://tredific.com,https://www.tredific.com
FRONTEND_URL=https://tredific.com

RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=Tredific@gmail.com
EMAIL_HOST_PASSWORD=app-password-from-google
DEFAULT_FROM_EMAIL=Tredific <Tredific@gmail.com>
```

### `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=https://api.tredific.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://tredific.com
```

## 9. Production checklist

- [ ] `DEBUG=False`, ALLOWED_HOSTS set, strong SECRET_KEY
- [ ] Postgres running and reachable; daily `pg_dump` backup cron
- [ ] HTTPS via Let's Encrypt; certbot auto-renew tested
- [ ] CORS limited to your domain only
- [ ] Razorpay live keys + webhook secret set, test order works
- [ ] WhatsApp button reaches the right number
- [ ] Trademark PDF accessible at `/tredific-trademark-certificate.pdf`
- [ ] About / Returns / Shipping / FAQ / T&C / Privacy all populated
- [ ] `/sitemap.xml` returns valid XML, `/robots.txt` correct
- [ ] Product schema JSON-LD valid via Google Rich Results test
- [ ] Email SMTP works (placed test order receives confirmation)
- [ ] Admin password is strong; only operations team has access
- [ ] Logo dropped into `frontend/public/logo.png` and the favicon set
- [ ] Set up Cloudflare or other CDN in front of the VPS for cache + DDoS

## 10. Deploy updates

```bash
# Backend
cd ~/tredific/backend
git pull
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart tredific-api

# Frontend
cd ~/tredific/frontend
git pull
npm ci
npm run build
sudo systemctl restart tredific-web
```

## 11. Importing products from Excel later

```bash
cd ~/tredific/backend
source .venv/bin/activate
python manage.py import_products /path/to/sheet.xlsx
# or to wipe and reload:
python manage.py import_products --reset /path/to/sheet.xlsx
# or test a small subset:
python manage.py import_products --limit 100 /path/to/sheet.xlsx
```

The importer is **idempotent**: running with the same sheet won't duplicate
products. Existing products with the same slug are updated in place; their
images and variants are wiped and rebuilt to match the latest sheet.

## 12. Admin credentials setup

```bash
cd ~/tredific/backend
source .venv/bin/activate
python manage.py createsuperuser
```

Login at `https://api.tredific.com/admin/` and use it to:

- Create staff users with limited permissions (avoid sharing the superuser).
- Edit products, variants, orders.
- Update content pages (About, T&C, Returns, Shipping, FAQ, etc.).
- Manage shipping rates per country.
- View order status and update Pending → Confirmed → Shipped → Delivered.
- Audit Razorpay payment events.

## 13. Known limitations / follow-ups

- **Logo:** drop `frontend/public/logo.png` (and `favicon.ico`,
  `apple-touch-icon.png`) — the `<Brand />` component currently renders the
  brand name in serif type with a superscript ®. Switch it to render an
  `<img>` once your brand mark PNG is ready.
- **Currency conversion** uses static rates in `frontend/lib/currency.ts`.
  Replace with a daily-cached live FX feed for production accuracy.
- **Google Reviews carousel** uses curated highlights. Wire to the Google
  Places "Place Details" API later if you want live review pulls (paid).
- **Email templates** are plain-text via Django's email backend. Move to
  HTML templates (Postmark, Resend, etc.) for branded transactional emails.
- **Spec's full custom CMS admin panel** (blog manager, web stories, sitemap
  visual editor, redirect manager, image alt audit, etc.) is intentionally
  scoped out of the MVP — Django admin covers core operations.
