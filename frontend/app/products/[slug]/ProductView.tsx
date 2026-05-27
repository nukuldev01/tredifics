"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, Truck, Shield, RotateCcw, Ruler, Plus, Minus, Banknote,
} from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/lib/cart";
import Price from "@/components/Price";
import WishlistButton from "@/components/WishlistButton";
import ReviewModal from "@/components/ReviewModal";
import FAQAccordion from "@/components/FAQAccordion";
import ShowcaseGrid from "@/components/ShowcaseGrid";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";
import Breadcrumbs from "@/components/Breadcrumbs";
import { pushRecentlyViewed } from "@/lib/recentlyViewed";

export default function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSize = (searchParams?.get("size") || "").toUpperCase();

  const allColors = useMemo(
    () => Array.from(
      new Map(product.variants.map((v) => [v.color.id, v.color])).values()
    ),
    [product]
  );
  const allSizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))),
    [product]
  );

  const [selectedColor, setSelectedColor] = useState(allColors[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState(
    preselectedSize && allSizes.includes(preselectedSize) ? preselectedSize : ""
  );
  useEffect(() => {
    if (preselectedSize && allSizes.includes(preselectedSize)) {
      setSelectedSize(preselectedSize);
    }
  }, [preselectedSize, allSizes]);

  // Track recently viewed
  useEffect(() => {
    pushRecentlyViewed(product.slug);
  }, [product.slug]);

  const [activeImage, setActiveImage] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [tab, setTab] = useState<"desc" | "details" | "shipping">("desc");
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0); // bump to force soft refresh

  const variant: ProductVariant | undefined = product.variants.find(
    (v) => v.color.name === selectedColor && v.size === selectedSize
  );
  const inStock = !!variant && variant.stock > 0;

  const sizeIsAvailable = (size: string) =>
    product.variants.some(
      (v) => v.size === size && v.color.name === selectedColor && v.stock > 0
    );

  const add = useCart((s) => s.add);

  const handleAdd = (afterAdd?: () => void) => {
    if (!selectedSize) {
      setFeedback("Please choose a size.");
      return;
    }
    if (!variant) {
      setFeedback("That combination is unavailable.");
      return;
    }
    if (variant.stock < qty) {
      setFeedback(`Only ${variant.stock} in stock.`);
      return;
    }
    add({
      variant_id: variant.id,
      product_slug: product.slug,
      name: product.name,
      size: variant.size,
      color: variant.color.name,
      unit_price: variant.effective_price,
      currency: product.currency,
      quantity: qty,
      image: product.images[0]?.src || "",
    });
    setFeedback("Added to bag!");
    setTimeout(() => setFeedback(""), 1800);
    if (afterAdd) afterAdd();
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setFeedback("Please choose a size to continue.");
      return;
    }
    if (!variant || variant.stock < qty) {
      setFeedback("Please pick an available variant.");
      return;
    }
    handleAdd(() => router.push("/checkout"));
  };

  // Delivery estimate range (very rough — admin Shipping Rates power real numbers)
  const today = new Date();
  const min = new Date(today); min.setDate(min.getDate() + 4);
  const max = new Date(today); max.setDate(max.getDate() + 8);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const deliveryRange = `${fmt(min)} – ${fmt(max)}`;

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mb-6">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: product.category, href: `/collections/${product.category}` },
            { label: product.name },
          ]}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="aspect-square md:aspect-[3/4] bg-neutral-100 mb-3 overflow-hidden relative group">
            {product.images[activeImage] && (
              <img
                src={product.images[activeImage].src}
                alt={product.images[activeImage].alt || product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute top-3 right-3">
              <span className="bg-white/95 rounded-full p-2 shadow-sm">
                <WishlistButton productId={product.id} size={18} />
              </span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={`w-16 h-20 md:w-20 md:h-24 flex-shrink-0 border ${
                  i === activeImage ? "border-ink" : "border-transparent"
                }`}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {product.category}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl mt-2">{product.name}</h1>

          {product.review_count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14}
                    className={i < Math.round(product.average_rating)
                      ? "fill-[#fbbc04] text-[#fbbc04]" : "text-neutral-300"} />
                ))}
              </div>
              <span className="text-xs text-neutral-500">
                {product.average_rating} · {product.review_count} reviews
              </span>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-medium">
              <Price amount={product.effective_price} />
            </span>
            {product.sale_price && (
              <>
                <span className="text-neutral-400 line-through">
                  <Price amount={product.price} />
                </span>
                <span className="text-rust text-sm">
                  Save {product.discount_percent}%
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Inclusive of all taxes · SKU {product.sku}
          </p>

          <p className="mt-5 text-neutral-700">{product.short_description}</p>

          {/* Color */}
          {allColors.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span>Color: <strong>{selectedColor}</strong></span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {allColors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-8 h-8 rounded-full border ${
                      c.name === selectedColor
                        ? "ring-2 ring-ink ring-offset-2"
                        : "border-neutral-300"
                    }`}
                    style={{ background: c.hex_code }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Size</span>
              <button
                className="inline-flex items-center gap-1 text-xs underline"
                onClick={() => setShowSizeChart(true)}
              >
                <Ruler size={12} /> Size chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((s) => {
                const available = sizeIsAvailable(s);
                return (
                  <button
                    key={s}
                    disabled={!available}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-12 px-3 py-2 text-sm border transition-colors ${
                      s === selectedSize
                        ? "border-ink bg-ink text-white"
                        : available
                        ? "border-neutral-300 hover:border-ink"
                        : "border-neutral-200 text-neutral-400 line-through"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity + Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center border border-neutral-300">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2" aria-label="Decrease">
                <Minus size={14} />
              </button>
              <span className="px-4 text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2" aria-label="Increase">
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => handleAdd()}
              disabled={selectedSize !== "" && !inStock}
              className="hidden md:flex flex-1 border border-ink text-ink py-3 text-sm font-medium uppercase tracking-wider disabled:opacity-50 items-center justify-center hover:bg-ink hover:text-white transition-colors"
            >
              {selectedSize !== "" && !inStock ? "Sold out" : "Add to bag"}
            </button>
          </div>

          {/* Buy Now + Wishlist (desktop) */}
          <div className="hidden md:flex mt-3 gap-3 items-stretch">
            <button
              onClick={handleBuyNow}
              disabled={selectedSize !== "" && !inStock}
              className="flex-1 bg-ink text-white py-3 text-sm font-medium uppercase tracking-wider disabled:bg-neutral-300"
            >
              Buy now
            </button>
            <div className="border border-neutral-300 px-4 flex items-center">
              <WishlistButton productId={product.id} size={18} showLabel />
            </div>
          </div>

          {feedback && <p className="mt-2 text-xs text-rust">{feedback}</p>}

          {/* Sticky CTA bar — mobile only */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-3 py-2.5 z-30 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
            <div className="border border-neutral-300 px-3 flex items-center">
              <WishlistButton productId={product.id} size={20} />
            </div>
            <button
              onClick={() => handleAdd()}
              disabled={selectedSize !== "" && !inStock}
              className="flex-1 border border-ink text-ink py-3 text-xs font-medium uppercase tracking-wider disabled:opacity-50"
            >
              {!selectedSize ? "Add" : inStock ? "Add to bag" : "Sold out"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={selectedSize !== "" && !inStock}
              className="flex-1 bg-ink text-white py-3 text-xs font-medium uppercase tracking-wider disabled:bg-neutral-300"
            >
              Buy now
            </button>
          </div>

          {/* Delivery + COD */}
          <div className="mt-6 border border-neutral-200 p-4 text-sm space-y-2 bg-cream/40">
            <div className="flex items-center gap-2 text-neutral-700">
              <Truck size={16} />
              <span>
                Estimated delivery <strong><span suppressHydrationWarning>{deliveryRange}</span></strong>{" "}
                <span className="text-neutral-500">
                  (4–8 business days, India)
                </span>
              </span>
            </div>
            {product.cod_available !== false && (
              <div className="flex items-center gap-2 text-neutral-700">
                <Banknote size={16} />
                <span>Cash on Delivery available across India</span>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-neutral-600 border-y border-neutral-200 py-4">
            <div className="flex items-center gap-2"><Truck size={16} /> Worldwide shipping</div>
            <div className="flex items-center gap-2"><RotateCcw size={16} /> 30-day returns</div>
            <div className="flex items-center gap-2"><Shield size={16} /> Secure checkout</div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-6 border-b border-neutral-200 text-sm">
              {[
                ["desc", "Description"],
                ["details", "Details"],
                ["shipping", "Shipping"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k as any)}
                  className={`py-3 border-b-2 ${
                    tab === k ? "border-ink" : "border-transparent text-neutral-500"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="py-4 text-sm text-neutral-700 leading-relaxed">
              {tab === "desc" && <p>{product.description}</p>}
              {tab === "details" && (
                <ul className="space-y-1.5">
                  {product.fabric && <li><strong>Fabric:</strong> {product.fabric}</li>}
                  {product.occasion && <li><strong>Occasion:</strong> {product.occasion}</li>}
                  {product.care_instructions && (
                    <li><strong>Care:</strong> {product.care_instructions}</li>
                  )}
                  {product.country_of_origin && (
                    <li><strong>Country of origin:</strong> {product.country_of_origin}</li>
                  )}
                </ul>
              )}
              {tab === "shipping" && (
                <div className="space-y-2">
                  <p>Standard shipping: 7–14 business days. Express: 3–6 days.</p>
                  <p>Shipping cost is calculated at checkout based on destination.</p>
                  <p>Free standard shipping in India over ₹1999.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Showcase */}
      <ShowcaseGrid items={product.showcase || []} />

      {/* FAQs */}
      <FAQAccordion faqs={product.faqs || []} />

      {/* Reviews */}
      <section className="border-t border-neutral-200 mt-12 pt-10" key={reviewsKey}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl">Customer Reviews</h2>
            {product.review_count > 0 && (
              <p className="text-sm text-neutral-500 mt-1">
                {product.average_rating}★ · {product.review_count} reviews
              </p>
            )}
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="border border-ink text-ink px-5 py-2.5 text-sm uppercase tracking-wider hover:bg-ink hover:text-white transition-colors"
          >
            Add your review
          </button>
        </div>

        {product.reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {product.reviews.map((r) => (
              <article key={r.id} className="border border-neutral-200 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12}
                        className={i < r.rating ? "fill-[#fbbc04] text-[#fbbc04]" : "text-neutral-300"} />
                    ))}
                  </div>
                  {r.title && <span className="text-xs font-medium">{r.title}</span>}
                </div>
                <p className="text-sm text-neutral-700">{r.body}</p>
                {r.media && r.media.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {r.media.map((m) =>
                      m.kind === "video" ? (
                        <video
                          key={m.id}
                          src={m.src}
                          controls
                          className="h-24 w-24 object-cover bg-neutral-100"
                        />
                      ) : (
                        <img
                          key={m.id}
                          src={m.src}
                          alt=""
                          className="h-24 w-24 object-cover bg-neutral-100"
                        />
                      )
                    )}
                  </div>
                )}
                <p className="text-xs text-neutral-500 mt-3">
                  — {r.name} · <span suppressHydrationWarning>{new Date(r.created_at).toLocaleDateString()}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Related + Recently Viewed */}
      <RelatedProducts slug={product.slug} />
      <RecentlyViewed excludeSlug={product.slug} />

      {/* Review submission modal */}
      <ReviewModal
        productId={product.id}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSubmitted={() => {
          setReviewsKey((k) => k + 1);
          router.refresh();
        }}
      />

      {/* Size chart modal */}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSizeChart(false)}
          />
          <div className="relative bg-white max-w-2xl w-full p-6 max-h-[80vh] overflow-auto">
            <h3 className="font-serif text-xl mb-4">Size Chart</h3>
            <img
              src="/size-chart.png"
              alt="Tredific Size Chart"
              className="w-full h-auto"
              onError={(e) => {
                // Fallback if no /public/size-chart.png uploaded yet
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <table className="w-full text-sm mt-4">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-left">Bust (in)</th>
                  <th className="p-2 text-left">Waist (in)</th>
                  <th className="p-2 text-left">Hip (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["XS", "32", "26", "35"],
                  ["S", "34", "28", "37"],
                  ["M", "36", "30", "39"],
                  ["L", "38", "32", "41"],
                  ["XL", "40", "34", "43"],
                  ["XXL", "42", "36", "45"],
                  ["3XL", "44", "38", "47"],
                  ["4XL", "46", "40", "49"],
                  ["5XL", "48", "42", "51"],
                  ["6XL", "50", "44", "53"],
                  ["7XL", "52", "46", "55"],
                ].map(([s, b, w, h]) => (
                  <tr key={s} className="border-t">
                    <td className="p-2 font-medium">{s}</td>
                    <td className="p-2">{b}</td>
                    <td className="p-2">{w}</td>
                    <td className="p-2">{h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setShowSizeChart(false)}
              className="mt-4 px-4 py-2 bg-ink text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
