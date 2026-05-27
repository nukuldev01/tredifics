"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state === "loading") return;
    setState("loading");
    try {
      await api.post("/content/newsletter/", { email });
      setEmail("");
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="mt-5 text-sm text-emerald-700">
        Thanks for subscribing — keep an eye on your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <div className="flex border border-neutral-300">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 px-4 py-3 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="bg-ink text-white px-6 text-sm disabled:bg-neutral-400"
        >
          {state === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-xs text-rust">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
