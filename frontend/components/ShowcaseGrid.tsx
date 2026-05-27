"use client";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type ShowcaseItem = {
  id: number;
  src: string;
  caption: string;
  alt: string;
};

export default function ShowcaseGrid({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? 0) - 1));
      if (e.key === "ArrowRight")
        setActive((i) => Math.min(items.length - 1, (i ?? 0) + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, items.length]);

  if (!items?.length) return null;

  return (
    <section className="border-t border-neutral-200 mt-12 pt-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            In real life
          </p>
          <h2 className="font-serif text-2xl md:text-3xl mt-1">
            Style Showcase
          </h2>
        </div>
      </div>

      {/* Masonry-ish CSS columns layout */}
      <div className="columns-2 md:columns-3 gap-3 md:gap-4 [column-fill:_balance]">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActive(i)}
            className="block w-full mb-3 md:mb-4 overflow-hidden bg-neutral-100 break-inside-avoid group"
          >
            <img
              src={item.src}
              alt={item.alt || item.caption || "Style showcase"}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && items[active] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white p-2"
          >
            <X size={28} />
          </button>
          {active > 0 && (
            <button
              onClick={() => setActive(active - 1)}
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {active < items.length - 1 && (
            <button
              onClick={() => setActive(active + 1)}
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2"
            >
              <ChevronRight size={32} />
            </button>
          )}
          <img
            src={items[active].src}
            alt={items[active].alt || ""}
            className="max-h-[90vh] max-w-[92vw] object-contain"
          />
          {items[active].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm">
              {items[active].caption}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
