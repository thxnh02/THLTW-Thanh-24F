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
      if (!user) { setServer(null); setLoading(false); return; }
      const rows = safeGuest();
      setServer(null);
      setLoading(true);
      try {
        if (rows.length) {
          const result = await commerceServices.merge(rows);
          const accepted = new Set(result.data?.data?.accepted_product_ids ?? []);
          const remaining = rows.filter((row) => !accepted.has(row.product_id));
          localStorage.setItem(KEY, JSON.stringify(remaining));
        }
        const result = await commerceServices.cart();
        if (active) { setServer(result.data.data); setError(''); }
      } catch { if (active) setError('Không thể đồng bộ giỏ hàng. Vui lòng thử lại.'); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [user?.id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (productId, quantity = 1) => {
    if (!user) throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
    const result = await commerceServices.add(productId, quantity);
    setServer(result.data.data);
  };
  const update = async (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
    if (!user) throw new Error('Vui lòng đăng nhập để cập nhật giỏ hàng.');
    const result = await commerceServices.update(productId, quantity);
    setServer(result.data.data);
  };
  const remove = async (productId) => {
    if (!user) throw new Error('Vui lòng đăng nhập để cập nhật giỏ hàng.');
    const result = await commerceServices.remove(productId);
    setServer(result.data.data);
  };
  const clear = async () => {
    if (!user) throw new Error('Vui lòng đăng nhập để cập nhật giỏ hàng.');
    const result = await commerceServices.clear();
    setServer(result.data.data);
  };
  const count = useMemo(() => (user ? (server?.items ?? []) : []).reduce((sum, row) => sum + row.quantity, 0), [user, server]);
  return <CartContext.Provider value={{ server, loading, error, count, add, update, remove, clear, refresh }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('CartProvider is missing.');
  return value;
}
