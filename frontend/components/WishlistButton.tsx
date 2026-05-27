"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

type Props = {
  productId: number;
  className?: string;
  size?: number;
  showLabel?: boolean;
};

export default function WishlistButton({
  productId, className = "", size = 18, showLabel = false,
}: Props) {
  const router = useRouter();
  const { isWishlisted, toggle } = useWishlist();
  const active = isWishlisted(productId);
  const [bouncing, setBouncing] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 400);
    const r = await toggle(productId);
    if (!r.ok && r.need_login) {
      router.push("/account?next=" + encodeURIComponent(window.location.pathname));
    }
  };

  return (
    <button
      onClick={handle}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`inline-flex items-center gap-1.5 transition-transform ${
        bouncing ? "scale-125" : "scale-100"
      } ${className}`}
    >
      <Heart
        size={size}
        className={
          active
            ? "fill-rust text-rust"
            : "text-ink/70 hover:text-rust transition-colors"
        }
      />
      {showLabel && (
        <span className="text-xs uppercase tracking-wider">
          {active ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
