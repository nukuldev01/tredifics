# Tredific® — Changes log

Most recent pass at the top.

---

## Pass 4 — Dynamic CMS: hero carousel, reels, popup reviews, restructured home

### New backend models (`apps.content`)
- **`Banner`** — admin-uploadable hero slides (brand-story / category / promo
  kinds). Fields: desktop image, mobile image, eyebrow, headline,
  subheadline, two CTAs, overlay opacity slider, sort order, active toggle.
  Carousel auto-advances every 5 s on the homepage; pauses on hover.
- **`Reel`** — Instagram Reel / YouTube Shorts URL, optional thumbnail,
  creator handle. The serializer auto-converts share URLs to embed URLs
  (`/reel/ABC/` → `/reel/ABC/embed/`; `/shorts/XYZ` → `/embed/XYZ`).
- **`PopupReview`** — short reviews shown via floating popup. Fields:
  user_name, photo, rating (1–5), title, comment, optional product_name.

### New REST endpoints
- `GET /api/content/banners/`
- `GET /api/content/reels/`
- `GET /api/content/popup-reviews/`

All three are public, paginated-off, and admin-managed via Django admin
with image previews in the list view.

### Dynamic category images
`CategorySerializer.get_image_url` now falls back to the first image of
the first published product in that category when no banner is uploaded.
The static `frontend/public/categories/` requirement is therefore
unnecessary — categories self-illustrate from product photography.

### New frontend components
- **`components/BannerCarousel.tsx`** — fades between slides, dots +
  arrow controls, mobile picture-element for separate mobile crops,
  fallback brand-story slide if admin has nothing uploaded yet.
- **`components/ReelsSection.tsx`** — horizontal-scrolling reel cards,
  click to open a 9:16 modal player that embeds Instagram/YouTube.
- **`components/ReviewPopup.tsx`** — floating bottom-left popup that
  surfaces a new review every 5 s on `/collections/*` and `/products/*`
  pages. User can dismiss permanently per session.
- **`components/ProductRow.tsx`** — reusable horizontal product carousel
  used for new arrivals / bestsellers / per-category rows on the homepage.

### ProductCard
Size pills now render at the bottom of every card (XS · S · M · L · XL ·
XXL · 3XL · 4XL · 5XL · 6XL · 7XL · FREE). First size is highlighted.

### Homepage
Restructured into editorial sections, original layout & copy:
- Hero carousel (BannerCarousel)
- USP trust bar
- New Arrivals row
- Shop by Category grid (uses dynamic product imagery)
- Bestsellers row
- Editorial split banner (Wedding edit / Co-ord edit)
- Dresses row
- Kurta Sets row
- Reels section
- Google Reviews carousel
- Brand strip + trademark trust badge
- Newsletter

### Verified live (smoke tested)
- `seed_catalog` creates 3 banners, 6 reels, 8 popup reviews
- `GET /api/content/banners/` → 3 results, brand_story first
- `GET /api/content/reels/` → 6 results, IG + YT embed URLs correctly converted
- `GET /api/content/popup-reviews/` → 8 results
- `GET /api/categories/` → categories with no manual image now return a
  product photo as fallback
- `GET /api/products/?page_size=2` → returns sizes array for card pills

### IP / design note
The new homepage layout draws *structural* inspiration from competitor
ethnic-wear sites you referenced (multi-row editorial, sticky sections,
mobile snap-scrolling rows) — none of their copy, imagery, or pixel-level
styling has been reused. All section headings, microcopy, and component
designs are original.

---

## Pass 3 — Production hardening + Go-Live runbook

(see GO_LIVE.md for the full step-by-step deploy guide)

- `settings.py` hardened: HSTS, secure cookies, SSL redirect,
  CSRF_TRUSTED_ORIGINS, rotating file logging, Gmail SMTP, optional Sentry
- `django-ratelimit` on signup (20/h), login (20/h), OTP request (10/h),
  OTP verify (20/h), checkout (30/h) — verified blocking on the 21st request
- `apps/payments/models.py` — `PaymentEvent` audit-log
- `apps/payments/views.py` — `WebhookView` with HMAC verification
- `deploy/nginx/tredific.conf` — final Nginx with HSTS, gzip, immutable
  asset caching, www→apex redirect, raw-body webhook handling
- `deploy/systemd/tredific-api.service` + `tredific-web.service` — hardened
  units (PrivateTmp, NoNewPrivileges, ProtectSystem=strict)
- `deploy/jail.local` — fail2ban SSH brute-force protection
- `scripts/deploy.sh`, `backup.sh`, `restore.sh`, `firewall.sh`
- `backend/.env.production.example` + `frontend/.env.production.example`
- `GO_LIVE.md` — 18-section runbook for the Hostinger VPS deploy

---

## Pass 2 — Real contact info, trademark, Google Reviews, CA shipping

- Excel importer rebrands and ingests products from the supplied sheet
- Trademark PDF in `frontend/public/`, footer trust strip + About section
- Footer + Header use real contact info (`lib/brand.ts`)
- WhatsApp floating button, Google Reviews carousel, Contact page
- Country/currency selector (IN/US/GB/CA)
- Sticky mobile add-to-cart bar on PDP
- CMS pages rewritten with markdown + sticky TOC viewer
- `/sitemap.xml`, `/robots.txt`, Product JSON-LD, Organization JSON-LD
- Razorpay webhook + `PaymentEvent` audit log

---

## Pass 1 — Initial build

This pass updated the existing project (no rebuild). Below is the full list
of files added and changed.

## New files

### Backend
- `backend/apps/catalog/management/commands/import_products.py` — Excel-to-DB
  importer for `tredfit_products_info.xlsx`. Handles the shifted column
  headers, rebrands titles (Divena/Millennial Men → Tredific), maps categories,
  detects colour from the title (with word-boundary matching), parses the
  size string + multi-image list, generates SKU/slug, fills SEO fields, and
  is idempotent on re-run.
