"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  key: string; // productId|size|color
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  lastAdded: string | null;
  add: (item: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAdded: null,
      add: (item) => {
        const key = `${item.productId}|${item.size}|${item.color}`;
        const existing = get().items.find((i) => i.key === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === key
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, Math.max(item.maxStock, 1)) }
                : i
            ),
            isOpen: true,
            lastAdded: key,
          });
        } else {
          set({ items: [...get().items, { ...item, key }], isOpen: true, lastAdded: key });
        }
      },
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      setQuantity: (key, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.key !== key) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(quantity, Math.max(i.maxStock, 1)) } : i
          ),
        });
      },
      clear: () => set({ items: [] }),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
    }),
    {
      name: "hq-cart-v1",
      partialize: (s) => ({ items: s.items }), // persist items only
    }
  )
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.price * i.quantity, 0);
}
