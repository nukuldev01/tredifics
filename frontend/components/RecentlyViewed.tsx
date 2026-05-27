"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import ProductCard from "./ProductCard";
import type { ProductListItem } from "@/lib/types";

export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    const slugs = getRecentlyViewed(excludeSlug).slice(0, 8);
    if (slugs.length === 0) return;
    let alive = true;
    Promise.all(
      slugs.map((s) =>
        api.get(`/products/${s}/`).then((r) => r.data).catch(() => null)
      )
    ).then((items) => {
      if (!alive) return;
      setProducts(items.filter(Boolean) as any);
    });
    return () => {
      alive = false;
    };
  }, [excludeSlug]);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 mt-12 pt-10">
      <h2 className="font-serif text-2xl md:text-3xl mb-6">Recently Viewed</h2>
      <div className="flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0"
           style={{ scrollbarWidth: "none" }}>
        {products.map((p) => (
          <div key={p.id}
               className="snap-start flex-shrink-0 w-[48%] sm:w-[32%] md:w-[22%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
