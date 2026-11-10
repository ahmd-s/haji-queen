"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
};

type WishlistState = {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => boolean; // returns true if now wishlisted
  remove: (productId: string) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (productId) => get().items.some((i) => i.productId === productId),
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          set({ items: get().items.filter((i) => i.productId !== item.productId) });
          return false;
        }
        set({ items: [item, ...get().items] });
        return true;
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
    }),
    { name: "hq-wishlist-v1" }
  )
);
