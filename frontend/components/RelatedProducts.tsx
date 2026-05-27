"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import ProductCard from "./ProductCard";
import type { ProductListItem } from "@/lib/types";

export default function RelatedProducts({ slug }: { slug: string }) {
  const { data } = useSWR<ProductListItem[]>(
    `/products/${slug}/related/`, fetcher
  );
  const products = data || [];
  if (products.length === 0) return null;
  return (
    <section className="border-t border-neutral-200 mt-12 pt-10">
      <h2 className="font-serif text-2xl md:text-3xl mb-6">
        You may also love
      </h2>
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
