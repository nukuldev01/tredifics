"""Seed Tredific with categories, colors, sample products, shipping rates,
content pages, homepage sections, and testimonials.

Run:
    python manage.py seed_catalog
    python manage.py seed_catalog --reset
"""
import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import (
    Category, Color, Product, ProductFAQ, ProductImage,
    ProductShowcase, ProductVariant, Review,
)
from apps.content.models import (
    Banner, HomepageSection, PopupReview, Reel, StaticPage, Testimonial,
)
from apps.shipping.models import ShippingRate
from apps.blog.models import BlogPost


CATEGORIES = [
    ("Kurti", "Comfortable everyday and festive kurtis."),
    ("Saree", "Hand-picked sarees for every occasion."),
    ("Dress", "Modern ethnic dresses, floor-length and midi."),
    ("Lehenga", "Statement lehengas for weddings and events."),
    ("Co-ord Set", "Coordinated kurta + bottom + dupatta sets."),
    ("Top", "Everyday and workwear tops."),
    ("Kurta Set", "Kurta + bottom sets, with or without dupatta."),
    ("Loungewear", "Sleepwear and lounge sets."),
    ("Shirt", "Men's and unisex shirts."),
]

COLORS = [
    ("Black", "#0f0f0f"),
    ("Ivory", "#f5efe6"),
    ("Wine", "#722f37"),
    ("Emerald", "#1e8e6e"),
    ("Mustard", "#e1ad01"),
    ("Royal Blue", "#1f3a93"),
    ("Pink", "#f4c2c2"),
    ("Rust", "#b7410e"),
    ("Teal", "#177e89"),
    ("Indigo", "#3f51b5"),
]

IMAGE_POOL = [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900",
    "https://images.unsplash.com/photo-1617059062460-92c10cc5b80a?w=900",
    "https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=900",
    "https://images.unsplash.com/photo-1631233859262-0d7e2d4b27f7?w=900",
    "https://images.unsplash.com/photo-1610189025034-9c4101924b1c?w=900",
    "https://images.unsplash.com/photo-1622445275576-721325763afe?w=900",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900",
    "https://images.unsplash.com/photo-1595777216528-071e0127ccbf?w=900",
    "https://images.unsplash.com/photo-1610030181087-540017dc9d61?w=900",
]

ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL"]

# A small starter set that's overwritten when you run import_products.
PRODUCTS = [
    ("Aaradhya Embroidered Anarkali Kurti", "Kurti", "Cotton Silk", "Festive", "2899", "1999",
     "A graceful Anarkali kurti with delicate thread embroidery on the yoke."),
    ("Saanvi Floral Printed Kurti", "Kurti", "Pure Cotton", "Casual", "1499", "999",
     "Lightweight cotton kurti with all-over floral print."),
    ("Diya Chiffon Floral Saree", "Saree", "Chiffon", "Day Event", "3499", "2499",
     "Lightweight chiffon saree with hand-painted floral motifs."),
    ("Kashvi Banarasi Saree", "Saree", "Banarasi Silk", "Wedding", "8999", "6499",
     "Traditional Banarasi saree with intricate zari weaving."),
    ("Aarohi Block-Print Maxi Dress", "Dress", "Cotton", "Casual", "1999", "1499",
     "Floor-grazing block-print maxi dress with elasticated waist."),
    ("Naina Embroidered Anarkali Gown", "Dress", "Georgette", "Festive", "4999", "3499",
     "Embroidered Anarkali-style gown with a fitted bodice."),
    ("Kiara Bridal Lehenga", "Lehenga", "Velvet", "Wedding", "24999", "18999",
     "Bridal lehenga with heavy zardosi work."),
    ("Riya Sequin Lehenga", "Lehenga", "Net", "Reception", "11999", "8499",
     "Sequin-embellished lehenga skirt."),
    ("Myra Co-ord Kurta Set", "Co-ord Set", "Rayon", "Casual", "2299", "1599",
     "Printed co-ord set."),
    ("Avni Sharara Set", "Co-ord Set", "Georgette", "Festive", "4499", "2999",
     "Short kurta + flared sharara + dupatta."),
]

