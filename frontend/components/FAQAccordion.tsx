"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQ = { id: number; question: string; answer: string };

export default function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(faqs[0]?.id ?? null);
  if (!faqs?.length) return null;

  // FAQ JSON-LD for SEO
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="border-t border-neutral-200 mt-12 pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="flex items-end justify-between mb-5">
        <h2 className="font-serif text-2xl md:text-3xl">Frequently Asked</h2>
      </div>
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        {faqs.map((f) => {
          const isOpen = open === f.id;
          return (
            <li key={f.id}>
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="w-full flex items-center justify-between text-left py-4 group"
                aria-expanded={isOpen}
              >
                <span className="text-sm md:text-base font-medium pr-4">
                  {f.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm text-neutral-700 leading-relaxed pb-5 pr-8">
                    {f.answer}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
