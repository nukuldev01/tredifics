"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const { data } = useSWR(
    q.length >= 2 ? `/products/?search=${encodeURIComponent(q)}` : null,
    fetcher
  );
  const products = data?.results || [];
  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-12">
      <h1 className="font-serif text-3xl mb-6">Search</h1>
      <input
        autoFocus
        placeholder="Search kurtis, sarees, dresses…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full border border-neutral-300 px-4 py-3 text-base"
      />
      {q.length >= 2 && (
        <p className="text-xs text-neutral-500 mt-2">
          {products.length} {products.length === 1 ? "result" : "results"}
        </p>
      )}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8">
        {products.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
