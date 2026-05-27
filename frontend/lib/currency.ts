"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Lightweight client-side currency display helper.
 *
 * Prices in the database are stored in INR. The store fixes a per-currency
 * conversion rate at build time so we can show approximate localized prices
 * to international shoppers. The actual charge runs through Razorpay in INR
 * unless the merchant account is set up for USD/GBP/CAD settlement.
 *
 * For real-time FX, swap this constant out with a daily-cached fetch
 * from your provider of choice and store the result in this same shape.
 */
export const FX_FROM_INR: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0094,
  CAD: 0.016,
};

export const SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  CAD: "C$",
};

type CountryState = {
  code: "IN" | "US" | "GB" | "CA";
  set: (c: CountryState["code"]) => void;
};

const COUNTRY_TO_CURRENCY: Record<CountryState["code"], string> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
};

export const useCountry = create<CountryState>()(
  persist(
    (set) => ({
      code: "IN",
      set: (code) => set({ code }),
    }),
    { name: "tredific-country" }
  )
);

export function currencyForCountry(code: CountryState["code"]): string {
  return COUNTRY_TO_CURRENCY[code];
}

/** Display an INR amount in the user's chosen currency. */
export function displayMoney(inrAmount: string | number, targetCurrency = "INR") {
  const inr = typeof inrAmount === "string" ? parseFloat(inrAmount) : inrAmount;
  if (Number.isNaN(inr)) return "";
  const rate = FX_FROM_INR[targetCurrency] ?? 1;
  const amount = inr * rate;
  const sym = SYMBOL[targetCurrency] || `${targetCurrency} `;
  if (targetCurrency === "INR") {
    return `${sym}${Math.round(amount).toLocaleString("en-IN")}`;
  }
  // Non-INR amounts are approximate — the charge is processed in INR.
  return `≈ ${sym}${amount.toFixed(2)}`;
}