REVIEWS = [
    (5, "Absolutely beautiful", "Better than the photos. Fabric is soft and the fit is true to size."),
    (5, "Great quality", "Stitching is neat and packaging was lovely."),
    (4, "Lovely but slightly snug", "Beautiful product, I'd suggest sizing up."),
    (5, "Got many compliments", "Wore it to a wedding, perfect colour and drape."),
    (4, "Good purchase", "Shipping was a little slow but the product is worth it."),
]

HOMEPAGE_SECTIONS = [
    {"kind": "hero", "sort_order": 1,
     "heading": "Crafted in India, Loved Worldwide",
     "subheading": "Tredific® brings you ethnic wear with modern sensibility.",
     "image_url": "https://images.unsplash.com/photo-1610189025034-9c4101924b1c?w=1600",
     "image_alt": "Model wearing traditional kurta",
     "cta_label": "Shop the collection", "cta_url": "/collections/all"},
    {"kind": "banner", "sort_order": 2, "heading": "Wedding Edit",
     "subheading": "Heirloom sarees and bridal lehengas — handpicked.",
     "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200",
     "image_alt": "Wedding ethnic wear",
     "cta_label": "Explore Wedding", "cta_url": "/collections/lehenga"},
    {"kind": "usp", "sort_order": 3, "heading": "Worldwide Shipping",
     "subheading": "Trackable delivery to India, US, UK, Canada."},
    {"kind": "usp", "sort_order": 4, "heading": "Sizes XS – 7XL",
     "subheading": "Inclusive sizing on every collection."},
    {"kind": "usp", "sort_order": 5, "heading": "Easy Returns",
     "subheading": "30-day hassle-free returns."},
    {"kind": "usp", "sort_order": 6, "heading": "Secure Checkout",
     "subheading": "Razorpay-secured international payments."},
]

