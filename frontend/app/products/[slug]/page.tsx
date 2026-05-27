import { notFound } from "next/navigation";
import ProductView from "./ProductView";
import ProductSchema from "@/components/ProductSchema";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getProduct(slug: string) {
  const res = await fetch(`${API}/api/products/${slug}/`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const p = await getProduct(params.slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.meta_title || p.name,
    description: p.meta_description || p.short_description,
    openGraph: {
      title: p.name,
      description: p.short_description,
      images: p.images?.[0]?.src ? [p.images[0].src] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  return (
    <>
      <ProductSchema product={product} />
      <ProductView product={product} />
    </>
  );
}
