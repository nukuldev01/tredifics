"""Import products from the client-supplied Excel sheet.

The original sheet has shifted columns. The actual layout is:
    [idx, title, category, price, mrp, discount, sizes, in_stock,
     source_url, main_image, all_images_semicolon_separated]

Run:
    python manage.py import_products /path/to/tredfit_products_info.xlsx
    python manage.py import_products --reset /path/to/file.xlsx
    python manage.py import_products --limit 100 /path/to/file.xlsx

Behaviour:
    * Skips fully-empty rows.
    * Rebrands titles by replacing third-party brand names (e.g. "Divena ",
      "MILLENNIAL MEN ") with the empty string so the resulting products read
      as native Tredific® listings.
    * Auto-derives a primary colour from the title (e.g. "maroon", "blue") and
      auto-creates Color rows + ProductVariant rows for every (size × colour).
    * Pulls all gallery images from the all_images column.
    * Auto-generates SKU and slug.
    * SEO meta_title / meta_description filled from title + short description.
    * Idempotent: running twice will not duplicate products with the same slug.
"""
import re
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import (
    Category, Color, Product, ProductImage, ProductVariant, Review,
)

# ---- Configuration -----------------------------------------------------------

# Source-store brand names to strip from titles so we own the listing.
BRANDS_TO_STRIP = [
    "Divena ", "Divena's ", "MILLENNIAL MEN ", "Millennial Men ",
]

# Map raw category strings to clean Tredific category names.
CATEGORY_MAP = {
    "Kurta Sets/Suit Sets": "Kurta Set",
    "Suit Sets": "Kurta Set",
    "Kurta": "Kurti",
    "Kurta/Kurti": "Kurti",
    "Tops": "Top",
    "Shirts": "Shirt",
    "Dresses": "Dress",
    "Sleep wear / Lounge Wear": "Loungewear",
    "Co-ords Set": "Co-ord Set",
    "Co-ords Sets": "Co-ord Set",
    "CO-ORDS": "Co-ord Set",
    "Lehenga": "Lehenga",
    "Shorts": "Shorts",
    "Trousers": "Trousers",
    "Jumpsuits": "Jumpsuit",
    "saree": "Saree",
    "Saree": "Saree",
}

# Words in the title that imply a colour. Order matters (first match wins).
COLOR_KEYWORDS = [
    ("Maroon", "#8b1f2a"),
    ("Wine", "#722f37"),
    ("Burgundy", "#5e1a2c"),
    ("Red", "#b03030"),
    ("Crimson", "#a01828"),
    ("Pink", "#f4c2c2"),
    ("Rose", "#dba0a0"),
    ("Magenta", "#aa1d6e"),
    ("Mustard", "#e1ad01"),
    ("Yellow", "#e8c547"),
    ("Mango", "#f0a200"),
    ("Orange", "#d97706"),
    ("Rust", "#b7410e"),
    ("Brown", "#6b4226"),
    ("Beige", "#d6c2a4"),
    ("Cream", "#f3e8d2"),
    ("Ivory", "#f5efe6"),
    ("White", "#f9f9f9"),
    ("Off-white", "#efe9dc"),
    ("Off White", "#efe9dc"),
    ("Black", "#0f0f0f"),
    ("Charcoal", "#36454f"),
    ("Grey", "#808080"),
    ("Gray", "#808080"),
    ("Navy Blue", "#0e1c3f"),
    ("Sky Blue", "#87ceeb"),
    ("Royal Blue", "#1f3a93"),
    ("Powder Blue", "#b0d4f1"),
    ("Light Blue", "#a8c8ec"),
    ("Blue", "#3f51b5"),
    ("Teal", "#177e89"),
    ("Turquoise", "#48a9a6"),
    ("Aqua", "#5fb6b6"),
    ("Mint", "#9dd9aa"),
    ("Olive", "#6b6b1d"),
    ("Lime", "#a5cf3d"),
    ("Sage", "#a3b18a"),
    ("Emerald", "#1e8e6e"),
    ("Bottle Green", "#0c5340"),
    ("Dark Green", "#175643"),
    ("Green", "#3a7d44"),
    ("Lavender", "#c2a8d0"),
    ("Lilac", "#c8a2c8"),
    ("Mauve", "#a87b9b"),
    ("Purple", "#7a3e87"),
    ("Indigo", "#3f51b5"),
    ("Violet", "#8c5ec1"),
    ("Peach", "#fbc8a0"),
    ("Coral", "#ed7464"),
    ("Multi", "#888888"),
]

