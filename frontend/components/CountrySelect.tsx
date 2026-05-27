"use client";
import { useEffect, useState } from "react";
import { useCountry } from "@/lib/currency";
import { SUPPORTED_COUNTRIES } from "@/lib/brand";
import { Globe } from "lucide-react";

export default function CountrySelect() {
  const { code, set } = useCountry();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <span className="hidden md:inline-flex items-center gap-1 text-xs text-neutral-600">
        <Globe size={14} /> IN
      </span>
    );
  }
  return (
    <label className="hidden md:inline-flex items-center gap-1 text-xs text-neutral-600 cursor-pointer">
      <Globe size={14} />
      <select
        value={code}
        onChange={(e) => set(e.target.value as any)}
        className="bg-transparent outline-none text-xs"
        aria-label="Country"
      >
        {SUPPORTED_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.currency}
          </option>
        ))}
      </select>
    </label>
  );
}
