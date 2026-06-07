"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, Truck, Shield, RotateCcw, Ruler, Plus, Minus, Banknote, RefreshCcw, Timer,
  Heart, Pencil, ShieldCheck, MessageCircleHeart, Leaf, CheckCircle2, ThumbsUp, ThumbsDown, X
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
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [tab, setTab] = useState<"desc" | "details" | "shipping">("desc");
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0); // bump to force soft refresh
  const [reviewSort, setReviewSort] = useState("Most Recent");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [votedReviews, setVotedReviews] = useState<Record<number, "helpful" | "not_helpful">>({});
  const [activeReview, setActiveReview] = useState<typeof product.reviews[0] | null>(null);

  const handleVote = async (reviewId: number, voteType: "helpful" | "not_helpful") => {
    if (votedReviews[reviewId]) return;
    setVotedReviews(prev => ({ ...prev, [reviewId]: voteType }));
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      await fetch(`${apiUrl}/api/reviews/${reviewId}/vote/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: voteType }),
      });
      router.refresh(); // Refresh server data so the new counts come down
    } catch (e) {
      console.error(e);
    }
  };

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

  // Reviews calculations
  const totalReviews = product.reviews.length;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  product.reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating as keyof typeof ratingCounts]++;
    }
  });

  const sortedReviews = [...product.reviews].sort((a, b) => {
    if (reviewSort === "Most Recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (reviewSort === "Oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (reviewSort === "Highest Rating") return b.rating - a.rating;
    if (reviewSort === "Lowest Rating") return a.rating - b.rating;
    if (reviewSort === "Most images") return (b.media?.length || 0) - (a.media?.length || 0);
    return 0;
  });

  const displayedReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 5);

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
        <div className="min-w-0">
          <div 
            className="aspect-square md:aspect-[3/4] bg-neutral-100 mb-3 relative group cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomPos({ x, y });
              setShowZoom(true);
            }}
            onMouseLeave={() => setShowZoom(false)}
          >
            {product.images[activeImage] && (
              <img
                src={product.images[activeImage].src}
                alt={product.images[activeImage].alt || product.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-white/95 rounded-full p-2 shadow-sm inline-block">
                <WishlistButton productId={product.id} size={18} />
              </span>
            </div>
            {/* Zoom Portal */}
            {showZoom && product.images[activeImage] && (
              <div 
                className="hidden md:block absolute top-0 left-full ml-6 w-[500px] h-full bg-white z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200 pointer-events-none"
                style={{
                  backgroundImage: `url(${product.images[activeImage].src})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: "250%",
                  backgroundRepeat: "no-repeat"
                }}
              />
            )}
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
        <div className="min-w-0">
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
                {allColors.map((c) => {
                  const variantImg = product.variants.find((v) => v.color.name === c.name)?.src;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-[42px] h-[42px] rounded-full border p-0.5 overflow-hidden transition-all ${
                        c.name === selectedColor
                          ? "ring-1 ring-ink border-ink"
                          : "border-neutral-300 hover:border-ink"
                      }`}
                      aria-label={c.name}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
                        {variantImg ? (
                          <img src={variantImg} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full block" style={{ backgroundColor: c.hex_code }} />
                        )}
                      </div>
                    </button>
                  );
                })}
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
          <div className="mt-6 border-y border-neutral-200 py-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { Icon: RefreshCcw, h: "7 Day Easy Exchange" },
                { Icon: Truck, h: "Free Shipping" },
                { Icon: Banknote, h: "Cash on Delivery" },
                { Icon: Timer, h: "Express Shipping" },
              ].map(({ Icon, h }) => (
                <div key={h} className="flex flex-col items-center gap-2">
                  <Icon size={24} strokeWidth={1.5} className="text-[#f1865b]" />
                  <span className="text-[10px] md:text-xs font-semibold leading-tight text-neutral-800">{h}</span>
                </div>
              ))}
            </div>
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
                  {product.attributes && product.attributes.map((attr) => (
                    <li key={attr.id}><strong>{attr.name}:</strong> {attr.value}</li>
                  ))}
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
        {/* Title area */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-neutral-800">Customer Reviews</h2>
            <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
              <span>Real feedback from real customers</span>
              <Heart size={14} className="text-rust" />
            </div>
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="bg-[#b38264] text-white px-5 py-2.5 text-sm uppercase tracking-wider font-medium hover:bg-[#a17255] transition-colors flex items-center gap-2 rounded shadow-sm"
          >
            <Pencil size={16} /> WRITE A REVIEW
          </button>
        </div>

        {totalReviews === 0 ? (
          <p className="text-sm text-neutral-500">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <>
            {/* Aggregate box */}
            <div className="border border-[#f4f1ee] rounded-xl p-6 md:p-8 bg-[#faf9f8] grid md:grid-cols-3 gap-8 mb-10">
              {/* Left: 4.0 */}
              <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-200 pb-6 md:pb-0">
                <div className="text-6xl font-serif text-neutral-800 mb-3">{product.average_rating.toFixed(1)}</div>
                <div className="flex mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={20} className={i < Math.round(product.average_rating) ? "fill-[#fbbc04] text-[#fbbc04]" : "text-neutral-300"} />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">Based on {totalReviews} review{totalReviews !== 1 && 's'}</span>
              </div>

              {/* Middle: Bars */}
              <div className="flex flex-col justify-center space-y-3 border-b md:border-b-0 md:border-r border-neutral-200 pb-6 md:pb-0 pr-0 md:pr-8">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-2">{star}</span>
                    <Star size={14} className="fill-[#fbbc04] text-[#fbbc04]" />
                    <div className="flex-1 h-2 bg-[#f0e9e4] rounded-full overflow-hidden">
                      <div className="h-full bg-[#fbbc04] rounded-full" style={{ width: `${totalReviews ? (ratingCounts[star as keyof typeof ratingCounts] / totalReviews) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Badges */}
              <div className="flex flex-col justify-center space-y-6 pl-0 md:pl-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={26} className="text-[#b38264] mt-0.5" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">Verified Purchases</div>
                    <div className="text-xs text-neutral-500 mt-0.5">All reviews are from verified buyers</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircleHeart size={26} className="text-[#b38264] mt-0.5" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">Helpful & Honest</div>
                    <div className="text-xs text-neutral-500 mt-0.5">We value authentic feedback</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Leaf size={26} className="text-[#b38264] mt-0.5" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">Better Together</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Your reviews help others shop better</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sorting Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 pb-4 mb-6">
              <div className="font-medium text-lg text-neutral-800">{totalReviews} Review{totalReviews !== 1 && 's'}</div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <span className="hidden sm:inline">Sort by:</span>
                <select 
                  value={reviewSort} 
                  onChange={e => setReviewSort(e.target.value)}
                  className="border border-neutral-300 rounded-md px-3 py-1.5 outline-none focus:border-ink bg-white cursor-pointer"
                >
                  <option>Most Recent</option>
                  <option>Oldest</option>
                  <option>Highest Rating</option>
                  <option>Lowest Rating</option>
                  <option>Most Helpful</option>
                  <option>Most images</option>
                </select>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-8">
              {displayedReviews.map((r) => (
                <article key={r.id} className="border-b border-neutral-100 pb-8 last:border-0 last:pb-0">
                  {/* Stars and date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14}
                          className={i < r.rating ? "fill-[#fbbc04] text-[#fbbc04]" : "text-neutral-200"} />
                      ))}
                    </div>
                    <div className="text-xs text-neutral-400" suppressHydrationWarning>
                      {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-4">
                    {r.reviewer_image_url ? (
                      <button onClick={() => setActiveReview(r)} className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 flex-shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity" title="View Full Review">
                        <img src={r.reviewer_image_url} alt={r.name} className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-semibold border border-neutral-200 flex-shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-neutral-800">{r.name}</span>
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-100">
                          <CheckCircle2 size={12} /> Verified Buyer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review text */}
                  {r.title && <h4 className="font-semibold text-[15px] mb-2 text-neutral-900">{r.title}</h4>}
                  <p className="text-sm text-neutral-700 mb-4 leading-relaxed">{r.body}</p>

                  {/* Tags - static as per requirements */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs border border-neutral-200 px-3 py-1 rounded-full text-neutral-600 bg-neutral-50 shadow-sm">Great Quality</span>
                    <span className="text-xs border border-neutral-200 px-3 py-1 rounded-full text-neutral-600 bg-neutral-50 shadow-sm">Beautiful Color</span>
                    <span className="text-xs border border-neutral-200 px-3 py-1 rounded-full text-neutral-600 bg-neutral-50 shadow-sm">Soft Fabric</span>
                  </div>

                  {/* Images */}
                  {r.media && r.media.length > 0 && (
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                      {r.media.map((m) =>
                        m.kind === "video" ? (
                          <video key={m.id} src={m.src} controls className="h-28 w-28 object-cover bg-neutral-100 rounded-lg shadow-sm border border-neutral-200 flex-shrink-0" />
                        ) : (
                          <img key={m.id} src={m.src} alt="" className="h-28 w-28 object-cover bg-neutral-100 rounded-lg shadow-sm border border-neutral-200 flex-shrink-0" />
                        )
                      )}
                    </div>
                  )}

                  {/* Helpful buttons */}
                  <div className="flex items-center gap-4 mt-5 pt-5 border-t border-neutral-50">
                    <span className="text-sm text-neutral-500 font-medium">Was this review helpful?</span>
                    <button 
                      onClick={() => handleVote(r.id, "helpful")}
                      disabled={!!votedReviews[r.id]}
                      className={`flex items-center gap-1.5 border border-neutral-200 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${votedReviews[r.id] === 'helpful' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 bg-white disabled:opacity-50'}`}>
                      <ThumbsUp size={14} /> Helpful ({(r.helpful_votes || 0) + (votedReviews[r.id] === 'helpful' ? 1 : 0)})
                    </button>
                    <button 
                      onClick={() => handleVote(r.id, "not_helpful")}
                      disabled={!!votedReviews[r.id]}
                      className={`flex items-center gap-1.5 border border-neutral-200 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${votedReviews[r.id] === 'not_helpful' ? 'bg-rust/10 text-rust border-rust/20' : 'text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 bg-white disabled:opacity-50'}`}>
                      <ThumbsDown size={14} /> Not Helpful ({(r.not_helpful_votes || 0) + (votedReviews[r.id] === 'not_helpful' ? 1 : 0)})
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* See all button */}
            {!showAllReviews && sortedReviews.length > 5 && (
              <div className="mt-10 text-center">
                <button 
                  onClick={() => setShowAllReviews(true)} 
                  className="border border-ink text-ink px-10 py-3 text-sm font-medium hover:bg-ink hover:text-white transition-colors uppercase tracking-widest rounded-md"
                >
                  See all reviews
                </button>
              </div>
            )}
          </>
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

      {/* Pop-up Review Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActiveReview(null)}>
          <div 
            className="relative bg-white max-w-4xl w-full flex flex-col md:flex-row overflow-hidden rounded-xl shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveReview(null)} 
              className="absolute top-4 right-4 z-10 bg-white/60 hover:bg-white rounded-full p-2 text-neutral-800 transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
            
            {/* Left side: Reviewer image */}
            {activeReview.reviewer_image_url && (
              <div className="w-full md:w-2/5 h-[300px] md:h-auto shrink-0 relative bg-neutral-100">
                <img src={activeReview.reviewer_image_url} alt={activeReview.name} className="w-full h-full object-cover absolute inset-0" />
              </div>
            )}
            
            {/* Right side: Review details */}
            <div className={`p-8 ${!activeReview.reviewer_image_url ? 'w-full' : 'w-full md:w-3/5'} flex flex-col`}>
               <div className="flex items-center justify-between mb-4">
                 <div className="flex">
                   {Array.from({ length: 5 }).map((_, i) => (
                     <Star key={i} size={18} className={i < activeReview.rating ? "fill-[#fbbc04] text-[#fbbc04]" : "text-neutral-200"} />
                   ))}
                 </div>
                 <div className="text-sm text-neutral-400" suppressHydrationWarning>
                   {new Date(activeReview.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                 </div>
               </div>
               
               <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-4">
                 <span className="font-semibold text-lg text-neutral-800">{activeReview.name}</span>
                 <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-100">
                   <CheckCircle2 size={12} /> Verified Buyer
                 </span>
               </div>
               
               {activeReview.title && <h4 className="font-bold text-xl mb-3 text-neutral-900">{activeReview.title}</h4>}
               <p className="text-neutral-700 mb-8 leading-relaxed text-base">{activeReview.body}</p>
               
               {/* Product reference in popup */}
               <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-lg mt-auto border border-neutral-100">
                 <img src={product.images[0]?.src} alt={product.name} className="w-16 h-16 object-cover rounded shadow-sm" />
                 <div>
                   <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Reviewed Product</p>
                   <p className="font-medium text-sm text-neutral-900 line-clamp-1">{product.name}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
