import Link from "next/link";
import Brand from "./Brand";
import { Instagram, Facebook, Star, Award, Mail, Phone } from "lucide-react";
import { BRAND, mailtoUrl } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-24 bg-cream">
      <div className="max-w-page mx-auto px-4 md:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 md:col-span-2">
          <Brand size="lg" />
          <p className="mt-3 text-neutral-600 max-w-sm">
            {BRAND.tagline} Contemporary ethnic wear in sizes XS to 7XL.
          </p>
          <div className="mt-4 space-y-1.5 text-neutral-700">
            <a
              href={mailtoUrl()}
              className="flex items-center gap-2 hover:text-ink"
            >
              <Mail size={14} /> {BRAND.email}
            </a>
            <a
              href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 hover:text-ink"
            >
              <Phone size={14} /> {BRAND.phone}
            </a>
          </div>
          <div className="flex gap-4 mt-4 text-neutral-700">
            <a
              href={BRAND.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-ink"
            >
              <Instagram size={18} />
            </a>
            <a
              href={BRAND.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-ink"
            >
              <Facebook size={18} />
            </a>
            <a
              href={BRAND.google}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google reviews"
              className="hover:text-ink"
            >
              <Star size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Shop</h3>
          <ul className="space-y-2 text-neutral-600">
            <li><Link href="/collections/all">All Products</Link></li>
            <li><Link href="/collections/kurti">Kurti</Link></li>
            <li><Link href="/collections/saree">Saree</Link></li>
            <li><Link href="/collections/lehenga">Lehenga</Link></li>
            <li><Link href="/collections/dress">Dresses</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-3">Help</h3>
          <ul className="space-y-2 text-neutral-600">
            <li><Link href="/pages/shipping-policy">Shipping</Link></li>
            <li><Link href="/pages/return-policy">Returns &amp; Exchange</Link></li>
            <li><Link href="/pages/faq">FAQ</Link></li>
            <li><Link href="/account">Track order</Link></li>
            <li><Link href="/account/wishlist">Wishlist</Link></li>
            <li><Link href="/blogs">Journal</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-3">About</h3>
          <ul className="space-y-2 text-neutral-600">
            <li><Link href="/pages/about-us">About us</Link></li>
            <li><Link href="/pages/terms-and-conditions">Terms</Link></li>
            <li><Link href="/pages/privacy-policy">Privacy</Link></li>
            <li><Link href="/pages/legal-and-compliance">Legal</Link></li>
            <li><Link href="/pages/brand-rules">Brand guidelines</Link></li>
          </ul>
        </div>
      </div>

      {/* Trust + Trademark strip */}
      <div className="border-t border-neutral-200/80">
        <div className="max-w-page mx-auto px-4 md:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-600">
          <a
            href={BRAND.trademarkPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-ink"
          >
            <Award size={14} className="text-ink" />
            <span>
              <strong className="font-medium text-ink">Registered Trademark Certified</strong>
              {" — "}view certificate
            </span>
          </a>
          <p className="text-neutral-500">
            We ship to India · United States · United Kingdom · Canada
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Tredific® · All rights reserved · Designed in India
      </div>
    </footer>
  );
}
