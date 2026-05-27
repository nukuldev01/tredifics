"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import { useCart } from "@/lib/cart";
import Price from "@/components/Price";
import type { ShippingRate } from "@/lib/types";

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [country, setCountry] = useState("IN");
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
  });

  const { data: rates } = useSWR<ShippingRate[]>(
    `/shipping/rates/?country=${country}`,
    fetcher
  );

  const sub = subtotal();
  const currency = lines[0]?.currency || "INR";

  const selectedRate = useMemo(
    () => rates?.find((r) => r.method === method),
    [rates, method]
  );
  const shippingCost = useMemo(() => {
    if (!selectedRate) return 0;
    if (selectedRate.free_above && sub >= parseFloat(selectedRate.free_above)) {
      return 0;
    }
    return parseFloat(selectedRate.price);
  }, [selectedRate, sub]);

  const grand = sub + shippingCost;

  // Load Razorpay
  useEffect(() => {
    const id = "razorpay-checkout-js";
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // 1. Create order
      const items = lines.map((l) => ({
        variant_id: l.variant_id,
        quantity: l.quantity,
      }));

      const checkoutRes = await api.post("/orders/checkout/", {
        email: form.email,
        phone: form.phone,
        items,
        shipping_country: country,
        shipping_method: method,
        currency,
        shipping_address: {
          full_name: form.full_name,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          country,
        },
      });
      const order = checkoutRes.data;

      // 2. Create Razorpay order
      const rzpOrder = await api.post("/payments/create-order/", {
        public_id: order.public_id,
      });

      // 3. Open Razorpay checkout
      const options = {
        key: rzpOrder.data.key_id,
        amount: rzpOrder.data.amount,
        currency: rzpOrder.data.currency,
        name: "Tredific®",
        description: `Order ${rzpOrder.data.order_display_id}`,
        order_id: rzpOrder.data.razorpay_order_id,
        prefill: {
          email: form.email,
          contact: form.phone,
          name: form.full_name,
        },
        notes: { internal_order_id: order.public_id },
        theme: { color: "#1a1a1a" },
        handler: async (response: any) => {
          try {
            await api.post("/payments/verify/", {
              public_id: order.public_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clear();
            router.push(
              `/order/success?id=${order.public_id}&email=${encodeURIComponent(
                form.email
              )}`
            );
          } catch {
            router.push(`/order/failed?id=${order.public_id}`);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      if (!window.Razorpay) {
        setError("Payment SDK is loading, please retry in a moment.");
        setSubmitting(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        router.push(`/order/failed?id=${order.public_id}`);
      });
      rzp.open();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.[0] ||
          "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="max-w-page mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-2xl">Your cart is empty.</h1>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10">
      <h1 className="font-serif text-3xl md:text-4xl mb-8">Checkout</h1>
      <form onSubmit={placeOrder} className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          {/* Contact */}
          <section>
            <h2 className="font-medium text-lg mb-3">Contact</h2>
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
            />
          </section>

          {/* Shipping address */}
          <section>
            <h2 className="font-medium text-lg mb-3">Shipping address</h2>
            <select
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-neutral-300 px-3 py-2.5 text-sm mb-3 bg-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Full name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm col-span-2"
              />
              <input
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm col-span-2"
              />
              <input
                required
                placeholder="Address"
                value={form.line1}
                onChange={(e) => update("line1", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm col-span-2"
              />
              <input
                placeholder="Apartment, suite (optional)"
                value={form.line2}
                onChange={(e) => update("line2", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm col-span-2"
              />
              <input
                required
                placeholder="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm"
              />
              <input
                placeholder="State"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm"
              />
              <input
                required
                placeholder="Postal code"
                value={form.postal_code}
                onChange={(e) => update("postal_code", e.target.value)}
                className="border border-neutral-300 px-3 py-2.5 text-sm"
              />
            </div>
          </section>

          {/* Shipping method */}
          <section>
            <h2 className="font-medium text-lg mb-3">Shipping method</h2>
            <div className="space-y-2">
              {(rates || []).map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center justify-between border p-3 cursor-pointer ${
                    method === r.method ? "border-ink" : "border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="method"
                      checked={method === r.method}
                      onChange={() => setMethod(r.method as any)}
                    />
                    <div>
                      <p className="text-sm font-medium">{r.method_display}</p>
                      <p className="text-xs text-neutral-500">
                        {r.estimated_days_min}–{r.estimated_days_max} business days
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">
                    {r.free_above && sub >= parseFloat(r.free_above)
                      ? "Free"
                      : <Price amount={r.price} />}
                  </p>
                </label>
              ))}
              {!rates?.length && (
                <p className="text-xs text-neutral-500">
                  No shipping rates configured for this country.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="border border-neutral-200 p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-medium text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 max-h-72 overflow-auto">
            {lines.map((l) => (
              <div key={l.variant_id} className="flex gap-3 text-sm">
                <img
                  src={l.image}
                  alt=""
                  className="w-14 h-16 object-cover bg-neutral-100"
                />
                <div className="flex-1">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-neutral-500">
                    {l.color} · {l.size} · Qty {l.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  <Price amount={parseFloat(l.unit_price) * l.quantity} />
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm border-t pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span><Price amount={sub} /></span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : <Price amount={shippingCost} />}</span>
            </div>
            <div className="flex justify-between font-medium text-base pt-2 border-t mt-2">
              <span>Total</span>
              <span><Price amount={grand} /></span>
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-rust">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full bg-ink text-white py-3 text-sm uppercase tracking-wider disabled:bg-neutral-300"
          >
            {submitting ? "Processing…" : "Pay with Razorpay"}
          </button>
          <p className="mt-3 text-[11px] text-neutral-500 text-center">
            Secure payments by Razorpay · International cards accepted
          </p>
          <p className="mt-1 text-[11px] text-neutral-500 text-center">
            All orders are charged in INR. Amounts shown in other
            currencies are approximate.
          </p>
        </aside>
      </form>
    </div>
  );
}
