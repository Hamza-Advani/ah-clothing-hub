"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  ids: string[];
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
  set: (ids: string[]) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const exists = get().ids.includes(id);
        set({ ids: exists ? get().ids.filter((i) => i !== id) : [...get().ids, id] });
        return !exists;
      },
      has: (id) => get().ids.includes(id),
      set: (ids) => set({ ids }),
    }),
    { name: "ah-wishlist" },
  ),
);
