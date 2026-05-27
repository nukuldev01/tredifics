"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import Price from "@/components/Price";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const { lines, setQuantity, remove, subtotal } = useCart();
  const sub = subtotal();
  const currency = lines[0]?.currency || "INR";

  if (lines.length === 0) {
    return (
      <div className="max-w-page mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="font-serif text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-neutral-600">
          Add a few favourites and they'll show up here.
        </p>
        <Link
          href="/collections/all"
          className="inline-block mt-6 bg-ink text-white px-6 py-3 text-sm"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-3xl md:text-4xl mb-6">Shopping Bag</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 divide-y divide-neutral-200">
          {lines.map((l) => (
            <div key={l.variant_id} className="py-5 flex gap-4">
              <img
                src={l.image}
                alt=""
                className="w-24 h-32 object-cover bg-neutral-100"
              />
              <div className="flex-1">
                <div className="flex justify-between gap-4">
                  <Link
                    href={`/products/${l.product_slug}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {l.name}
                  </Link>
                  <span className="text-sm font-medium">
                    <Price amount={parseFloat(l.unit_price) * l.quantity} />
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {l.color} · {l.size}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center border border-neutral-300">
                    <button
                      onClick={() =>
                        setQuantity(l.variant_id, Math.max(1, l.quantity - 1))
                      }
                      className="px-2 py-1.5"
                      aria-label="Decrease"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-3 text-sm">{l.quantity}</span>
                    <button
                      onClick={() => setQuantity(l.variant_id, l.quantity + 1)}
                      className="px-2 py-1.5"
                      aria-label="Increase"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.variant_id)}
                    className="text-xs text-neutral-500 hover:text-rust inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="border border-neutral-200 p-6 h-fit">
          <h2 className="font-medium text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span><Price amount={sub} /></span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block bg-ink text-white text-center py-3 text-sm uppercase tracking-wider"
          >
            Checkout
          </Link>
          <Link
            href="/collections/all"
            className="mt-3 block text-center text-xs underline text-neutral-600"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
