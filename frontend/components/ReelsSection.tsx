"use client";
import { useRef, useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { fetcher } from "@/lib/api";

type Reel = {
  id: number;
  title: string;
  creator_handle: string;
  embed_url: string;
  thumb_src: string;
  provider: "instagram" | "youtube" | "other";
  embed_iframe_src: string;
};

export default function ReelsSection() {
  const { data } = useSWR<Reel[]>("/content/reels/", fetcher);
  const reels = data || [];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Reel | null>(null);

  if (reels.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-page mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">
              On Reels
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">
              Styled by the community
            </h2>
            <p className="mt-2 text-neutral-600 text-sm">
              See how creators wear their Tredific® pieces.
            </p>
          </div>
          <div className="hidden md:flex gap-1">
            <button
              onClick={() => scrollBy(-1)}
              className="border border-neutral-300 p-2 hover:border-ink"
              aria-label="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="border border-neutral-300 p-2 hover:border-ink"
              aria-label="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r)}
              className="snap-start flex-shrink-0 w-[60%] sm:w-[40%] md:w-[24%] aspect-[9/16] relative bg-neutral-100 overflow-hidden group"
              aria-label={r.title || "Watch reel"}
            >
              {r.thumb_src ? (
                <img
                  src={r.thumb_src}
                  alt={r.title || ""}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-400" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                  <Play size={20} className="text-ink ml-0.5" />
                </span>
              </div>
              {(r.title || r.creator_handle) && (
                <div className="absolute bottom-0 inset-x-0 p-3 text-white text-left">
                  {r.title && (
                    <p className="text-xs font-medium leading-snug line-clamp-2">
                      {r.title}
                    </p>
                  )}
                  {r.creator_handle && (
                    <p className="text-[11px] opacity-90">{r.creator_handle}</p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white p-2"
          >
            <X size={28} />
          </button>
          <div className="w-full max-w-md aspect-[9/16] bg-black">
            <iframe
              src={active.embed_iframe_src}
              className="w-full h-full"
              frameBorder={0}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={active.title || "Reel"}
            />
          </div>
        </div>
      )}
    </section>
  );
}
