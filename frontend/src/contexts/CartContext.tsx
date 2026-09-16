"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiPost } from "@/lib/api";
import type { CartQuote, Product, ProductVariant } from "@/types/api";

const STORAGE_KEY = "thltw_guest_cart_v1";

type CartItem = {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  sku: string;
  image?: string | null;
  price: number;
  stockQuantity: number;
  quantity: number;
};

type StoredCart = {
  version: 1;
  items: CartItem[];
};

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clearCart: () => void;
  quote: (promotionCode?: string) => Promise<CartQuote>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as StoredCart;
      if (parsed.version === 1 && Array.isArray(parsed.items)) {
        return parsed.items;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    return [];
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: StoredCart = { version: 1, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items]);

  const addItem = useCallback(
    (product: Product, variant?: ProductVariant | null, quantity = 1) => {
      const selectedVariant = variant ?? product.default_variant ?? product.variants?.[0];
      if (!selectedVariant) {
        return;
      }

      setItems((current) => {
        const existing = current.find((item) => item.variantId === selectedVariant.id);
        const nextQuantity = Math.min(
          selectedVariant.stock_quantity,
          (existing?.quantity ?? 0) + quantity,
        );

        if (existing) {
          return current.map((item) =>
            item.variantId === selectedVariant.id
              ? { ...item, quantity: nextQuantity }
              : item,
          );
        }

        return [
          ...current,
          {
            variantId: selectedVariant.id,
            productId: product.id,
            productName: product.name,
            variantName: selectedVariant.name,
            sku: selectedVariant.sku,
            image: product.primary_image,
            price: Number(selectedVariant.sale_price ?? selectedVariant.price),
            stockQuantity: selectedVariant.stock_quantity,
            quantity: Math.max(1, nextQuantity),
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.variantId === variantId
            ? {
                ...item,
                quantity: Math.min(item.stockQuantity, Math.max(1, quantity)),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((variantId: number) => {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const quote = useCallback(
    (promotionCode?: string) =>
      apiPost<CartQuote>("/cart/quote", {
        promotion_code: promotionCode || undefined,
        items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      }),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      quote,
    }),
    [addItem, clearCart, items, quote, removeItem, updateQuantity],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
