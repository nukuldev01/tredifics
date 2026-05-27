import "./globals.css";
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ReviewPopup from "@/components/ReviewPopup";
import CountryDetector from "@/components/CountryDetector";
import { BRAND } from "@/lib/brand";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "Tredific® — Ethnic wear, shipped worldwide",
    template: "%s | Tredific®",
  },
  description:
    "Tredific® brings you contemporary ethnic wear — kurtis, sarees, dresses, lehengas — crafted in India and shipped worldwide. Sizes XS to 7XL.",
  metadataBase: new URL("https://tredific.com"),
  openGraph: {
    title: "Tredific® — Ethnic wear, shipped worldwide",
    description: "Crafted in India, loved worldwide. Sizes XS to 7XL.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tredific®",
    url: "https://tredific.com",
    email: BRAND.email,
    telephone: BRAND.phone,
    sameAs: [BRAND.instagram, BRAND.facebook, BRAND.google],
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-screen bg-white text-ink antialiased">
        <CountryDetector />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <WhatsAppButton />
        <ReviewPopup />
      </body>
    </html>
  );
}
