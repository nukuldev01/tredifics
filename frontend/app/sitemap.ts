import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tredific.com";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 1800 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = [
    "",
    "/collections/all",
    "/contact",
    "/account",
    "/account/wishlist",
    "/blogs",
    "/pages/about-us",
    "/pages/terms-and-conditions",
    "/pages/privacy-policy",
    "/pages/return-policy",
    "/pages/shipping-policy",
    "/pages/faq",
    "/pages/legal-and-compliance",
    "/pages/brand-rules",
    "/pages/shipping-and-logistics",
    "/pages/location-based-shipping",
    "/pages/user-account",
  ];

  const cats = await safeFetch<{ results: { slug: string }[] }>(
    "/api/categories/?page_size=100",
    { results: [] }
  );

  // Pull up to ~1000 products for the sitemap
  const products: { slug: string; updated_at?: string }[] = [];
  for (let page = 1; page <= 10; page++) {
    const data = await safeFetch<{ results: any[]; next: string | null }>(
      `/api/products/?page=${page}&page_size=100`,
      { results: [], next: null }
    );
    products.push(...data.results);
    if (!data.next) break;
  }

  // Blog posts
  const posts = await safeFetch<{ results: any[] }>(
    "/api/blog/posts/?page_size=100",
    { results: [] }
  );

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE}${r}`,
      lastModified: now,
      changeFrequency:
        r === "" ? ("daily" as const) : ("weekly" as const),
      priority: r === "" ? 1.0 : 0.6,
    })),
    ...cats.results.map((c) => ({
      url: `${SITE}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(posts.results || []).map((p: any) => ({
      url: `${SITE}/blogs/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
