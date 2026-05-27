import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const metadata = {
  title: "Journal — Tredific®",
  description:
    "Style guides, care tips, and ethnic fashion editorial from Tredific®.",
  openGraph: {
    title: "The Tredific® Journal",
    description: "Style guides, care tips, and ethnic fashion editorial.",
  },
};

async function getPosts() {
  try {
    const res = await fetch(`${API}/api/blog/posts/?page_size=24`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.results || data || [];
  } catch {
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10 md:py-16">
      <header className="mb-10 md:mb-14 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Journal
        </p>
        <h1 className="font-serif text-4xl md:text-6xl mt-2">
          Stories, style, craft
        </h1>
        <p className="mt-3 text-neutral-600 max-w-xl mx-auto">
          A slow read on ethnic wear — what we make, how to wear it, and why
          we care.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-center text-sm text-neutral-500 py-20">
          New stories coming soon.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.map((p: any) => (
            <Link
              key={p.id}
              href={`/blogs/${p.slug}`}
              className="group block"
            >
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                {p.cover_src && (
                  <img
                    src={p.cover_src}
                    alt={p.cover_alt || p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="pt-4">
                {p.category && (
                  <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                    {p.category.name}
                  </p>
                )}
                <h2 className="font-serif text-xl md:text-2xl mt-1 leading-snug">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                    {p.excerpt}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-neutral-500">
                  {p.author_display} · {p.reading_minutes} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
