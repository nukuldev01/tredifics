/**
 * Single source of truth for Tredific® brand contact info.
 * Used across Header, Footer, Contact page, structured data, and emails.
 */

export const BRAND = {
  name: "Tredific",
  legalName: "Tredific®",
  tagline: "Crafted in India, loved worldwide.",
  email: "Tredific@gmail.com",
  phone: "+91 8385990434",
  whatsappNumber: "918385990434", // No +, no spaces — used by wa.me URLs
  whatsappMessage: "Hi! I have a question about a Tredific® product.",
  google: "https://share.google/N2lTTPyxFwVMbLf7w",
  instagram: "https://www.instagram.com/tredific?igsh=emYyMGZmcWJsaHZ1",
  facebook: "https://www.facebook.com/share/1CJDCqJWhd/",
  trademarkPdf: "/tredific-trademark-certificate.pdf",
} as const;

export const SUPPORTED_COUNTRIES = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "CA", name: "Canada", currency: "CAD" },
] as const;

export function whatsappUrl(message?: string) {
  const text = encodeURIComponent(message || BRAND.whatsappMessage);
  return `https://wa.me/${BRAND.whatsappNumber}?text=${text}`;
}

export function mailtoUrl(subject?: string) {
  const s = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${BRAND.email}${s}`;
}
