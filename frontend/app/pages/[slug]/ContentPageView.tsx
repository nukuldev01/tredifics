"use client";
import { useEffect, useMemo, useState } from "react";
import Markdown from "@/components/Markdown";

type Page = {
  title: string;
  body: string;
  updated_at?: string;
};

type Section = {
  id: string;
  title: string;
  body: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Split the markdown body on H2 (## ) headings into sections for the TOC. */
function parse(body: string): { intro: string; sections: Section[] } {
  const parts = body.split(/^##\s+/m);
  const intro = parts.shift() || "";
  const sections: Section[] = [];
  for (const part of parts) {
    const lines = part.split("\n");
    const title = (lines.shift() || "").trim();
    if (!title) continue;
    sections.push({
      id: slugify(title),
      title,
      body: lines.join("\n").trim(),
    });
  }
  return { intro: intro.trim(), sections };
}

export default function ContentPageView({ page }: { page: Page }) {
  const { intro, sections } = useMemo(() => parse(page.body), [page.body]);
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -65% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-12">
      <div className="grid lg:grid-cols-[1fr_3fr] gap-10">
        {/* TOC */}
        <aside className="order-2 lg:order-1">
          <div className="lg:sticky lg:top-24">
            {sections.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
                  On this page
                </p>
                <ul className="space-y-2 text-sm border-l border-neutral-200">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={`block pl-3 -ml-px border-l-2 transition-colors ${
                          active === s.id
                            ? "border-ink text-ink"
                            : "border-transparent text-neutral-500 hover:text-ink"
                        }`}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Content */}
        <article className="order-1 lg:order-2 max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl mb-3">{page.title}</h1>
          {page.updated_at && (
            <p className="text-xs text-neutral-500 mb-8">
              Last updated{" "}
              {new Date(page.updated_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {intro && <Markdown source={intro} className="mb-8" />}

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
              <h2 className="font-serif text-2xl md:text-3xl mb-3">{s.title}</h2>
              <Markdown source={s.body} />
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
