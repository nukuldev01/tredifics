"use client";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type WishlistRow = {
  id: number;
  product: any;
  created_at: string;
};

/** SWR-backed wishlist hook. Returns rows + toggle action. */
export function useWishlist() {
  const user = useAuth((s) => s.user);
  const key = user ? "/wishlist/" : null;
  const { data, mutate, isLoading } = useSWR<any>(key, fetcher);
  const rows: WishlistRow[] = Array.isArray(data) ? data : data?.results || [];
  const idSet = new Set(rows.map((r) => r.product?.id));

  const toggle = async (productId: number) => {
    if (!user) return { ok: false, need_login: true };
    try {
      const res = await api.post("/wishlist/toggle/", { product_id: productId });
      await mutate();
      return { ok: true, wishlisted: res.data?.wishlisted ?? false };
    } catch {
      return { ok: false, need_login: false };
    }
  };

  const isWishlisted = (productId: number) => idSet.has(productId);

  return { rows, isLoading, toggle, isWishlisted, refresh: mutate };
}
