import type { CartItem } from "@/context/CartContext";

const STORAGE_KEY = "thltw_guest_cart_v1";
type StoredCart = { version: 1; items: CartItem[] };

export const guestCartStorage = {
  load(): CartItem[] {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as StoredCart;
      return parsed.version === 1 && Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  },
  save(items: CartItem[]): void { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items } satisfies StoredCart)); },
};
