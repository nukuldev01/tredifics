"use client";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function OrderSuccess() {
  const sp = useSearchParams();
  const id = sp.get("id");
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
      <h1 className="font-serif text-3xl mt-4">Order placed!</h1>
      <p className="mt-2 text-neutral-600">
        Thank you for shopping with Tredific®. A confirmation email is on its way.
      </p>
      {id && (
        <p className="mt-3 text-xs text-neutral-500">
          Reference ID: <span className="font-mono">{id}</span>
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/account"
          className="bg-ink text-white py-3 text-sm uppercase tracking-wider"
        >
          View my orders
        </Link>
        <Link href="/" className="text-sm underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
