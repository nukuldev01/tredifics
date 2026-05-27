import { notFound } from "next/navigation";
import ContentPageView from "./ContentPageView";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getPage(slug: string) {
  const res = await fetch(`${API}/api/content/pages/${slug}/`, {
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const p = await getPage(params.slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.meta_title || p.title,
    description: p.meta_description,
  };
}

export default async function ContentPage({
  params,
}: {
  params: { slug: string };
}) {
  const p = await getPage(params.slug);
  if (!p) notFound();
  return <ContentPageView page={p} />;
}
