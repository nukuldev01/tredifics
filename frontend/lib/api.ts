import axios from "axios";
import { useAuth } from "./auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { "Content-Type": "application/json" },
});

function clearTokens() {
  useAuth.getState().signOut();
}

// Shared in-flight refresh so several simultaneous 401s trigger only one call.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("tredific_refresh");
  if (!refresh) return null;
  try {
    const res = await axios.post(`${baseURL}/api/auth/refresh/`, { refresh });
    const access: string | undefined = res.data?.access;
    if (access) localStorage.setItem("tredific_access", access);
    // With ROTATE_REFRESH_TOKENS the server returns a fresh refresh token too.
    if (res.data?.refresh) {
      localStorage.setItem("tredific_refresh", res.data.refresh);
    }
    return access ?? null;
  } catch {
    return null;
  }
}

// JWT auth interceptors (only on client)
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("tredific_access");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // On 401: try a one-time silent refresh and replay the request. If the
  // refresh token is also dead, drop both tokens so a stale token can't keep
  // poisoning otherwise-public requests — the user simply signs in again.
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error?.config;
      if (error?.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        if (!refreshing) {
          refreshing = refreshAccessToken().finally(() => {
            refreshing = null;
          });
        }
        const newAccess = await refreshing;
        if (newAccess) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
        clearTokens();
      }
      return Promise.reject(error);
    }
  );
}

export const fetcher = (url: string) =>
  api.get(url).then((r) => r.data);