STATIC_PAGES = [
    ("About Us", "about-us",
     "## Our Story\n\nTredific® is a contemporary ethnic-wear label designed in "
     "India and worn worldwide. Every piece is crafted in small batches with a "
     "focus on fabric, finish, and fit.\n\n"
     "## What we make\n\nOur design studio works with weavers and tailors across "
     "Jaipur, Surat, and Banaras. We make kurtas, kurta sets, dresses, lehengas, "
     "sarees, co-ord sets, tops, and loungewear in sizes XS through 7XL.\n\n"
     "## Registered Trademark\n\nTredific® is a registered trademark. View the "
     "certificate from the link in the footer of every page.\n\n"
     "## Contact\n\nEmail Tredific@gmail.com, call +91 8385990434, or use the "
     "WhatsApp button. We answer within one business day."),
    ("Terms & Conditions", "terms-and-conditions",
     "## Agreement to terms\n\nBy accessing tredific.com you agree to these Terms.\n\n"
     "## Intellectual property\n\nAll content — including the Tredific® mark, "
     "photography, copy, and designs — is the property of Tredific® and protected "
     "by trademark and copyright law.\n\n"
     "## Orders & pricing\n\nPrices are stored in INR. International customers see "
     "approximate prices in USD/GBP/CAD; the final charge is processed through "
     "Razorpay.\n\n"
     "## Limitation of liability\n\nTredific® is not liable for indirect or "
     "consequential damages beyond the amount paid for the order.\n\n"
     "## Governing law\n\nThese Terms are governed by the laws of India."),
    ("Return & Exchange Policy", "return-policy",
     "## Window\n\nWe accept returns and size exchanges within 30 days of delivery.\n\n"
     "## Conditions\n\nItems must be unworn, unwashed, and in original packaging "
     "with tags attached. Innerwear and altered items are non-returnable.\n\n"
     "## How to start a return\n\nUse the account dashboard or email "
     "Tredific@gmail.com with your order ID.\n\n"
     "## Refunds\n\nRefunds are issued to the original payment method within "
     "5–7 business days of receiving the returned item.\n\n"
     "## International returns\n\nCustomers in the US, UK, and Canada are "
     "responsible for return shipping unless the item is defective."),
    ("Shipping & Delivery Policy", "shipping-policy",
     "## Where we ship\n\nIndia · United States · United Kingdom · Canada.\n\n"
     "## Methods & timelines\n\n**Standard** 7–14 business days internationally, "
     "4–7 in India. **Express** 3–6 business days internationally, 1–3 in India.\n\n"
     "## Free shipping\n\nFree Standard shipping on orders above ₹1999 / $199 / £150 / C$249.\n\n"
     "## Customs & duties\n\nCustoms duties may apply for international orders "
     "and are payable by the recipient.\n\n"
     "## Tracking\n\nYou'll receive an email with a tracking link as soon as your "
     "order ships."),
    ("FAQ", "faq",
     "## Where do you ship?\n\nIndia, US, UK, and Canada today.\n\n"
     "## How do I find my size?\n\nEvery product page has a size-chart modal. "
     "Sizes XS to 7XL.\n\n"
     "## Can I cancel my order?\n\nYes, until it has shipped. Email "
     "Tredific@gmail.com with your order ID.\n\n"
     "## Do you offer wholesale?\n\nYes — write to Tredific@gmail.com.\n\n"
     "## How do international payments work?\n\nRazorpay accepts Visa, Mastercard, "
     "Amex, and UPI. International cards charge in INR; your bank converts.\n\n"
     "## Is Tredific® a registered brand?\n\nYes. Trademark certificate downloadable "
     "from the footer."),
    ("Legal & Compliance", "legal-and-compliance",
     "## Trademark\n\nTredific® is a registered trademark. The certificate is "
     "available from every footer.\n\n"
     "## Company\n\nTredific® operates from India and complies with applicable "
     "consumer-protection, data-protection, and tax regulations.\n\n"
     "## Reporting concerns\n\nEmail legal questions or trademark issues to "
     "Tredific@gmail.com."),
    ("Shipping & Logistics", "shipping-and-logistics",
     "## Logistics partners\n\nDomestic India: Delhivery, Bluedart, India Post. "
     "International: DHL, FedEx, UPS — chosen based on destination.\n\n"
     "## Packaging\n\nAll orders ship in tamper-evident, recyclable packaging.\n\n"
     "## Lost or delayed parcels\n\nIf tracking has not updated for 5+ days, "
     "write to Tredific@gmail.com with your order ID."),
    ("Location-Based Shipping", "location-based-shipping",
     "## India\n\nStandard ₹99 (free above ₹1999), Express ₹249. 4–7 days standard, 1–3 express.\n\n"
     "## United States\n\nStandard $19 (free above $199), Express $39.\n\n"
     "## United Kingdom\n\nStandard £16 (free above £150), Express £32.\n\n"
     "## Canada\n\nStandard C$24 (free above C$249), Express C$44."),
    ("User Account", "user-account",
     "## Creating an account\n\nSign up with email and password, or use the "
     "email-code login on the account page.\n\n"
     "## What you can do\n\nTrack orders, save addresses, manage your profile, "
     "request returns.\n\n"
     "## Privacy\n\nYour data is used only to fulfil orders and improve your "
     "experience."),
    ("Brand Rules & Guidelines", "brand-rules",
     "## The mark\n\nThe brand is always written **Tredific®** — the registered-"
     "trademark symbol must always be present.\n\n"
     "## Tone of voice\n\nWarm, confident, contemporary.\n\n"
     "## Logo usage\n\nMaintain clear-space equal to the height of the cap-T."),
    ("Privacy Policy", "privacy-policy",
     "## What we collect\n\nAccount info you provide (name, email, phone), order "
     "details, and basic site analytics.\n\n"
     "## What we don't do\n\nWe never sell your personal data.\n\n"
     "## Cookies\n\nEssential cookies for cart and login, optional analytics "
     "cookies you can disable in your browser.\n\n"
     "## Your rights\n\nEmail Tredific@gmail.com to request a copy or deletion "
     "of your data."),
]

TESTIMONIALS = [
    ("Priya M.", 5, "Beautiful saree, beautifully packed. The drape is perfect.", "Mumbai"),
    ("Anjali S.", 5, "Got it shipped to NYC in just under a week. Loved it.", "New York"),
    ("Fatima A.", 4, "Lovely embroidery. Will buy again.", "Toronto"),
    ("Sneha R.", 5, "The plus-size co-ord finally fits properly. Thank you!", "London"),
]

