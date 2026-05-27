import Link from "next/link";
import type { ProductListItem } from "@/lib/types";
import Price from "@/components/Price";

const SIZE_ORDER = [
  "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL", "FREE",
];

export default function ProductCard({ product }: { product: ProductListItem }) {
  const primary = product.images[0]?.src;
  const secondary = product.images[1]?.src || primary;
  const sortedSizes = product.sizes
    .slice()
    .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  return (
    <article className="product-card group block">
      {/* Card body — image + title + price — wraps to product page */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
          {primary && (
            <img
              src={primary}
              alt={product.images[0]?.alt || product.name}
              className="img-primary absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
          )}
          {secondary && (
            <img
              src={secondary}
              alt=""
              className="img-secondary absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {product.discount_percent > 0 && (
            <span className="absolute top-3 left-3 bg-white/95 text-ink text-[11px] font-medium px-2 py-1">
              {product.discount_percent}% OFF
            </span>
          )}
          {!product.in_stock && (
            <span className="absolute bottom-3 left-3 bg-white/95 text-ink text-[11px] font-medium px-2 py-1">
              Sold out
            </span>
          )}
        </div>
        <div className="pt-3">
          <h3 className="text-sm font-normal leading-snug">{product.name}</h3>
          <div className="mt-1 flex items-baseline gap-2 text-sm">
            <span className="font-medium">
              <Price amount={product.effective_price} />
            </span>
            {product.sale_price && (
              <span className="text-neutral-400 line-through text-xs">
                <Price amount={product.price} />
              </span>
            )}
          </div>
          {product.colors.length > 1 && (
            <p className="text-xs text-neutral-500 mt-1">
              {product.colors.length} colours
            </p>
          )}
        </div>
      </Link>

      {/* Size pills — each one is its own link that pre-selects that size on PDP */}
      {sortedSizes.length > 0 && (
        <div className="mt-2 pb-6 flex flex-wrap gap-1">
          {sortedSizes.slice(0, 6).map((size) => (
            <Link
              key={size}
              href={`/products/${product.slug}?size=${encodeURIComponent(size)}`}
              prefetch={false}
              aria-label={`View ${product.name} in size ${size}`}
              className="text-[10px] leading-none border px-1.5 py-1 rounded-full border-neutral-300 text-neutral-600 hover:border-ink hover:text-ink transition-colors"
            >
              {size}
            </Link>
          ))}
          {sortedSizes.length > 6 && (
            <span className="text-[10px] leading-none px-1.5 py-1 text-neutral-500">
              +{sortedSizes.length - 6}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
