"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetcher } from "@/lib/api";

type Banner = {
  id: number;
  kind: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  src: string;
  mobile_src: string;
  image_alt: string;
  cta_label: string;
  cta_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
  overlay_opacity: number;
};

const AUTO_ADVANCE_MS = 5000;

/** Fallback used when admin hasn't uploaded any banners yet. */
const FALLBACK: Banner[] = [
  {
    id: 0,
    kind: "brand_story",
    eyebrow: "Crafted in India",
    headline: "Hands that weave, hearts that wear.",
    subheadline:
      "Every Tredific® piece is shaped by an artisan and shipped to someone who'll love it.",
    src: "https://images.unsplash.com/photo-1610189025034-9c4101924b1c?w=1800",
    mobile_src: "https://images.unsplash.com/photo-1610189025034-9c4101924b1c?w=900",
    image_alt: "Artisan working on traditional Indian fabric",
    cta_label: "Discover the collection",
    cta_url: "/collections/all",
    cta_secondary_label: "Our story",
    cta_secondary_url: "/pages/about-us",
    overlay_opacity: 30,
  },
];

export default function BannerCarousel({
  banners: initialBanners,
}: {
  banners?: Banner[];
} = {}) {
  const { data } = useSWR<Banner[]>("/content/banners/", fetcher, {
    fallbackData:
      initialBanners && initialBanners.length > 0 ? initialBanners : undefined,
  });
  const banners = data && data.length > 0 ? data : FALLBACK;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance
  useEffect(() => {
    if (banners.length < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, paused]);

  const goto = (i: number) => {
    setActive((i + banners.length) % banners.length);
  };

  return (
    <section
      className="relative h-[70vh] min-h-[480px] md:h-[80vh] overflow-hidden bg-cream"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Tredific hero"
    >
      {banners.map((b, i) => (
        <article
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === active ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          aria-hidden={i !== active}
        >
          <picture>
            <source media="(max-width: 768px)" srcSet={b.mobile_src || b.src} />
            <img
              src={b.src}
              alt={b.image_alt || b.headline}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </picture>
          <div
            className="absolute inset-0"
            style={{ background: `rgba(0,0,0,${(b.overlay_opacity ?? 30) / 100})` }}
          />
          <div className="relative h-full max-w-page mx-auto px-4 md:px-8 flex flex-col justify-end pb-14 md:pb-24 text-white">
            {b.eyebrow && (
              <p className="text-xs tracking-[0.25em] uppercase opacity-90 mb-3">
                {b.eyebrow}
              </p>
            )}
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl max-w-3xl leading-tight">
              {b.headline}
            </h1>
            {b.subheadline && (
              <p className="mt-4 max-w-md text-base md:text-lg opacity-90">
                {b.subheadline}
              </p>
            )}
            {(b.cta_label || b.cta_secondary_label) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {b.cta_label && (
                  <Link
                    href={b.cta_url || "#"}
                    className="inline-flex items-center bg-white text-ink px-6 py-3 text-sm font-medium hover:bg-neutral-100"
                  >
                    {b.cta_label}
                  </Link>
                )}
                {b.cta_secondary_label && (
                  <Link
                    href={b.cta_secondary_url || "#"}
                    className="inline-flex items-center border border-white text-white px-6 py-3 text-sm font-medium hover:bg-white hover:text-ink transition"
                  >
                    {b.cta_secondary_label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </article>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={() => goto(active - 1)}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-2 text-ink"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goto(active + 1)}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-2 text-ink"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goto(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 transition-all ${
                  i === active
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/80 w-3"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
