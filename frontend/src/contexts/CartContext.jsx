"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import commerceServices from '@/services/commerceServices';

const KEY = 'ct24f_guest_cart_v1';
const CartContext = createContext(null);
const safeGuest = () => {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(rows) ? rows.filter((row) => Number.isInteger(row.product_id) && row.product_id > 0 && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 20).slice(0, 50) : [];
  } catch { return []; }
};

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useCustomerAuth();
  const [guest, setGuest] = useState([]);
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await commerceServices.cart();
    setServer(data.data);
    return data.data;
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      const rows = safeGuest();
      setGuest(rows);
      if (!user) { setServer(null); setLoading(false); return; }
      setServer(null);
      setLoading(true);
      try {
        if (rows.length) {
          const result = await commerceServices.merge(rows);
          const accepted = new Set(result.data?.data?.accepted_product_ids ?? []);
          const remaining = rows.filter((row) => !accepted.has(row.product_id));
          localStorage.setItem(KEY, JSON.stringify(remaining));
          if (active) setGuest(remaining);
        }
        const result = await commerceServices.cart();
        if (active) { setServer(result.data.data); setError(''); }
      } catch { if (active) setError('Không thể đồng bộ giỏ hàng. Vui lòng thử lại.'); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [user?.id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistGuest = (rows) => { localStorage.setItem(KEY, JSON.stringify(rows)); setGuest(rows); };
  const add = async (productId, quantity = 1) => {
    if (user) { const result = await commerceServices.add(productId, quantity); setServer(result.data.data); return; }
    const rows = safeGuest();
    const existing = rows.find((row) => row.product_id === productId);
    if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
    else rows.push({ product_id: productId, quantity: Math.min(20, quantity) });
    persistGuest(rows);
  };
  const update = async (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
    if (user) { const result = await commerceServices.update(productId, quantity); setServer(result.data.data); return; }
    persistGuest(safeGuest().map((row) => row.product_id === productId ? { ...row, quantity } : row));
  };
  const remove = async (productId) => {
    if (user) { const result = await commerceServices.remove(productId); setServer(result.data.data); return; }
    persistGuest(safeGuest().filter((row) => row.product_id !== productId));
  };
  const clear = async () => {
    if (user) { const result = await commerceServices.clear(); setServer(result.data.data); return; }
    persistGuest([]);
  };
  const count = useMemo(() => (user ? (server?.items ?? []) : guest).reduce((sum, row) => sum + row.quantity, 0), [user, server, guest]);
  return <CartContext.Provider value={{ guest, server, loading, error, count, add, update, remove, clear, refresh }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('CartProvider is missing.');
  return value;
}
