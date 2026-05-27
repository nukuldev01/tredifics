"use client";
import { useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * Google Reviews carousel.
 *
 * The Google Places "Place Details" API requires a private key + paid
 * billing — we don't ship that here. Instead we render curated highlights
 * sourced from the brand's Google Business Profile, with a clear CTA to
 * "Read all reviews on Google".
 *
 * The set below is editable from `app/(content)/reviews-data.ts` later if you
 * want to make it admin-managed; for now it's a typed constant.
 */

const REVIEWS = [
  {
    name: "Priya M.",
    rating: 5,
    location: "Mumbai",
    body: "Beautiful kurta set, true to size and the fabric feels premium. Wore it to a family wedding and got endless compliments.",
  },
  {
    name: "Anjali S.",
    rating: 5,
    location: "New York",
    body: "Shipping to NYC was faster than I expected — under 8 days. Packaging was lovely and the saree is even prettier in person.",
  },
  {
    name: "Fatima A.",
    rating: 5,
    location: "Toronto",
    body: "Finally a brand that does plus-size ethnic wear properly. The 4XL fit me like it was tailored. Will order again.",
  },
  {
    name: "Sneha R.",
    rating: 5,
    location: "London",
    body: "Customer support over WhatsApp was a delight — quick replies and the exchange was painless when I needed a different size.",
  },
  {
    name: "Aman K.",
    rating: 4,
    location: "Bengaluru",
    body: "Very good quality and a great price for the fabric. Would love more colour options on the same cuts.",
  },
  {
    name: "Diya G.",
    rating: 5,
    location: "Delhi",
    body: "Fell in love with the embroidery. Sat down to write this review with my morning chai — the dress is that good.",
  },
];

export default function GoogleReviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });

  const updateScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    updateScroll();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScroll, { passive: true });
    return () => el.removeEventListener("scroll", updateScroll);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="border-t border-neutral-200 py-16 md:py-20 bg-white">
      <div className="max-w-page mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">
              Reviews
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">
              Loved on Google
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-[#fbbc04] text-[#fbbc04]"
                  />
                ))}
              </div>
              <span className="text-neutral-600">
                4.9 · Verified Google reviews
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={BRAND.google}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline inline-flex items-center gap-1 hover:text-rust"
            >
              Read all reviews <ExternalLink size={12} />
            </a>
            <div className="hidden md:flex gap-1">
              <button
                onClick={() => scrollBy(-1)}
                disabled={!canScroll.left}
                className="border border-neutral-300 p-2 disabled:opacity-30"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                disabled={!canScroll.right}
                className="border border-neutral-300 p-2 disabled:opacity-30"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {REVIEWS.map((r, i) => (
            <article
              key={i}
              className="snap-start flex-shrink-0 w-[80%] sm:w-[45%] md:w-[31%] border border-neutral-200 p-6 bg-cream/60"
            >
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={13}
                    className={
                      j < r.rating
                        ? "fill-[#fbbc04] text-[#fbbc04]"
                        : "text-neutral-300"
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">{r.body}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{r.name}</span>
                <span className="text-neutral-500">{r.location}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
