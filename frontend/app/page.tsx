import Link from "next/link";
import Brand from "@/components/Brand";
import BannerCarousel from "@/components/BannerCarousel";
import ProductRow from "@/components/ProductRow";
import ReelsSection from "@/components/ReelsSection";
import GoogleReviews from "@/components/GoogleReviews";
import NewsletterForm from "@/components/NewsletterForm";
import { Truck, RotateCcw, ShieldCheck, Globe, Award } from "lucide-react";
import { BRAND } from "@/lib/brand";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getCategories() {
  try {
    const res = await fetch(`${API}/api/categories/`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function getBanners() {
  try {
    const res = await fetch(`${API}/api/content/banners/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, banners] = await Promise.all([
    getCategories(),
    getBanners(),
  ]);
  const primaryCategories = categories.slice(0, 6);
  const heroBanners = banners.filter((b: any) => b.kind !== "split");
  const splitBanners = banners.filter((b: any) => b.kind === "split").slice(0, 2);

  return (
    <>
      {/* Hero carousel — admin-managed banners */}
      <BannerCarousel banners={heroBanners} />

      {/* USP / trust bar */}
      <section className="border-b border-neutral-200">
        <div className="max-w-page mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
          {[
            { Icon: Globe, h: "Worldwide Shipping", s: "India, US, UK, Canada" },
            { Icon: ShieldCheck, h: "Secure Checkout", s: "Razorpay-secured" },
            { Icon: Truck, h: "Express Delivery", s: "3–6 day express option" },
            { Icon: RotateCcw, h: "Easy Returns", s: "30-day hassle-free" },
          ].map(({ Icon, h, s }) => (
            <div key={h} className="flex items-center gap-3">
              <Icon size={26} strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-medium">{h}</h3>
                <p className="text-xs text-neutral-500">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals — newest first */}
      <ProductRow
        title="New Arrivals"
        subtitle="Fresh from the studio"
        query="ordering=-created_at"
        href="/collections/all?sort=-created_at"
        limit={8}
      />

      {/* Shop by Category — dynamic images sourced from product photos */}
      <section className="py-12 md:py-16 bg-cream/60">
        <div className="max-w-page mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Categories
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">
              Shop by Category
            </h2>
            <p className="mt-2 text-neutral-600 text-sm">
              Find your perfect ethnic look
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {primaryCategories.map((c: any) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="relative aspect-[4/5] bg-neutral-100 overflow-hidden group"
              >
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt={c.image_alt || c.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                  <h3 className="font-serif text-2xl">{c.name}</h3>
                  <p className="text-xs opacity-90">Shop now →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <ProductRow
        title="Bestsellers"
        subtitle="Most loved by Tredific customers"
        query="featured=true"
        href="/collections/all?featured=true"
        limit={8}
      />

      {/* Editorial split banner — Festive edit */}
      <section className="py-12 md:py-16">
        <div className="max-w-page mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-3 md:gap-5">
          {splitBanners.length > 0 ? (
            splitBanners.map((banner: any) => (
              <Link
                key={banner.id}
                href={banner.cta_url || "#"}
                className="relative aspect-[4/3] overflow-hidden group"
              >
                <img
                  src={banner.src}
                  alt={banner.image_alt || banner.headline}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${(banner.overlay_opacity || 30) / 100})` }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-white">
                  {banner.eyebrow && (
                    <p className="text-xs uppercase tracking-widest">{banner.eyebrow}</p>
                  )}
                  <h3 className="font-serif text-3xl md:text-4xl mt-2">
                    {banner.headline}
                  </h3>
                  {banner.cta_label && (
                    <span className="mt-4 inline-block w-fit border-b border-white pb-1 text-sm">
                      {banner.cta_label} &rarr;
                    </span>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <>
              <Link
                href="/collections/lehenga"
                className="relative aspect-[4/3] overflow-hidden group"
              >
                <img
                  src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600"
                  alt="Bridal lehenga edit"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-white">
                  <p className="text-xs uppercase tracking-widest">Wedding edit</p>
                  <h3 className="font-serif text-3xl md:text-4xl mt-2">
                    For the days that matter
                  </h3>
                  <span className="mt-4 inline-block w-fit border-b border-white pb-1 text-sm">
                    Shop lehengas →
                  </span>
                </div>
              </Link>
              <Link
                href="/collections/co-ord-set"
                className="relative aspect-[4/3] overflow-hidden group"
              >
                <img
                  src="https://images.unsplash.com/photo-1622445275576-721325763afe?w=1600"
                  alt="Co-ord sets edit"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-white">
                  <p className="text-xs uppercase tracking-widest">Co-ord edit</p>
                  <h3 className="font-serif text-3xl md:text-4xl mt-2">
                    Effortless from sun-up to sun-down
                  </h3>
                  <span className="mt-4 inline-block w-fit border-b border-white pb-1 text-sm">
                    Shop co-ord sets →
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Dresses row */}
      <ProductRow
        title="Dresses"
        subtitle="Effortless ethnic dresses"
        query="category=dress"
        href="/collections/dress"
        limit={8}
      />

      {/* Kurta Sets row */}
      <ProductRow
        title="Kurta Sets"
        subtitle="Coordinated, easy to wear"
        query="category=kurta-set"
        href="/collections/kurta-set"
        limit={8}
      />

      {/* Reels — admin-managed influencer videos */}
      <ReelsSection />

      {/* Google Reviews */}
      <GoogleReviews />

      {/* Brand strip + trademark trust */}
      <section className="bg-cream py-20">
        <div className="max-w-page mx-auto px-4 md:px-8 text-center">
          <Brand size="xl" className="block" />
          <p className="mt-4 max-w-2xl mx-auto text-neutral-600">
            We work with weavers and tailors across Jaipur, Surat, and Banaras
            to bring you collections that honour craft while feeling current.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-700">
            <Award size={14} className="text-ink" />
            <a
              href={BRAND.trademarkPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Registered Trademark Certified
            </a>
          </p>
          <div>
            <Link
              href="/pages/about-us"
              className="inline-block mt-4 text-sm underline"
            >
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 border-t border-neutral-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-3xl">Join the list</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Be first to know about new drops, restocks, and members-only sales.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
