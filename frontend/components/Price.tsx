"use client";
import { useEffect, useState } from "react";
import { useCountry, displayMoney, currencyForCountry } from "@/lib/currency";

export default function Price({ amount }: { amount: string | number }) {
  const [mounted, setMounted] = useState(false);
  const code = useCountry((s) => s.code);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before hydration, default to INR so it matches the server render.
  if (!mounted) {
    return <>{displayMoney(amount, "INR")}</>;
  }

  // Once mounted on the client, use the user's selected country currency.
  return <>{displayMoney(amount, currencyForCountry(code))}</>;
}
