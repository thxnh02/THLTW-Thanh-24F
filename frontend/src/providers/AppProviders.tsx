"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { StoreSettingsProvider } from "@/context/StoreSettingsContext";
import { ToastProvider } from "@/context/ToastContext";

export function AppProviders({ children }: { children: ReactNode }) {
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
