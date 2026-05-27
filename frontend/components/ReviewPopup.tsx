"use client";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

type Review = {
  id: number;
  user_name: string;
  src: string;
  rating: number;
  title: string;
  comment: string;
  product_name: string;
};

const SHOW_EVERY_MS = 5000;
const VISIBLE_FOR_MS = 4500;

/**
 * Floating review popup that surfaces a new review every 5 seconds.
 * Mounted only on collection and product pages.
 */
export default function ReviewPopup() {
  const pathname = usePathname() || "";
  const enabled =
    pathname.startsWith("/collections") || pathname.startsWith("/products");
  const { data } = useSWR<Review[]>(
    enabled ? "/content/popup-reviews/" : null,
    fetcher
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!enabled || !data || data.length === 0 || closed) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setVisible(true);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setIndex((i) => (i + 1) % data.length);
      }, VISIBLE_FOR_MS);
    };
    // Initial delay before the first popup so users settle
    const startTimer = setTimeout(tick, 2000);
    const interval = setInterval(tick, SHOW_EVERY_MS + 500);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, [enabled, data, closed]);

  if (!enabled || !data || data.length === 0 || closed) return null;
  const r = data[index];
  if (!r) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-24 left-4 md:left-6 z-40 w-72 max-w-[80vw] transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white border border-neutral-200 shadow-xl p-4 relative">
        <button
          onClick={() => setClosed(true)}
          aria-label="Dismiss"
          className="absolute top-2 right-2 text-neutral-400 hover:text-ink"
        >
          <X size={14} />
        </button>
        <div className="flex items-start gap-3">
          {r.src ? (
            <img
              src={r.src}
              alt={r.user_name}
              className="w-10 h-10 rounded-full object-cover bg-neutral-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-xs font-medium">
              {r.user_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{r.user_name}</p>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={11}
                    className={
                      i < r.rating
                        ? "fill-[#fbbc04] text-[#fbbc04]"
                        : "text-neutral-300"
                    }
                  />
                ))}
              </div>
            </div>
            {r.title && (
              <p className="text-xs font-medium text-ink mt-0.5">{r.title}</p>
            )}
            <p className="text-xs text-neutral-700 mt-1 line-clamp-3">
              {r.comment}
            </p>
            {r.product_name && (
              <p className="text-[11px] text-neutral-500 mt-1.5 italic">
                on {r.product_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
