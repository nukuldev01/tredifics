"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { ProductListItem } from "@/lib/types";
import Price from "@/components/Price";

type Props = {
  slug: string;
  categoryName: string;
  categoryDescription: string;
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL"];

const SORTS = [
  { v: "-created_at", l: "Newest" },
  { v: "price", l: "Price: Low to High" },
  { v: "-price", l: "Price: High to Low" },
  { v: "name", l: "A to Z" },
];

export default function CollectionView({
  slug,
  categoryName,
  categoryDescription,
}: Props) {
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (slug !== "all") p.set("category", slug);
    if (colors.length) p.set("color", colors.join(","));
    if (sizes.length) p.set("size", sizes.join(","));
    if (minPrice) p.set("min_price", minPrice);
    if (maxPrice) p.set("max_price", maxPrice);
    if (sort) p.set("ordering", sort);
    p.set("page_size", "24");
    return p.toString();
  }, [slug, colors, sizes, minPrice, maxPrice, sort]);

  const { data, isLoading } = useSWR(`/products/?${query}`, fetcher);
  const { data: facets } = useSWR(`/products/facets/?${query}`, fetcher);
  const { data: colorMaster } = useSWR(`/colors/`, fetcher);

  const products: ProductListItem[] = data?.results || [];
  const count = data?.count ?? 0;

  const toggle = (
    setter: (v: string[]) => void,
    list: string[],
    val: string
  ) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const clearAll = () => {
    setColors([]);
    setSizes([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const FilterPanel = () => (
    <div className="space-y-6 text-sm">
      <details className="filter-section group" open>
        <summary className="flex items-center justify-between py-2 border-b border-neutral-200 font-medium">
          Color
          <ChevronDown size={16} className="group-open:rotate-180 transition" />
        </summary>
        <ul className="pt-3 space-y-2 max-h-56 overflow-auto">
          {(colorMaster || []).map((c: any) => (
            <li key={c.id}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={colors.includes(c.name)}
                  onChange={() => toggle(setColors, colors, c.name)}
                />
                <span
                  className="inline-block w-4 h-4 rounded-full border border-neutral-300"
                  style={{ background: c.hex_code }}
                />
                <span>{c.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </details>

      <details className="filter-section group" open>
        <summary className="flex items-center justify-between py-2 border-b border-neutral-200 font-medium">
          Size
          <ChevronDown size={16} className="group-open:rotate-180 transition" />
        </summary>
        <div className="pt-3 grid grid-cols-3 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle(setSizes, sizes, s)}
              className={`border px-2 py-1.5 text-xs ${
                sizes.includes(s)
                  ? "border-ink bg-ink text-white"
                  : "border-neutral-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </details>

      <details className="filter-section group" open>
        <summary className="flex items-center justify-between py-2 border-b border-neutral-200 font-medium">
          Price
          <ChevronDown size={16} className="group-open:rotate-180 transition" />
        </summary>
        <div className="pt-3 flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="border border-neutral-300 px-2 py-1.5 text-xs w-1/2"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="border border-neutral-300 px-2 py-1.5 text-xs w-1/2"
          />
        </div>
        {facets && (
          <p className="text-[11px] text-neutral-500 mt-2">
            From <Price amount={facets.min_price} /> to <Price amount={facets.max_price} />
          </p>
        )}
      </details>

      <button
        onClick={clearAll}
        className="text-xs underline text-neutral-600 hover:text-ink"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="max-w-page mx-auto px-4 md:px-8">
      <div className="py-8 md:py-12">
        <p className="text-xs text-neutral-500 uppercase tracking-widest">
          Collection
        </p>
        <h1 className="font-serif text-3xl md:text-5xl mt-1">{categoryName}</h1>
        {categoryDescription && (
          <p className="mt-2 text-neutral-600 max-w-2xl">{categoryDescription}</p>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-y border-neutral-200 py-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden inline-flex items-center gap-1 border border-neutral-300 px-3 py-1.5"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          <span className="text-neutral-500">
            {count} {count === 1 ? "product" : "products"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500 hidden md:inline">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-neutral-300 px-3 py-1.5 text-sm bg-white"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-8 pb-20">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-60 shrink-0">
          <FilterPanel />
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-neutral-500">
              No products match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-white max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-medium">Filters</h3>
              <button onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel />
            </div>
            <div className="sticky bottom-0 bg-white border-t p-3">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full bg-ink text-white py-3 text-sm"
              >
                Show {count} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