# Country, method, price, currency, days_min, days_max, free_above
SHIPPING_RATES = [
    ("IN", "standard", "99",  "INR", 4, 7,  "1999"),
    ("IN", "express",  "249", "INR", 1, 3,  None),
    ("US", "standard", "19",  "USD", 7, 14, "199"),
    ("US", "express",  "39",  "USD", 3, 6,  None),
    ("GB", "standard", "16",  "GBP", 7, 14, "150"),
    ("GB", "express",  "32",  "GBP", 3, 6,  None),
    ("CA", "standard", "24",  "CAD", 7, 14, "249"),
    ("CA", "express",  "44",  "CAD", 3, 6,  None),
]


class Command(BaseCommand):
    help = "Seed Tredific catalog, content, shipping, and demo reviews."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true",
                            help="Wipe catalog tables first.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("Resetting…")
            Review.objects.all().delete()
            ProductVariant.objects.all().delete()
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Color.objects.all().delete()

        cats = {}
        for i, (name, desc) in enumerate(CATEGORIES):
            c, _ = Category.objects.get_or_create(
                name=name,
                defaults={"short_description": desc, "sort_order": i},
            )
            cats[name] = c
        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(cats)} categories"))

        colors = {}
        for name, hex_code in COLORS:
            col, _ = Color.objects.get_or_create(name=name, defaults={"hex_code": hex_code})
            colors[name] = col
        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(colors)} colors"))

        random.seed(42)
        for i, (name, cat_name, fabric, occasion, price, sale, desc) in enumerate(PRODUCTS):
            cat = cats[cat_name]
            short = desc.split(".")[0] + "."
            product, created = Product.objects.get_or_create(
                name=name,
                defaults=dict(
                    category=cat, fabric=fabric, occasion=occasion,
                    short_description=short, description=desc,
                    price=Decimal(price),
                    sale_price=Decimal(sale) if sale else None,
                    care_instructions="Hand wash cold. Do not bleach. Iron on low heat.",
                    country_of_origin="India",
                    is_featured=(i < 6),
                    status=Product.STATUS_PUBLISHED,
                    meta_title=f"{name} | Tredific®",
                    meta_description=short,
                ),
            )
            for j, url in enumerate(random.sample(IMAGE_POOL, 3)):
                ProductImage.objects.get_or_create(
                    product=product, image_url=url,
                    defaults=dict(alt=f"{name} — view {j + 1}",
                                  sort_order=j, is_primary=(j == 0)),
                )
            for col in random.sample(list(colors.values()), 3):
                for size in random.sample(ALL_SIZES[:8], 5):
                    ProductVariant.objects.get_or_create(
                        product=product, size=size, color=col,
                        defaults={"stock": random.randint(2, 25)},
                    )
            for r in random.sample(REVIEWS, k=random.randint(0, 3)):
                Review.objects.create(
                    product=product,
                    name=random.choice(["Riya", "Aman", "Neha", "Kabir", "Ishita"]),
                    rating=r[0], title=r[1], body=r[2],
                )
        self.stdout.write(self.style.SUCCESS(f"  ✓ {Product.objects.count()} products"))

        for country, method, price, cur, dmin, dmax, free in SHIPPING_RATES:
            ShippingRate.objects.update_or_create(
                country=country, method=method,
                defaults={"price": Decimal(price), "currency": cur,
                          "estimated_days_min": dmin, "estimated_days_max": dmax,
                          "free_above": Decimal(free) if free else None},
            )
        self.stdout.write(self.style.SUCCESS(f"  ✓ {ShippingRate.objects.count()} shipping rates"))

        for title, slug, body in STATIC_PAGES:
            StaticPage.objects.update_or_create(
                slug=slug,
                defaults={"title": title, "body": body, "is_published": True,
                          "meta_title": f"{title} | Tredific®"},
            )
        self.stdout.write(self.style.SUCCESS(f"  ✓ {StaticPage.objects.count()} content pages"))

        HomepageSection.objects.all().delete()
        for s in HOMEPAGE_SECTIONS:
            HomepageSection.objects.create(**s)
        self.stdout.write(self.style.SUCCESS(f"  ✓ {HomepageSection.objects.count()} homepage sections"))

        Testimonial.objects.all().delete()
        for i, (name, rating, body, location) in enumerate(TESTIMONIALS):
            Testimonial.objects.create(
                name=name, rating=rating, body=body, location=location, sort_order=i,
            )
        self.stdout.write(self.style.SUCCESS(f"  ✓ {Testimonial.objects.count()} testimonials"))


        # Banners — never destroy admin-managed banners on re-seed.
        if Banner.objects.exists():
            self.stdout.write(self.style.WARNING(
                f"  • {Banner.objects.count()} banner(s) already exist — "
                "skipped (manage them in the admin)"
            ))
        else:
            for b in SAMPLE_BANNERS:
                Banner.objects.create(**b)
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ {Banner.objects.count()} hero banners"
            ))

        # Reels
        Reel.objects.all().delete()
        for r in SAMPLE_REELS:
            Reel.objects.create(**r)
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {Reel.objects.count()} reels"
        ))

        # Popup reviews
        PopupReview.objects.all().delete()
        for name, rating, title, comment, product, sort_order in SAMPLE_POPUP_REVIEWS:
            PopupReview.objects.create(
                user_name=name, rating=rating, title=title,
                comment=comment, product_name=product, sort_order=sort_order,
            )
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {PopupReview.objects.count()} popup reviews"
        ))


        # Product FAQs — applied to every product
        ProductFAQ.objects.all().delete()
        faq_count = 0
        for prod in Product.objects.all():
            for i, (q, a) in enumerate(SAMPLE_FAQS):
                ProductFAQ.objects.create(
                    product=prod, question=q, answer=a, sort_order=i,
                )
                faq_count += 1
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {faq_count} product FAQs across {Product.objects.count()} products"
        ))

        # Showcase images — sample lifestyle shots per product
        ProductShowcase.objects.all().delete()
        showcase_count = 0
        for prod in Product.objects.all():
            for i, url in enumerate(random.sample(IMAGE_POOL, 3)):
                ProductShowcase.objects.create(
                    product=prod, image_url=url,
                    caption=f"{prod.name} — styled",
                    alt=f"{prod.name} lifestyle shot {i + 1}",
                    sort_order=i,
                )
                showcase_count += 1
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {showcase_count} showcase images"
        ))

        # Blog posts
        from django.utils import timezone
        BlogPost.objects.all().delete()
        for i, post in enumerate(SAMPLE_BLOG_POSTS):
            BlogPost.objects.create(
                **post,
                status=BlogPost.STATUS_PUBLISHED,
                published_at=timezone.now(),
                author_name="Tredific Editorial",
            )
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {BlogPost.objects.count()} blog posts"
        ))

        self.stdout.write(self.style.SUCCESS("\nSeed complete."))