- `backend/apps/payments/admin.py` — Django admin for the new `PaymentEvent`
  model.
- `backend/apps/payments/migrations/0001_initial.py` — auto-generated.

### Frontend
- `frontend/lib/brand.ts` — single source of truth for the brand contact
  details: email, phone, WhatsApp, social URLs, trademark PDF path.
- `frontend/lib/currency.ts` — country-aware currency display helper +
  Zustand `useCountry` store persisted to localStorage.
- `frontend/components/CountrySelect.tsx` — header dropdown for IN/US/GB/CA.
- `frontend/components/WhatsAppButton.tsx` — floating WhatsApp CTA.
- `frontend/components/GoogleReviews.tsx` — homepage reviews carousel with
  star ratings, customer names, mobile-responsive horizontal scroll, and
  CTA to the brand's Google Business Profile.
- `frontend/components/ProductSchema.tsx` — Product / Offer / AggregateRating
  JSON-LD on every PDP.
- `frontend/app/contact/page.tsx` — dedicated Contact page with all channels.
- `frontend/app/sitemap.ts` — dynamic sitemap pulling categories + products.
- `frontend/app/robots.ts` — robots.txt with correct allow/disallow + sitemap.
- `frontend/app/pages/[slug]/ContentPageView.tsx` — new CMS page renderer
  with sticky table-of-contents that highlights the active section, plus
  inline markdown (H2 sections, bold, em).
- `frontend/public/tredific-trademark-certificate.pdf` — the trademark cert,
  linkable from footer + About page.

### Docs
- `DEPLOYMENT.md` — Hostinger VPS deploy guide (Nginx, Gunicorn, systemd,
  Certbot, Razorpay live keys + webhook setup, env-var template, production
  checklist).
- `CHANGES.md` — this file.

## Modified files

### Backend
- `backend/tredific/settings.py` — `SUPPORTED_COUNTRIES` updated to
  IN/US/GB/CA, `CURRENCY_BY_COUNTRY` mapping added, `CONTACT_EMAIL`,
  `CONTACT_PHONE`, social URLs added.
- `backend/apps/catalog/management/commands/seed_catalog.py` — shipping
  rates now per-country in native currency (INR/USD/GBP/CAD); content pages
  rewritten with full markdown sections matching the new specs (About,
  T&C, Return & Exchange, Shipping & Delivery, FAQ, Legal & Compliance,
  Shipping & Logistics, Location-Based Shipping, User Account, Brand Rules
  & Guidelines, Privacy); category list expanded to match Excel data.
- `backend/apps/payments/models.py` — `PaymentEvent` audit-log model.
- `backend/apps/payments/views.py` — `WebhookView` added (HMAC-verified,
  CSRF-exempt, handles payment.captured / payment.failed / refund); existing
  `CreatePaymentOrderView` and `VerifyPaymentView` write `PaymentEvent`
  records on every step.
- `backend/apps/payments/urls.py` — added `/webhook/` route.
- `backend/.env.example` — `RAZORPAY_WEBHOOK_SECRET` added.

### Frontend
- `frontend/app/layout.tsx` — wires Organization JSON-LD, favicon links,
  the WhatsApp floating button.
- `frontend/app/page.tsx` — homepage now embeds the GoogleReviews component
  + a trademark trust badge.
- `frontend/app/products/[slug]/page.tsx` — emits Product JSON-LD via the
  new ProductSchema component.
- `frontend/app/products/[slug]/ProductView.tsx` — desktop ATC button
  unchanged; **new mobile-only sticky ATC bar** at the bottom of the
  viewport that follows the user as they scroll.
- `frontend/app/pages/[slug]/page.tsx` — server component now delegates
  rendering to the client `ContentPageView` (sticky TOC, parsed markdown).
- `frontend/components/Header.tsx` — added the country/currency selector.
- `frontend/components/Footer.tsx` — replaced placeholder contact info
  with real values, added Email/Phone rows, social link block (Instagram,
  Facebook, Google Business), trademark trust strip with a link to the
  certificate PDF, "ships to" line.

## What still needs your action

- Drop your **logo PNG** at `frontend/public/logo.png`, plus `favicon.ico`
  and `apple-touch-icon.png`. Then update `<Brand />` to render an
  `<img>` instead of typed text if you'd prefer the artwork on header/footer.
- Drop your **size-chart image** anywhere in `frontend/public/` and replace
  the hardcoded table inside `ProductView.tsx` with an `<img>` if the
  client-supplied chart should be authoritative.
- Set **live Razorpay keys** + the webhook secret in `.env` files when
  going live.
- Run the importer against the full Excel sheet:
  ```bash
  python manage.py import_products /path/to/tredfit_products_info.xlsx
  ```
  This pulls in all 1,234 rows (~1,180 unique products).

## Verified end-to-end

- Migrations apply cleanly (`payments.0001_initial` creates `PaymentEvent`).
- `python manage.py check` — no issues.
- `seed_catalog` populates 9 categories, 10 colours, 10 starter products,
  8 shipping rates (per country, native currency), 11 content pages,
  6 homepage sections, 4 testimonials.
- `import_products --limit 50` imports 47 unique products with 6 images
  each and properly detected colours (the "Baby Pink Flared" word-boundary
  case is now correctly tagged Pink, not Red).
- `GET /api/products/?page_size=2` returns clean Tredific-branded names.
- `GET /api/shipping/rates/?country=CA` returns CAD rates with free-above
  threshold.
- `GET /api/content/pages/about-us/` returns markdown body with 4 H2 sections.
- `POST /api/payments/webhook/` rejects unsigned bodies with 400.
