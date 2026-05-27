import CollectionView from "./CollectionView";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getCategory(slug: string) {
  if (slug === "all") {
    return { name: "All Products", slug: "all", short_description: "" };
  }
  try {
    const res = await fetch(`${API}/api/categories/${slug}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const cat = await getCategory(params.slug);
  if (!cat) return { title: "Collection" };
  return {
    title: cat.meta_title || `${cat.name} — Tredific®`,
    description: cat.meta_description || cat.short_description,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const cat = await getCategory(params.slug);
  return (
    <CollectionView
      slug={params.slug}
      categoryName={cat?.name || "Collection"}
      categoryDescription={cat?.short_description || ""}
    />
  );
}