# Sample CMS records for the new admin-managed homepage modules. Run
# `python manage.py seed_catalog --reset` to refresh these as well.
SAMPLE_BANNERS = [
    {
        "kind": "brand_story", "sort_order": 0,
        "eyebrow": "Crafted in India",
        "headline": "Hands that weave, hearts that wear.",
        "subheadline": "Every Tredific® piece is shaped by an artisan and shipped to someone who'll love it.",
        "image_url": "https://images.unsplash.com/photo-1591215372254-7b4ff1ec88f8?w=1800",
        "image_alt": "Artisan hands weaving traditional Indian textile",
        "cta_label": "Discover the collection", "cta_url": "/collections/all",
        "cta_secondary_label": "Our story", "cta_secondary_url": "/pages/about-us",
        "overlay_opacity": 40,
    },
    {
        "kind": "category", "sort_order": 1,
        "eyebrow": "New in",
        "headline": "Kurta Sets to live in",
        "subheadline": "Co-ordinated, easy, made for everyday.",
        "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1800",
        "image_alt": "Model in a printed kurta set",
        "cta_label": "Shop Kurta Sets", "cta_url": "/collections/kurta-set",
        "overlay_opacity": 25,
    },
    {
        "kind": "category", "sort_order": 2,
        "eyebrow": "Wedding edit",
        "headline": "For the days that matter",
        "subheadline": "Heirloom lehengas and bridal sarees.",
        "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1800",
        "image_alt": "Bridal lehenga look",
        "cta_label": "Explore Wedding", "cta_url": "/collections/lehenga",
        "overlay_opacity": 30,
    },
]

