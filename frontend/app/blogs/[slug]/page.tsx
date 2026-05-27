import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Markdown from "@/components/Markdown";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tredific.com";

async function getPost(slug: string) {
  try {
    const res = await fetch(`${API}/api/blog/posts/${slug}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const p = await getPost(params.slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.meta_title || `${p.title} — Tredific® Journal`,
    description: p.meta_description || p.excerpt,
    openGraph: {
      title: p.title,
      description: p.excerpt,
      images: p.cover_src ? [p.cover_src] : [],
      type: "article",
    },
    alternates: { canonical: `${SITE}/blogs/${p.slug}` },
  };
}

export default async function BlogDetail({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.meta_description,
    image: post.cover_src ? [post.cover_src] : [],
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { "@type": "Person", name: post.author_display || "Tredific Editorial" },
    publisher: {
      "@type": "Organization",
      name: "Tredific®",
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blogs/${post.slug}` },
  };

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mb-6">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Journal", href: "/blogs" },
            { label: post.title },
          ]}
        />
      </div>

      <header className="mb-8">
        {post.category && (
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {post.category.name}
          </p>
        )}
        <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">
          {post.title}
        </h1>
        <p className="mt-3 text-xs text-neutral-500">
          {post.author_display}
          {post.published_at && (
            <> · {new Date(post.published_at).toLocaleDateString(undefined, {
              year: "numeric", month: "long", day: "numeric",
            })}</>
          )}
          {" · "}
          {post.reading_minutes} min read
        </p>
      </header>

      {post.cover_src && (
        <div className="mb-10 aspect-[16/9] bg-neutral-100 overflow-hidden">
          <img
            src={post.cover_src}
            alt={post.cover_alt || post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose-tredific">
        {post.excerpt && (
          <p className="text-lg text-neutral-800 leading-relaxed mb-8 border-l-2 border-ink pl-4 italic">
            {post.excerpt}
          </p>
        )}
        <Markdown source={post.body} />
      </div>

      {post.related && post.related.length > 0 && (
        <section className="border-t border-neutral-200 mt-16 pt-10">
          <h2 className="font-serif text-2xl mb-6">Keep reading</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {post.related.map((r: any) => (
              <Link
                key={r.id}
                href={`/blogs/${r.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {r.cover_src && (
                    <img
                      src={r.cover_src}
                      alt={r.cover_alt || ""}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="font-serif text-lg mt-3">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
