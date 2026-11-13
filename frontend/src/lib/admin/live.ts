"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { collection, doc, limit as fsLimit, onSnapshot, orderBy, query, type QueryConstraint } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/client";

export const adminDemoMode = !isFirebaseConfigured;

export function toMillis(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Date.parse(v) || 0;
  return v?.toMillis?.() ?? (typeof v?.seconds === "number" ? v.seconds * 1000 : 0);
}

/** Converts Firestore Timestamps in common fields to epoch millis. */
export function normalize<T>(id: string, d: any): T {
  const out: any = { ...d, id };
  for (const k of ["createdAt", "updatedAt", "repliedAt", "expiresAt"]) if (k in out && out[k] != null) out[k] = toMillis(out[k]);
  if (Array.isArray(out.statusHistory)) out.statusHistory = out.statusHistory.map((h: any) => ({ ...h, at: toMillis(h.at) }));
  return out as T;
}

type ColOpts = { order?: string; dir?: "asc" | "desc"; max?: number; enabled?: boolean };

/**
 * Real-time collection listener (onSnapshot). In demo mode (no Firebase keys) returns `demo()`.
 * Returns null while loading.
 */
export function useLiveCollection<T>(path: string, demo: () => T[], opts: ColOpts = {}): { data: T[] | null; error: string | null } {
  const { order, dir = "desc", max, enabled = true } = opts;
  const [state, setState] = useState<{ key: string; data: T[] | null; error: string | null }>({ key: "", data: null, error: null });
  const key = `${path}|${order}|${dir}|${max}`;
  const demoData = useMemo(() => (adminDemoMode ? demo() : null), [demo]);

  useEffect(() => {
    if (adminDemoMode || !enabled) return;
    const fb = getFirebase();
    if (!fb) return;
    const cons: QueryConstraint[] = [];
    if (order) cons.push(orderBy(order, dir));
    if (max) cons.push(fsLimit(max));
    return onSnapshot(
      query(collection(fb.db, path), ...cons),
      (s) => setState({ key, data: s.docs.map((d) => normalize<T>(d.id, d.data())), error: null }),
      (e) => setState({ key, data: [], error: e.code === "permission-denied" ? "You don't have permission to view this data." : e.message }),
    );
  }, [key, path, order, dir, max, enabled]);

  if (demoData) return { data: demoData, error: null };
  return state.key === key ? { data: state.data, error: state.error } : { data: null, error: null };
}

/** Real-time single document listener. undefined = loading, null = missing. */
export function useLiveDoc<T>(path: string | null, demo: () => T | null): T | null | undefined {
  const [state, setState] = useState<{ path: string | null; data: T | null | undefined }>({ path: null, data: undefined });
  const demoData = useMemo(() => (adminDemoMode ? demo() : undefined), [demo]);
  useEffect(() => {
    if (adminDemoMode || !path) return;
    const fb = getFirebase();
    if (!fb) return;
    const [col, ...rest] = path.split("/");
    return onSnapshot(
      doc(fb.db, col, ...rest),
      (s) => setState({ path, data: s.exists() ? normalize<T>(s.id, s.data()) : null }),
      () => setState({ path, data: null }),
    );
  }, [path]);
  if (demoData !== undefined) return demoData;
  return state.path === path ? state.data : undefined;
}
