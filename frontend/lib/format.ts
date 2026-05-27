const SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  AED: "د.إ",
};

export function money(value: string | number, currency = "INR") {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "";
  const sym = SYMBOL[currency] || currency + " ";
  return `${sym}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function cn(...args: any[]) {
  return args.filter(Boolean).join(" ");
}
