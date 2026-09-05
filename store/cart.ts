import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Empty in phase 1. The nav cart icon and its count badge read from
// this store so phase 2 (add to cart from the menu page) only needs to
// call addItem, not touch any layout code.
export type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  priceNaira: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
};

// Persisted to localStorage: there's no backend yet, so this is the
// only place a customer's cart survives a reload or a direct visit to
// /cart instead of a client-side navigation from the menu.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),
      setQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    // Hydration is triggered manually (see useCartHydration below) so the
    // very first client render matches the server's empty-cart HTML
    // instead of jumping straight to the persisted value and tripping a
    // hydration mismatch.
    { name: "norvilah-cart", skipHydration: true }
  )
);

export function useCartCount(): number {
  return useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
}

// Mounted once, high in the tree (NavBar, which every page renders), so
// the persisted cart loads right after the initial hydration-safe render.
export function useCartHydration(): void {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
}