SAMPLE_REELS = [
    {
        "title": "Festive draping in 60 seconds",
        "creator_handle": "@tredific",
        "embed_url": "https://www.instagram.com/reel/CtsXXX_PLACEHOLDER/",
        "thumbnail_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600",
        "sort_order": 0,
    },
    {
        "title": "How to style a co-ord set",
        "creator_handle": "@priya.styles",
        "embed_url": "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "thumbnail_url": "https://images.unsplash.com/photo-1622445275576-721325763afe?w=600",
        "sort_order": 1,
    },
    {
        "title": "Block print → office wear",
        "creator_handle": "@tredific",
        "embed_url": "https://www.instagram.com/reel/CuvXXX_PLACEHOLDER/",
        "thumbnail_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
        "sort_order": 2,
    },
    {
        "title": "Mehendi-night look",
        "creator_handle": "@aisha.style",
        "embed_url": "https://www.instagram.com/reel/CvwXXX_PLACEHOLDER/",
        "thumbnail_url": "https://images.unsplash.com/photo-1617059062460-92c10cc5b80a?w=600",
        "sort_order": 3,
    },
    {
        "title": "From day to night — one kurta",
        "creator_handle": "@stylebyriya",
        "embed_url": "https://www.youtube.com/shorts/aaabbbcccdd",
        "thumbnail_url": "https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=600",
        "sort_order": 4,
    },
    {
        "title": "Plus-size styling, done right",
        "creator_handle": "@maya.fits",
        "embed_url": "https://www.instagram.com/reel/CwxXXX_PLACEHOLDER/",
        "thumbnail_url": "https://images.unsplash.com/photo-1631233859262-0d7e2d4b27f7?w=600",
        "sort_order": 5,
    },
]

SAMPLE_POPUP_REVIEWS = [
    ("Priya M.", 5, "Beautiful saree",
     "Drapes like a dream and the colour is even better than the photos.",
     "Banarasi Silk Saree", 0),
    ("Anjali S.", 5, "Shipped to NYC fast",
     "Reached me in 8 days, packed beautifully. Love the fabric.",
     "Embroidered Anarkali", 1),
    ("Fatima A.", 5, "Plus-size fits!",
     "The 4XL fit me like it was tailored. Will absolutely order again.",
     "Plus-Size Co-ord Set", 2),
    ("Sneha R.", 5, "Customer support 10/10",
     "Quick replies on WhatsApp, exchange was painless.",
     "Mirror-work Kurti", 3),
    ("Diya G.", 5, "Got compliments all evening",
     "Wore it to a dinner — three friends asked where I got it.",
     "Cotton Anarkali Dress", 4),
    ("Aman K.", 4, "Great value",
     "Fabric quality is way above the price point.",
     "Block-print Maxi", 5),
    ("Ishita V.", 5, "Perfect for wedding season",
     "The embroidery is beautiful and the fit was spot-on.",
     "Velvet Lehenga", 6),
    ("Riya S.", 5, "Soft and comfortable",
     "Wears like a second skin, no scratchy zips.",
     "Cotton Kurta Set", 7),
]


# Per-product FAQ items applied to every seed product.
SAMPLE_FAQS = [
    ("What fabric is used?",
     "Fabric details are listed in the product description and details tab — most Tredific® pieces use cotton, rayon, silk, or modal blends."),
    ("Is the fit oversized or regular?",
     "Default fit is regular / true-to-size. If you're between sizes we recommend sizing up. See the size chart on the product page."),
    ("What is the delivery time?",
     "India: 4–7 business days standard, 1–3 days express. International (US/UK/CA): 7–14 days standard, 3–6 days express."),
    ("Can I return or exchange this?",
     "Yes — we offer 30-day returns and free size exchanges on unworn items in original packaging. See the Return Policy in the footer."),
    ("Is COD available?",
     "Cash on Delivery is available across India for orders up to ₹10,000. International orders are prepaid only."),
    ("How do I choose the right size?",
     "Use the size chart modal on each product page — measurements are listed in inches for bust, waist, and hip across XS to 7XL."),
]

