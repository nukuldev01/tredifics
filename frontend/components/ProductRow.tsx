"use client";
import { useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { fetcher } from "@/lib/api";
import type { ProductListItem } from "@/lib/types";

type Props = {
  title: string;
  subtitle?: string;
  query: string;            // e.g. "featured=true" or "category=kurti"
  href: string;             // "View all" target
  limit?: number;
};

/**
 * Horizontal-scrolling row of product cards — used for "New Arrivals",
 * "Bestsellers", category previews on the homepage.
 */
export default function ProductRow({
  title,
  subtitle,
  query,
  href,
  limit = 8,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { data } = useSWR<{ results: ProductListItem[] }>(
    `/products/?${query}&page_size=${limit}`,
    fetcher
  );
  const products = data?.results || [];

  if (products.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-page mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-4xl">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-neutral-600 text-sm">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href={href} className="text-sm underline">
              View all
            </Link>
            <div className="hidden md:flex gap-1">
              <button
                onClick={() => scrollBy(-1)}
                className="border border-neutral-300 p-2 hover:border-ink"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                className="border border-neutral-300 p-2 hover:border-ink"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        <div
          ref={trackRef}
          className="flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="snap-start flex-shrink-0 w-[48%] sm:w-[32%] md:w-[24%]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
