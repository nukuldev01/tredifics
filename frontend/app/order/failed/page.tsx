"use client";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailedContent() {
  const sp = useSearchParams();
  const id = sp.get("id");
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <XCircle size={48} className="mx-auto text-rust" />
      <h1 className="font-serif text-3xl mt-4">Payment didn't go through</h1>
      <p className="mt-2 text-neutral-600">
        If any amount was deducted it will be refunded automatically
        within 5–7 business days. You can safely try the payment again.
      </p>
      {id && (
        <p className="mt-3 text-xs text-neutral-500">
          Reference: <span className="font-mono">{id}</span>
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/checkout"
          className="bg-ink text-white py-3 text-sm uppercase tracking-wider"
        >
          Try again
        </Link>
        <Link href="/" className="text-sm underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function OrderFailed() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}
