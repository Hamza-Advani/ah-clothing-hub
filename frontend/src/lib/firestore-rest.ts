/**
 * Minimal server-side Firestore reader (public REST API, respects security rules).
 * Used by server components for SEO-friendly, cached catalog pages.
 */
const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

export const isFirestoreRestConfigured = Boolean(PROJECT && KEY);

/* eslint-disable @typescript-eslint/no-explicit-any */
function decode(v: any): any {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return new Date(v.timestampValue).getTime();
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decode);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields ?? {});
  if ("referenceValue" in v) return v.referenceValue;
  if ("geoPointValue" in v) return v.geoPointValue;
  return null;
}
function decodeFields(fields: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decode(v);
  return out;
}
const docId = (name: string) => name.split("/").pop()!;

const opts = (revalidate: number) => ({ next: { revalidate, tags: ["catalog"] } }) as RequestInit;

/** List a whole collection (small collections: categories). */
export async function listCollection<T>(collection: string, revalidate = 60): Promise<T[] | null> {
  if (!isFirestoreRestConfigured) return null;
  try {
    const out: T[] = [];
    let token = "";
    do {
      const res = await fetch(`${BASE}/${collection}?pageSize=300&key=${KEY}${token ? `&pageToken=${token}` : ""}`, opts(revalidate));
      if (!res.ok) return null;
      const j = await res.json();
      for (const d of j.documents ?? []) out.push({ id: docId(d.name), ...decodeFields(d.fields ?? {}) } as T);
      token = j.nextPageToken ?? "";
    } while (token);
    return out;
  } catch {
    return null;
  }
}

/** Run a simple equality query (rules require e.g. active == true for products). */
export async function queryEquals<T>(collection: string, field: string, value: boolean | string, revalidate = 60): Promise<T[] | null> {
  if (!isFirestoreRestConfigured) return null;
  try {
    const body = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: typeof value === "boolean" ? { booleanValue: value } : { stringValue: value } } },
        limit: 1000,
      },
    };
    const res = await fetch(`${BASE}:runQuery?key=${KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), ...opts(revalidate) });
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    return rows.filter((r) => r.document).map((r) => ({ id: docId(r.document.name), ...decodeFields(r.document.fields ?? {}) }) as T);
  } catch {
    return null;
  }
}

export async function getDocument<T>(path: string, revalidate = 60): Promise<T | null> {
  if (!isFirestoreRestConfigured) return null;
  try {
    const res = await fetch(`${BASE}/${path}?key=${KEY}`, opts(revalidate));
    if (!res.ok) return null;
    const d = await res.json();
    return { id: docId(d.name), ...decodeFields(d.fields ?? {}) } as T;
  } catch {
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
