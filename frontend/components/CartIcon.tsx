"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useEffect, useState } from "react";

export default function CartIcon() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Link href="/cart" aria-label="Cart" className="relative">
      <ShoppingBag size={18} />
      {mounted && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-ink text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
