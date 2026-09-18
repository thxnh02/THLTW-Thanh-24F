"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import { ToastProvider } from "@/contexts/ToastContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreSettingsProvider>
      <ToastProvider>
        <AuthProvider>
          <ConfirmProvider>
            <CartProvider>{children}</CartProvider>
          </ConfirmProvider>
        </AuthProvider>
      </ToastProvider>
    </StoreSettingsProvider>
  );
}