DEFAULT_COLOR = ("Tredific Natural", "#a89b85")  # fallback colour

DEFAULT_DESCRIPTION_TEMPLATE = (
    "{title}. Crafted with premium fabric and a contemporary fit. "
    "Made for comfort and wearability. Tredific® brings you ethnic and modern "
    "wear shipped worldwide."
)


# ---- Helpers ----------------------------------------------------------------

def clean_title(raw: str) -> str:
    title = raw.strip()
    for brand in BRANDS_TO_STRIP:
        title = title.replace(brand, "")
        title = title.replace(brand.lower(), "")
        title = title.replace(brand.upper(), "")
    title = re.sub(r"\s+", " ", title).strip()
    # Title case while preserving acronyms
    return title[0].upper() + title[1:] if title else title


def detect_color(title: str) -> tuple[str, str]:
    """Match colour keywords as whole words to avoid e.g. 'red' inside 'flared'."""
    lower = " " + title.lower() + " "
    for name, hex_code in COLOR_KEYWORDS:
        pattern = re.escape(name.lower())
        if re.search(rf"(?<![a-z]){pattern}(?![a-z])", lower):
            return name, hex_code
    return DEFAULT_COLOR


def parse_sizes(raw: str) -> list[str]:
    if not raw:
        return ["FREE"]
    raw = str(raw)
    sizes = [s.strip().upper() for s in raw.split(",") if s.strip()]
    # Normalise common variants
    normalised = []
    for s in sizes:
        s = s.replace(" ", "")
        if s in ("FREESIZE", "FREE SIZE", "FREE"):
            normalised.append("FREE")
        else:
            normalised.append(s)
    # Keep only sizes our model supports.
    valid = {"XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL", "FREE"}
    return [s for s in normalised if s in valid] or ["FREE"]


def parse_images(main: str, all_images: str) -> list[str]:
    urls: list[str] = []
    if main and isinstance(main, str):
        urls.append(main.strip())
    if all_images and isinstance(all_images, str):
        for u in all_images.split(";"):
            u = u.strip()
            if u and u not in urls:
                urls.append(u)
    # Cap at 6 to keep DB tidy
    return urls[:6]


def derive_fabric_and_occasion(title: str, category: str) -> tuple[str, str]:
    lower = title.lower()
    fabric = ""
    for keyword in ["cotton silk", "cotton", "rayon", "georgette", "chiffon",
                    "linen", "silk", "modal", "crepe", "satin", "velvet",
                    "net", "chanderi", "banarasi", "kanjeevaram"]:
        if keyword in lower:
            fabric = keyword.title()
            break

    if "wedding" in lower or "bridal" in lower:
        occasion = "Wedding"
    elif "casual" in lower or "everyday" in lower:
        occasion = "Casual"
    elif "festive" in lower or "festival" in lower:
        occasion = "Festive"
    elif "lounge" in lower or "night" in lower or "sleep" in lower:
        occasion = "Loungewear"
    elif category in ("Shirt", "Top"):
        occasion = "Workwear"
    else:
        occasion = "Casual"
    return fabric, occasion


# ---- Command ----------------------------------------------------------------

