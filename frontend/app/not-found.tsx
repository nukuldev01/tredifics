import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-24 px-4">
      <h1 className="font-serif text-5xl">404</h1>
      <p className="mt-3 text-neutral-600">
        We couldn't find what you were looking for.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 bg-ink text-white px-6 py-3 text-sm uppercase tracking-wider"
      >
        Back to home
      </Link>
    </div>
  );
}
