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
            <span className="absolute bottom-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
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
          <h3 className="text-sm md:text-base font-normal leading-snug truncate border-b border-transparent hover:border-ink inline-block transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-1 mt-1 text-sm font-medium text-neutral-800">
            <span className="text-[#fba33e] flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={`w-[14px] h-[14px] ${i <= Math.round(product.average_rating || 0) ? 'fill-current' : 'fill-neutral-300'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </span>
            <span className="ml-0.5 text-xs font-semibold">{product.average_rating ? product.average_rating.toFixed(1) : "New"}</span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-2">
            {product.sale_price && (
              <span className="text-[#a58d7e] font-semibold line-through text-sm">
                <Price amount={product.price} />
              </span>
            )}
            <span className="font-bold text-base md:text-lg text-black tracking-tight">
              <Price amount={product.effective_price} />
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-3 pb-4 flex flex-col gap-2">
        {product.colors && product.colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.colors.map((c) => (
              <Link
                key={c.name}
                href={`/products/${product.slug}?color=${encodeURIComponent(c.name)}`}
                className="w-[26px] h-[26px] rounded-full border border-neutral-300 overflow-hidden hover:border-ink transition-all flex items-center justify-center bg-neutral-100 p-0.5"
                title={c.name}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  {c.src ? (
                    <img src={c.src} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full block" style={{ backgroundColor: c.hex_code }} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {sortedSizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sortedSizes.slice(0, 6).map((size) => (
              <Link
                key={size}
                href={`/products/${product.slug}?size=${encodeURIComponent(size)}`}
                prefetch={false}
                aria-label={`View ${product.name} in size ${size}`}
                className="text-[11px] font-medium leading-none border px-2 py-1.5 rounded-full border-neutral-300 text-neutral-600 hover:border-[#f1865b] hover:text-[#f1865b] transition-colors"
              >
                {size}
              </Link>
            ))}
            {sortedSizes.length > 6 && (
              <span className="text-[11px] font-medium leading-none px-2 py-1.5 text-neutral-500">
                +{sortedSizes.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
