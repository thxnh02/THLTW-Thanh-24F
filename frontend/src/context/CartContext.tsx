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

import { cartService } from "@/services/cartService";
import { guestCartStorage } from "@/store/guestCartStorage";
import type { CartQuote, Product, ProductVariant } from "@/types/api";

export type CartItem = {
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

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clearCart: () => void;
  quote: (promotionCode?: string, shippingMethodId?: number) => Promise<CartQuote>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(guestCartStorage.load());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    guestCartStorage.save(items);
  }, [hydrated, items]);

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
    (promotionCode?: string, shippingMethodId?: number) =>
      cartService.quote({
        promotion_code: promotionCode || undefined,
        shipping_method_id: shippingMethodId,
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
