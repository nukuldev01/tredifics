"use client";
import { useEffect } from "react";
import { useCountry } from "@/lib/currency";

export default function CountryDetector() {
  const setCountry = useCountry((s) => s.set);

  useEffect(() => {
    // Only fetch IP location if we haven't already detected it for this user.
    if (!localStorage.getItem("tredific-country-detected")) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_code) {
            const code = data.country_code; // e.g. "US", "IN", "GB"
            if (["US", "GB", "CA", "IN"].includes(code)) {
              setCountry(code as any);
            } else {
              // Default to USD for all other international visitors
              setCountry("US");
            }
            localStorage.setItem("tredific-country-detected", "true");
          }
        })
        .catch((error) => {
          console.error("Failed to detect country from IP:", error);
        });
    }
  }, [setCountry]);

  return null;
}
