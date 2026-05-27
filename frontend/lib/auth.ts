import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  country: string;
};

type AuthState = {
  user: User | null;
  access: string | null;
  refresh: string | null;
  setSession: (data: { access: string; refresh: string; user: User }) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      setSession: ({ access, refresh, user }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("tredific_access", access);
          localStorage.setItem("tredific_refresh", refresh);
        }
        set({ access, refresh, user });
      },
      signOut: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("tredific_access");
          localStorage.removeItem("tredific_refresh");
        }
        set({ user: null, access: null, refresh: null });
      },
    }),
    { name: "tredific-auth" }
  )
);
