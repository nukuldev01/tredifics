import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "./types";

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (variantId: number) => void;
  setQuantity: (variantId: number, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variant_id === line.variant_id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variant_id === line.variant_id
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              ),
            };
          }
          return { lines: [...s.lines, line] };
        }),
      remove: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variant_id !== variantId) })),
      setQuantity: (variantId, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.variant_id === variantId ? { ...l, quantity: qty } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((acc, l) => acc + l.quantity, 0),
      subtotal: () =>
        get().lines.reduce(
          (acc, l) => acc + parseFloat(l.unit_price) * l.quantity,
          0
        ),
    }),
    { name: "tredific-cart" }
  )
);
