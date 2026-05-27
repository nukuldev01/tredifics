"use client";
import { useEffect, useRef, useState } from "react";
import { X, Star, Upload, Image as ImageIcon, Film } from "lucide-react";
import { api } from "@/lib/api";

type Props = {
  productId: number;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function ReviewModal({
  productId, open, onClose, onSubmitted,
}: Props) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile back + Esc + lock scroll
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Push a history entry so the Android back button closes the modal
    window.history.pushState({ tredificModal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const additions = Array.from(list).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...additions]);
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!body.trim()) return setError("Please write your review.");
    if (rating < 1 || rating > 5) return setError("Please rate from 1 to 5.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("product", String(productId));
      form.append("name", name);
      form.append("rating", String(rating));
      form.append("title", title);
      form.append("body", body);
      files.forEach((f) => form.append("media", f));
      await api.post("/reviews/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToast("Thanks! Your review will appear once it's approved.");
      setRating(5);
      setName("");
      setTitle("");
      setBody("");
      setFiles([]);
      onSubmitted();
      setTimeout(() => {
        setToast("");
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Could not submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Write a review"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full md:max-w-lg bg-white/95 backdrop-blur-xl border-t md:border border-white/40 shadow-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Tredific®
            </p>
            <h3 className="font-serif text-xl">Write a review</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-500 hover:text-ink p-2 -mr-2"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Your rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                  className="p-1"
                >
                  <Star
                    size={26}
                    className={
                      n <= rating
                        ? "fill-[#fbbc04] text-[#fbbc04]"
                        : "text-neutral-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-2 md:col-span-1 border border-neutral-300 px-3 py-2.5 text-sm bg-white"
            />
            <input
              placeholder="Headline (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-2 md:col-span-1 border border-neutral-300 px-3 py-2.5 text-sm bg-white"
            />
          </div>

          <textarea
            required
            rows={5}
            placeholder="What did you love about this piece?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm bg-white resize-none"
          />

          {/* Media */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Photos & videos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 border border-dashed border-neutral-400 px-4 py-2.5 text-sm hover:border-ink"
            >
              <Upload size={14} /> Add photos / videos (up to 5)
            </button>
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square bg-neutral-100">
                    {f.type.startsWith("video") ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-200">
                        <Film size={20} />
                      </div>
                    ) : (
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="Remove"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rust">{error}</p>}
          {toast && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">
              {toast}
            </div>
          )}

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white/80 backdrop-blur py-3 -mx-5 px-5 border-t border-neutral-200/70">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-neutral-300 py-3 text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              disabled={submitting}
              className="flex-1 bg-ink text-white py-3 text-sm uppercase tracking-wider disabled:bg-neutral-400"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