class Command(BaseCommand):
    help = "Import products from the Tredific Excel sheet."

    def add_arguments(self, parser):
        parser.add_argument(
            "excel_path",
            help="Path to tredfit_products_info.xlsx",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Wipe products + variants + images first (keeps categories/colours).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Import only the first N rows (for testing).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            import pandas as pd
        except ImportError:
            raise CommandError(
                "pandas is required. Install with: pip install pandas openpyxl"
            )

        path = Path(options["excel_path"])
        if not path.exists():
            raise CommandError(f"File not found: {path}")

        df = pd.read_excel(path, sheet_name=0, header=None, skiprows=1)
        if df.shape[1] < 11:
            raise CommandError(
                f"Expected at least 11 columns, got {df.shape[1]}. "
                "Check the sheet structure."
            )
        df.columns = [
            "idx", "title", "category", "price", "mrp", "discount",
            "sizes", "in_stock", "source_url", "main_image", "all_images",
        ][: df.shape[1]] + list(range(df.shape[1] - 11))[:max(0, df.shape[1] - 11)]
        df = df.dropna(subset=["title"]).reset_index(drop=True)

        if options["limit"]:
            df = df.head(options["limit"])

        if options["reset"]:
            self.stdout.write("Resetting products…")
            ProductVariant.objects.all().delete()
            ProductImage.objects.all().delete()
            Product.objects.all().delete()

        # Pre-create categories
        cat_cache: dict[str, Category] = {}
        for raw_cat, clean_cat in CATEGORY_MAP.items():
            if clean_cat not in cat_cache:
                obj, _ = Category.objects.get_or_create(name=clean_cat)
                cat_cache[clean_cat] = obj

        # Pre-create colour rows on demand
        color_cache: dict[str, Color] = {
            c.name: c for c in Color.objects.all()
        }

        created = 0
        skipped = 0
        updated = 0

        for i, row in df.iterrows():
            try:
                raw_title = str(row["title"]).strip()
                if not raw_title or raw_title.lower() == "nan":
                    skipped += 1
                    continue

                title = clean_title(raw_title)
                slug = slugify(title)[:220]
                if not slug:
                    skipped += 1
                    continue

                raw_category = str(row["category"]).strip()
                category_name = CATEGORY_MAP.get(raw_category, "Other")
                if category_name not in cat_cache:
                    cat_cache[category_name], _ = Category.objects.get_or_create(
                        name=category_name
                    )
                category = cat_cache[category_name]

                # Pricing — sheet has price=sale, mrp=regular
                try:
                    sale_price = Decimal(str(row["price"])) if str(row["price"]) not in ("nan", "") else None
                except Exception:
                    sale_price = None
                try:
                    mrp = Decimal(str(row["mrp"])) if str(row["mrp"]) not in ("nan", "") else None
                except Exception:
                    mrp = None

                if not mrp and not sale_price:
                    skipped += 1
                    continue

                regular_price = mrp or sale_price
                effective_sale = sale_price if (sale_price and mrp and sale_price < mrp) else None

                in_stock = True
                try:
                    in_stock = bool(float(row.get("in_stock", 1)))
                except Exception:
                    pass

                color_name, color_hex = detect_color(title)
                if color_name not in color_cache:
                    color_cache[color_name], _ = Color.objects.get_or_create(
                        name=color_name, defaults={"hex_code": color_hex}
                    )
                color_obj = color_cache[color_name]

                fabric, occasion = derive_fabric_and_occasion(title, category_name)

                # Create or update product
                short_desc = title.split(" with ")[0]
                description = DEFAULT_DESCRIPTION_TEMPLATE.format(title=title)

                product, was_created = Product.objects.update_or_create(
                    slug=slug,
                    defaults=dict(
                        name=title,
                        category=category,
                        short_description=short_desc[:300],
                        description=description,
                        price=regular_price,
                        sale_price=effective_sale,
                        currency="INR",
                        fabric=fabric,
                        occasion=occasion,
                        care_instructions="Hand wash cold. Do not bleach. Iron on low heat.",
                        country_of_origin="India",
                        in_stock=in_stock,
                        is_featured=(i < 12),
                        status=Product.STATUS_PUBLISHED,
                        meta_title=f"{title} | Tredific®",
                        meta_description=short_desc[:300],
                    ),
                )

                if was_created:
                    created += 1
                else:
                    updated += 1
                    # Wipe images/variants on update so re-import is clean
                    product.images.all().delete()
                    product.variants.all().delete()

                # Images
                images = parse_images(row.get("main_image"), row.get("all_images"))
                for j, url in enumerate(images):
                    ProductImage.objects.create(
                        product=product,
                        image_url=url,
                        alt=f"{title} — view {j + 1}",
                        sort_order=j,
                        is_primary=(j == 0),
                    )

                # Variants — every (size × this product's colour).
                # NB: in this sheet the size string is in the column we named
                # "sizes" after the header rename above.
                sizes = parse_sizes(row.get("sizes"))
                for size in sizes:
                    ProductVariant.objects.update_or_create(
                        product=product,
                        size=size,
                        color=color_obj,
                        defaults={"stock": 10 if in_stock else 0},
                    )

            except Exception as e:
                self.stderr.write(f"Row {i} ({raw_title[:60]}): {e}")
                skipped += 1
                continue

            if (i + 1) % 100 == 0:
                self.stdout.write(f"  …{i + 1} rows processed")

        self.stdout.write(self.style.SUCCESS(
            f"\nImport complete. Created: {created}, Updated: {updated}, "
            f"Skipped: {skipped}, Total products now: {Product.objects.count()}"
        ))
