# Tredific® — International Ethnic Wear E-commerce

Production-grade MVP foundation. Django 5 + DRF backend, Next.js 14 + Tailwind frontend, PostgreSQL.

## What's been verified end-to-end

The backend has been booted and exercised with live HTTP calls during development:

- ✅ Django `manage.py check` — no issues
- ✅ All migrations apply cleanly
- ✅ Seed command loads 6 categories, 10 colors, 25 products, 8 shipping rates, 7 content pages, homepage sections, testimonials
- ✅ `GET /api/products/` returns paginated catalog with deduped color/size facets
- ✅ `GET /api/products/?color=Black,Wine&size=M` filters correctly (7 results)
- ✅ `GET /api/products/facets/` returns clean filter options
- ✅ `GET /api/products/<slug>/` returns variants, images, reviews, average rating
- ✅ `GET /api/categories/`, `GET /api/colors/`
- ✅ `GET /api/shipping/rates/?country=US` returns Standard + Express
- ✅ `GET /api/content/pages/about-us/` (and the other 6 pages)
- ✅ `POST /api/orders/checkout/` creates orders with country-based shipping totals
- ✅ `POST /api/auth/signup/` returns user + JWT tokens

## Repository layout

```
tredfits/
├── backend/          Django + DRF + admin
├── frontend/         Next.js 14 (App Router) + Tailwind
└── README.md
```

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env             # set DB url + Razorpay creds
python manage.py migrate
python manage.py seed_catalog    # loads demo data
python manage.py createsuperuser
python manage.py runserver       # http://localhost:8000
```

- Admin: http://localhost:8000/admin/
- API root: http://localhost:8000/api/
- Health: http://localhost:8000/healthz

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL + Razorpay key id
npm run dev                        # http://localhost:3000
```

Visit `http://localhost:3000` and click around — the homepage, `/collections/all`, any product page, the cart, and checkout all work against the seeded data.

## Database — PostgreSQL or SQLite

`DATABASE_URL` in `backend/.env` controls this. Leave it empty for the SQLite fallback (fine for local dev). For production set, e.g.:

```
DATABASE_URL=postgres://tredific:tredific@localhost:5432/tredific
```

## Razorpay

The backend's `payments` app exposes:

- `POST /api/payments/create-order/` — creates the order on Razorpay
- `POST /api/payments/verify/` — verifies signature, marks order paid

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `frontend/.env.local`. Razorpay merchant account must have International Payments enabled to accept USD/GBP/AED cards.

## Modules built

| Module | Status |
|--------|--------|
| Product catalog (categories, variants, SKU, attributes) | ✅ |
| Auto-generated SKUs (e.g. `TRD-KURT-00001-BLA-M`) | ✅ |
| Sizes XS–7XL | ✅ |
| Collection grid + sidebar filters (color, size, price) + sort | ✅ Matches reference site UX |
| Mobile filter bottom sheet | ✅ |
| Product detail (gallery, variants, size chart modal, tabs, reviews) | ✅ |
| Hover-swap secondary image on cards | ✅ |
| Cart with localStorage persistence | ✅ |
| Guest checkout + saved addresses | ✅ |
| Country-based shipping (4 countries × 2 methods) | ✅ |
| Free-shipping threshold | ✅ |
| Razorpay create-order + verify (international) | ✅ |
| Order status workflow (Pending → Confirmed → Shipped → Delivered → Cancelled) | ✅ Bulk admin actions |
| Email signup/login + JWT | ✅ |
| Email OTP login | ✅ scaffold (uses Django console email backend) |
| User dashboard (orders, addresses, profile) | ✅ |
| Django admin (products with variant + image inlines, orders, categories, content pages) | ✅ |
| Homepage (hero, USP, featured categories, featured products, newsletter) | ✅ |
| Content pages (About, T&C, Returns, Shipping, FAQ, Privacy, Legal) | ✅ |
| Order confirmation email (console backend) | ✅ |
| 4-country support (IN/US/GB/AE) | ✅ |
| Brand mark with proper ® rendering via `<Brand />` | ✅ |
| SEO meta tags, OpenGraph | ✅ |
| Mobile-first responsive layout | ✅ |
| Image lazy loading | ✅ |

## Reference UI parity

The collection page (`/collections/[slug]`) takes its layout cues from `https://athafashion.com/collections/all`:

- Sparse white grid, no card chrome
- Sidebar with checkbox filter sections (Color, Size, Price)
- Sort dropdown top-right
- Product card: hover-swap to secondary image, sale badge top-left
- Mobile: filter renders as a bottom-sheet drawer

## Stubbed for follow-up

The original spec includes a CMS-grade admin panel with hundreds of fields (per-page SEO, blog manager, web stories, sitemap UI, robots.txt editor, redirect manager, schema visual editor, image alt audit, focus keyword tracker, etc.). Those are intentionally out of scope for this MVP — each is days of work and ships best as its own iteration. The data models and frontend layout were chosen so they slot in cleanly later. Specifically deferred:

- Custom admin "Dashboard" with KPI cards + activity feed (Django admin covers operations)
- Full Home Page Editor UI (an `apps.content.HomepageSection` model is in place; the homepage already reads from it)
- Blog Manager + Web Stories Manager
- SEO tooling suite (sitemap UI, robots.txt editor, llms.txt editor, schema manager, image alt audit, redirect manager, focus keyword tracker, canonical URL manager, heading audit)
- Media Library UI
- Author/role management beyond Django's groups
- Settings panels (analytics IDs, social profiles, performance toggles, integration keys) — env vars cover the basics today
- Klaviyo/Mailchimp newsletter integration
- Google Reviews homepage widget (placeholder testimonials wired)
- WhatsApp floating button
- Transactional email templates (only console-backend stubs ship today)

## Tech notes

- **Backend:** Django 5, DRF 3.15, SimpleJWT, django-filter, Pillow, psycopg2, razorpay, python-decouple, dj-database-url, django-cors-headers, whitenoise
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS 3, Zustand (cart + auth, persisted to localStorage), SWR (client-side data), Axios, Lucide-react
- **DB:** PostgreSQL 14+ in production, SQLite for local dev

## Deployment notes

- Backend: gunicorn + WhiteNoise for static. Set `DEBUG=False`, configure `ALLOWED_HOSTS`, run `python manage.py collectstatic`, point at managed Postgres
- Frontend: Vercel or any Next-compatible host. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Media uploads currently use local storage — swap `DEFAULT_FILE_STORAGE` to S3/GCS for production
- Add HSTS, secure cookies, CSP headers in production

## Brand

**Tredific®** — the ® always renders. The `<Brand />` component in `frontend/components/Brand.tsx` ships the right typography and superscript. Use it everywhere instead of typing the brand name as plain text.
