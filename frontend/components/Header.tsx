"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, User, Menu, X, ChevronRight } from "lucide-react";
import Brand from "./Brand";
import CartIcon from "./CartIcon";
import CountrySelect from "./CountrySelect";

const NAV = [
  { label: "Kurti", href: "/collections/kurti" },
  { label: "Saree", href: "/collections/saree" },
  { label: "Dress", href: "/collections/dress" },
  { label: "Lehenga", href: "/collections/lehenga" },
  { label: "Co-ord", href: "/collections/co-ord-set" },
  { label: "All", href: "/collections/all" },
];

// Slide-out drawer — the order matches the spec.
const DRAWER_NAV = [
  { label: "Home", href: "/" },
  { label: "New Arrivals", href: "/collections/all?sort=-created_at" },
  { label: "Bestsellers", href: "/collections/all?featured=true" },
  { label: "Kurti", href: "/collections/kurti" },
  { label: "Saree", href: "/collections/saree" },
  { label: "Lehenga", href: "/collections/lehenga" },
  { label: "Co-ord", href: "/collections/co-ord-set" },
  { label: "All", href: "/collections/all" },
  { label: "Journal", href: "/blogs" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "About Us", href: "/pages/about-us" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-page mx-auto flex items-center justify-between px-4 md:px-8 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="md:flex-none">
            <Brand size="lg" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hover:text-rust transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <CountrySelect />
          <Link href="/search" aria-label="Search" className="hidden md:block">
            <Search size={18} />
          </Link>
          <Link href="/account" aria-label="Account">
            <User size={18} />
          </Link>
          <CartIcon />
        </div>
      </div>

      {/* Slide-out navigation drawer (mobile + desktop) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200">
            <Brand size="md" />
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="p-2 -mr-2"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="overflow-y-auto h-[calc(100%-4rem)]">
            <ul className="flex flex-col">
              {DRAWER_NAV.map((n) => (
                <li key={n.label}>
                  <Link
                    href={n.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-base uppercase tracking-wider hover:bg-cream/40"
                  >
                    <span>{n.label}</span>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-base uppercase tracking-wider hover:bg-cream/40"
                >
                  <span>My Account</span>
                  <ChevronRight size={16} className="text-neutral-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-base uppercase tracking-wider hover:bg-cream/40"
                >
                  <span>Contact</span>
                  <ChevronRight size={16} className="text-neutral-400" />
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </header>
  );
}
