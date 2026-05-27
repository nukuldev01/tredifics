"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const user = useAuth((s) => s.user);
  const { rows, isLoading } = useWishlist();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Your wishlist</h1>
        <p className="mt-3 text-neutral-600">
          Sign in to save your favourite pieces across devices.
        </p>
        <Link
          href={"/account?next=" + encodeURIComponent("/account/wishlist")}
          className="inline-block mt-6 bg-ink text-white px-6 py-3 text-sm uppercase tracking-wider"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Saved for later
          </p>
          <h1 className="font-serif text-3xl md:text-4xl mt-1">Your Wishlist</h1>
        </div>
        <Link href="/account" className="text-sm underline">
          Back to account
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="py-20 text-center text-neutral-500">
          <p>Your wishlist is empty.</p>
          <Link
            href="/collections/all"
            className="inline-block mt-5 underline"
          >
            Discover new arrivals →
          </Link>
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-5">
          {rows.map((row) =>
            row.product ? (
              <ProductCard key={row.id} product={row.product} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
