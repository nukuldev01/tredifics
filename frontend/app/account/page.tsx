"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";

type Tab = "orders" | "addresses" | "profile";

export default function AccountPage() {
  const { user, access, signOut, setSession } = useAuth();
  const [tab, setTab] = useState<Tab>("orders");
  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");

  if (!user || !access) {
    return <AuthForms mode={mode} setMode={setMode} setSession={setSession} />;
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Hi {user.first_name || user.email}</h1>
          <p className="text-sm text-neutral-500">Manage your orders and details</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm underline text-neutral-600"
        >
          Sign out
        </button>
      </div>

      <div className="border-b border-neutral-200 flex gap-6 text-sm">
        {(["orders", "addresses", "profile"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 capitalize border-b-2 ${
              tab === t ? "border-ink" : "border-transparent text-neutral-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="py-6">
        {tab === "orders" && <Orders />}
        {tab === "addresses" && <Addresses />}
        {tab === "profile" && <Profile />}
      </div>
    </div>
  );
}

function AuthForms({
  mode,
  setMode,
  setSession,
}: {
  mode: "login" | "signup" | "otp";
  setMode: (m: any) => void;
  setSession: any;
}) {
  const [form, setForm] = useState({ email: "", password: "", first_name: "" });
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const r = await api.post("/auth/login/", {
          email: form.email,
          password: form.password,
        });
        const me = await api.get("/auth/me/", {
          headers: { Authorization: `Bearer ${r.data.access}` },
        });
        setSession({
          access: r.data.access,
          refresh: r.data.refresh,
          user: me.data,
        });
      } else if (mode === "signup") {
        const r = await api.post("/auth/signup/", form);
        setSession({
          access: r.data.access,
          refresh: r.data.refresh,
          user: r.data.user,
        });
      } else if (mode === "otp") {
        if (!otpRequested) {
          await api.post("/auth/otp/request/", { email: form.email });
          setOtpRequested(true);
        } else {
          const r = await api.post("/auth/otp/verify/", {
            email: form.email,
            code: otpCode,
          });
          setSession({
            access: r.data.access,
            refresh: r.data.refresh,
            user: r.data.user,
          });
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.email?.[0] ||
          err?.response?.data?.password?.[0] ||
          "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-serif text-3xl mb-6">
        {mode === "login" && "Sign in"}
        {mode === "signup" && "Create account"}
        {mode === "otp" && "Login with email code"}
      </h1>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <input
            placeholder="First name"
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        )}
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {(mode === "login" || mode === "signup") && (
          <input
            required
            type="password"
            placeholder="Password"
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        )}
        {mode === "otp" && otpRequested && (
          <input
            required
            placeholder="6-digit code from email"
            maxLength={6}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm tracking-widest"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
        )}
        {error && <p className="text-xs text-rust">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-ink text-white py-3 text-sm uppercase tracking-wider"
        >
          {loading
            ? "Working…"
            : mode === "otp"
            ? otpRequested
              ? "Verify code"
              : "Send code"
            : mode === "signup"
            ? "Create account"
            : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-600 space-y-1">
        {mode !== "otp" && (
          <button
            onClick={() => setMode("otp")}
            className="underline"
          >
            Use email code instead
          </button>
        )}
        {mode === "otp" && (
          <button
            onClick={() => {
              setMode("login");
              setOtpRequested(false);
            }}
            className="underline"
          >
            Use password instead
          </button>
        )}
        <div>
          {mode === "login" ? (
            <>
              No account?{" "}
              <button onClick={() => setMode("signup")} className="underline">
                Create one
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Have an account?{" "}
              <button onClick={() => setMode("login")} className="underline">
                Sign in
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<any[] | null>(null);
  useEffect(() => {
    api.get("/orders/").then((r) => setOrders(r.data.results || r.data));
  }, []);

  if (!orders) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (orders.length === 0)
    return (
      <p className="text-sm text-neutral-500">
        No orders yet.{" "}
        <Link href="/collections/all" className="underline">
          Start shopping
        </Link>
      </p>
    );

  return (
    <ul className="divide-y divide-neutral-200 border border-neutral-200">
      {orders.map((o) => (
        <li key={o.id} className="p-4 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{o.display_id}</p>
            <p className="text-xs text-neutral-500">
              {new Date(o.created_at).toLocaleDateString()} ·{" "}
              <span className="capitalize">{o.status}</span> ·{" "}
              <span className="capitalize">{o.payment_status}</span>
            </p>
          </div>
          <p className="font-medium">{money(o.grand_total, o.currency)}</p>
        </li>
      ))}
    </ul>
  );
}

function Addresses() {
  const [list, setList] = useState<any[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    full_name: "",
    phone: "",
    line1: "",
    city: "",
    postal_code: "",
    country: "IN",
    is_default: false,
  });

  const load = () =>
    api.get("/auth/addresses/").then((r) => setList(r.data.results || r.data));
  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/auth/addresses/", form);
    setShowForm(false);
    setForm({
      full_name: "",
      phone: "",
      line1: "",
      city: "",
      postal_code: "",
      country: "IN",
      is_default: false,
    });
    load();
  };

  const remove = async (id: number) => {
    await api.delete(`/auth/addresses/${id}/`);
    load();
  };

  if (!list) return <p className="text-sm text-neutral-500">Loading…</p>;
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-medium">Saved addresses</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm underline"
        >
          {showForm ? "Cancel" : "Add new"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={save} className="grid grid-cols-2 gap-2 mb-6 text-sm">
          {[
            ["full_name", "Full name", true],
            ["phone", "Phone", true],
            ["line1", "Address", true],
            ["line2", "Apartment", false],
            ["city", "City", true],
            ["state", "State", false],
            ["postal_code", "Postal code", true],
          ].map(([k, l, req]) => (
            <input
              key={k as string}
              required={req as boolean}
              placeholder={l as string}
              value={form[k as string] || ""}
              onChange={(e) => setForm({ ...form, [k as string]: e.target.value })}
              className="border border-neutral-300 px-3 py-2"
            />
          ))}
          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="border border-neutral-300 px-3 py-2 col-span-2 bg-white"
          >
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
          </select>
          <label className="flex items-center gap-2 text-xs col-span-2">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
            Set as default
          </label>
          <button className="bg-ink text-white py-2 col-span-2">Save address</button>
        </form>
      )}
      {list.length === 0 ? (
        <p className="text-sm text-neutral-500">No saved addresses yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((a: any) => (
            <li
              key={a.id}
              className="border border-neutral-200 p-4 flex justify-between items-start text-sm"
            >
              <div>
                <p className="font-medium">{a.full_name}</p>
                <p className="text-neutral-600">
                  {a.line1}, {a.city}, {a.country} · {a.postal_code}
                </p>
                {a.is_default && (
                  <p className="text-xs text-emerald-700 mt-1">Default</p>
                )}
              </div>
              <button
                onClick={() => remove(a.id)}
                className="text-xs text-neutral-500 underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="text-sm space-y-2">
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Name:</strong> {user.first_name} {user.last_name}
      </p>
      <p>
        <strong>Country:</strong> {user.country}
      </p>
    </div>
  );
}