# A few demo blog posts.
SAMPLE_BLOG_POSTS = [
    {
        "title": "Top Ethnic Fashion Trends for 2026",
        "excerpt": "From minimalist silk drapes to maximalist mirror work — here's what's defining ethnic wear in 2026.",
        "body": (
            "## Less is more, but make it heirloom\n\n"
            "2026 is the year of quiet luxury in ethnic wear. Think soft silks, "
            "hand-block prints, and silhouettes that breathe.\n\n"
            "## The fits that matter\n\n"
            "Co-ord sets continue to dominate, with sharara and palazzo pairings "
            "back in rotation. Boxy kurta cuts feel fresh against fitted bottoms.\n\n"
            "## Colours of the season\n\n"
            "Wine, mustard, sage, ivory — palettes that flatter on every skin tone "
            "and read well on camera.\n\n"
            "## Styling tip\n\n"
            "Pair an embroidered kurta with sneakers for daytime, swap to juttis "
            "for evening. The same outfit, two moods."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600",
        "cover_alt": "Model wearing a wine-coloured ethnic set",
        "focus_keyword": "ethnic fashion trends 2026",
        "meta_title": "Top Ethnic Fashion Trends for 2026 | Tredific®",
        "meta_description": "What's defining ethnic wear in 2026 — from quiet luxury silks to maximalist mirror work. Read the Tredific® edit.",
    },
    {
        "title": "How to Style a Kurta Set Three Ways",
        "excerpt": "One co-ord set, three completely different looks — from brunch to wedding-evening.",
        "body": (
            "## The base outfit\n\n"
            "Start with a printed cotton-silk kurta set — the kind of piece that "
            "earns its keep season after season.\n\n"
            "## Look 1 — Brunch\n\n"
            "Hair down, gold studs, juttis. Layer a thin chain. Done in five minutes.\n\n"
            "## Look 2 — Office\n\n"
            "Tuck the kurta loosely, add a cropped blazer, swap to closed-toe loafers. "
            "The same set now reads polished.\n\n"
            "## Look 3 — Wedding evening\n\n"
            "Pull out a contrast dupatta with mirror work, add statement earrings, "
            "and step into block heels. Sudden glamour.\n\n"
            "## The takeaway\n\n"
            "A great kurta set isn't an outfit — it's a wardrobe."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1622445275576-721325763afe?w=1600",
        "cover_alt": "A cotton kurta set styled for evening",
        "focus_keyword": "how to style kurta set",
        "meta_title": "Three Ways to Style a Kurta Set | Tredific®",
        "meta_description": "One co-ord set styled for brunch, office, and a wedding-evening. Tredific® styling guide.",
    },
    {
        "title": "The Care Guide: Making Your Ethnic Wear Last",
        "excerpt": "Hand wash, line dry, low iron — and a few less-obvious habits that double the life of your favourite pieces.",
        "body": (
            "## Wash less, wash gentler\n\n"
            "Most ethnic wear doesn't need a wash after every wear. Spot-clean "
            "and air-out between wears to preserve fabric structure.\n\n"
            "## Storage matters\n\n"
            "Heavy lehengas should be wrapped in muslin and stored flat. Sarees "
            "are best folded along different seams every few months to prevent "
            "permanent creasing.\n\n"
            "## The ironing rule\n\n"
            "Always iron on the reverse, on the lowest heat that gets the job done. "
            "For embroidery, cover with a clean cotton cloth before pressing.\n\n"
            "## When in doubt\n\n"
            "Hand wash cold. Always."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600",
        "cover_alt": "Folded ethnic textiles on a wooden surface",
        "focus_keyword": "ethnic wear care guide",
        "meta_title": "How to Care for Your Ethnic Wear | Tredific®",
        "meta_description": "Hand wash, line dry, low iron — the Tredific® care guide for making your favourite ethnic pieces last.",
    },
]
