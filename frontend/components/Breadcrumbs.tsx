import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tredific.com";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
        <ol className="flex items-center gap-1 flex-wrap">
          {crumbs.map((c, i) => (
            <li key={i} className="inline-flex items-center gap-1">
              {c.href && i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink">{c.label}</span>
              )}
              {i < crumbs.length - 1 && (
                <ChevronRight size={12} className="text-neutral-400" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
