"use client";
import { getFirebase } from "./firebase/client";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const isApiConfigured = Boolean(BASE);

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

type Opts = {
  /** When the backend isn't configured yet, resolve with `demoResult` instead of failing. */
  silentDemo?: boolean;
  demoResult?: unknown;
  signal?: AbortSignal;
};

async function authHeader(): Promise<Record<string, string>> {
  const token = await getFirebase()?.auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown, opts: Opts = {}): Promise<T> {
  if (!isApiConfigured) {
    if (opts.silentDemo) {
      await new Promise((r) => setTimeout(r, 600));
      return (opts.demoResult ?? {}) as T;
    }
    throw new ApiError("The store backend isn't connected yet (demo mode).", 503);
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error ?? "Request failed. Please try again.", res.status, data?.details);
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: Opts) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: Opts) => request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: Opts) => request<T>("PATCH", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: Opts) => request<T>("PUT", path, body, opts),
  delete: <T>(path: string, opts?: Opts) => request<T>("DELETE", path, undefined, opts),
};
