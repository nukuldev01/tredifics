import type { Product } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tredific.com";

export default function ProductSchema({ product }: { product: Product }) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description,
    sku: product.sku,
    image: product.images.map((i) => i.src),
    brand: { "@type": "Brand", name: "Tredific®" },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SITE}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.effective_price,
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.average_rating,
        reviewCount: product.review_count,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
