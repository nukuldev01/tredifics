export type Color = { id: number; name: string; hex_code: string };

export type ProductImage = {
  id: number;
  src: string;
  alt: string;
  sort_order: number;
  is_primary: boolean;
};

export type ProductVariant = {
  id: number;
  size: string;
  color: Color;
  sku: string;
  stock: number;
  price_override: string | null;
  effective_price: string;
};

export type ReviewMedia = {
  id: number;
  kind: "image" | "video";
  src: string;
  sort_order: number;
};

export type Review = {
  id: number;
  name: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  media?: ReviewMedia[];
};

export type ProductFAQ = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
};

export type ProductShowcase = {
  id: number;
  src: string;
  caption: string;
  alt: string;
  sort_order: number;
};

export type ProductListItem = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category: string;
  short_description: string;
  price: string;
  sale_price: string | null;
  effective_price: string;
  discount_percent: number;
  currency: string;
  is_featured: boolean;
  in_stock: boolean;
  cod_available?: boolean;
  images: ProductImage[];
  colors: string[];
  sizes: string[];
};

export type Product = ProductListItem & {
  description: string;
  fabric: string;
  occasion: string;
  care_instructions: string;
  country_of_origin: string;
  variants: ProductVariant[];
  reviews: Review[];
  average_rating: number;
  review_count: number;
  faqs: ProductFAQ[];
  showcase: ProductShowcase[];
  meta_title?: string;
  meta_description?: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  long_description: string;
  image_url: string;
  image_alt: string;
};

export type CartLine = {
  variant_id: number;
  product_slug: string;
  name: string;
  size: string;
  color: string;
  unit_price: string;
  currency: string;
  quantity: number;
  image: string;
};

export type ShippingRate = {
  id: number;
  country: string;
  method: string;
  method_display: string;
  price: string;
  currency: string;
  estimated_days_min: number;
  estimated_days_max: number;
  free_above: string | null;
};

export type Order = {
  id: number;
  display_id: string;
  public_id: string;
  email: string;
  currency: string;
  subtotal: string;
  shipping_total: string;
  grand_total: string;
  status: string;
  payment_status: string;
  shipping_country: string;
  shipping_method: string;
  items: any[];
  created_at: string;
};
