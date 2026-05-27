import { Mail, Phone, Instagram, Facebook, Star, MessageCircle } from "lucide-react";
import { BRAND, mailtoUrl, whatsappUrl } from "@/lib/brand";
import Brand from "@/components/Brand";

export const metadata = {
  title: "Contact us — Tredific®",
  description: "Reach the Tredific® team via email, phone, WhatsApp, or social.",
};

export default function ContactPage() {
  const lines = [
    {
      Icon: Mail,
      label: "Email",
      value: BRAND.email,
      href: mailtoUrl("Hello from Tredific.com"),
    },
    {
      Icon: Phone,
      label: "Phone",
      value: BRAND.phone,
      href: `tel:${BRAND.phone.replace(/\s/g, "")}`,
    },
    {
      Icon: MessageCircle,
      label: "WhatsApp",
      value: BRAND.phone,
      href: whatsappUrl(),
    },
    {
      Icon: Star,
      label: "Google Business",
      value: "Read & write reviews",
      href: BRAND.google,
    },
    {
      Icon: Instagram,
      label: "Instagram",
      value: "@tredific",
      href: BRAND.instagram,
    },
    {
      Icon: Facebook,
      label: "Facebook",
      value: "Tredific official",
      href: BRAND.facebook,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <p className="text-xs uppercase tracking-widest text-neutral-500">
        Get in touch
      </p>
      <h1 className="font-serif text-4xl md:text-5xl mt-2">Contact <Brand size="lg" /></h1>
      <p className="mt-4 text-neutral-600 max-w-xl">
        We answer most messages within one business day. For order-specific
        questions, please share your order ID — it speeds things up.
      </p>

      <ul className="mt-10 grid sm:grid-cols-2 gap-3">
        {lines.map(({ Icon, label, value, href }) => (
          <li key={label}>
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-3 border border-neutral-200 p-4 hover:border-ink transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
                <Icon size={16} />
              </span>
              <span>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {label}
                </p>
                <p className="text-sm font-medium">{value}</p>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-12 border-t pt-6 text-xs text-neutral-500">
        <p>
          <strong className="text-ink">Tredific®</strong> is a registered trademark.
          {" "}
          <a
            href={BRAND.trademarkPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View certificate
          </a>
          .
        </p>
      </div>
    </div>
  );
}
