"use client";
import { createContext, useContext } from "react";
import type { Category, Product, StoreSettings } from "@/lib/types";

type StoreData = { settings: StoreSettings; categories: Category[]; products: Product[] };
const Ctx = createContext<StoreData | null>(null);

export function StoreDataProvider({ value, children }: { value: StoreData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStoreData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStoreData must be used inside <StoreDataProvider>");
  return v;
}
