"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useCart } from '@/contexts/CartContext';
import { catalogImageUrl } from '@/lib/catalogImage';
import { formatPrice } from '@/components/shop/ProductCard';

function QuantityInput({ item, busy, act, update }) {
  const [draft, setDraft] = useState(String(item.quantity));
  const commit = () => {
    const quantity = Number(draft);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) { setDraft(String(item.quantity)); return; }
    if (quantity !== item.quantity) act(() => update(item.product_id, quantity));
  };
  return <input aria-label={`Số lượng ${item.product?.name ?? ''}`} className="h-10 w-14 rounded-lg border text-center" disabled={busy} inputMode="numeric" max={20} min={1} onBlur={commit} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} type="number" value={draft} />;
}

export default function CartPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const { server, loading, error, update, remove, clear, refresh } = useCart();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = server?.items ?? [];
  const subtotal = rows.reduce((sum, item) => sum + (item.available ? item.unit_price_vnd * item.quantity : 0), 0);
  const blocked = rows.some((item) => !item.available);
  const act = async (callback) => {
    setBusy(true); setNotice('');
    try { await callback(); }
    catch (requestError) { setNotice(requestError.response?.data?.message ?? 'Không thể cập nhật giỏ hàng.'); }
    finally { setBusy(false); }
  };

  if (authLoading) return <p className="py-12 text-center text-sm text-slate-500" role="status">Đang kiểm tra tài khoản…</p>;
  if (!user) return <section className="mx-auto max-w-xl rounded-3xl border border-[#dce7de] bg-white p-8 text-center shadow-sm sm:p-10"><p className="eyebrow">Giỏ hàng của bạn</p><h1 className="mt-2 text-2xl font-semibold text-[#19352f]">Đăng nhập để sử dụng giỏ hàng</h1><p className="mt-3 text-sm leading-6 text-slate-600">Vui lòng đăng nhập trước khi thêm sản phẩm. Giỏ hàng sẽ được lưu theo tài khoản của bạn.</p><Link className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#193f36] px-6 text-sm font-semibold text-white hover:bg-[#28564d]" href={`/login?returnTo=${encodeURIComponent('/cart')}`}>Đăng nhập</Link><Link className="ml-3 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8e2da] px-6 text-sm font-semibold text-[#37665b]" href="/products">Xem sản phẩm</Link></section>;

  return <div className="mx-auto max-w-5xl pb-12"><p className="eyebrow">Giỏ hàng → Địa chỉ → Thanh toán → Kết quả</p><h1 className="mt-2 text-3xl font-semibold text-[#19352f]">Giỏ hàng</h1>
    {loading ? <p className="mt-8" role="status">Đang tải giỏ hàng…</p> : error ? <div className="mt-6 rounded-2xl border border-rose-200 p-5" role="alert">{error}<button className="ml-3 underline" onClick={() => refresh().catch(() => {})} type="button">Thử lại</button></div> : rows.length === 0 ? <div className="mt-8 rounded-2xl border border-[#dce7de] bg-white p-8 text-center"><p>Giỏ hàng của bạn đang trống.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white" href="/products">Xem sản phẩm</Link></div> : <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]"><div className="space-y-3">{rows.map((item) => <article className="flex gap-4 rounded-2xl border border-[#e3ebe5] bg-white p-4" key={item.product_id}><div className="size-20 shrink-0 rounded-xl bg-[#eef4ee] bg-contain bg-center bg-no-repeat" style={item.product?.image ? { backgroundImage: `url("${catalogImageUrl(item.product.image)}")` } : undefined} /><div className="min-w-0 flex-1"><Link className="font-semibold text-[#19352f] hover:underline" href={item.product?.slug ? `/products/${item.product.slug}` : '/products'}>{item.product?.name ?? 'Sản phẩm không còn hiển thị'}</Link><p className="mt-1 text-sm text-[#37665b]">{item.available ? formatPrice(item.unit_price_vnd) : 'Không thể mua lúc này'}</p>{item.price_changed && <p className="mt-1 text-xs font-medium text-amber-700">Giá đã thay đổi từ khi thêm vào giỏ. Tổng tiền đã cập nhật.</p>}<div className="mt-3 flex flex-wrap items-center gap-2"><button aria-label={`Giảm số lượng ${item.product?.name ?? ''}`} className="size-10 rounded-lg border" disabled={busy || item.quantity <= 1} onClick={() => act(() => update(item.product_id, item.quantity - 1))} type="button">−</button><QuantityInput act={act} busy={busy} item={item} key={`${item.product_id}:${item.quantity}`} update={update} /><button aria-label={`Tăng số lượng ${item.product?.name ?? ''}`} className="size-10 rounded-lg border" disabled={busy || item.quantity >= 20} onClick={() => act(() => update(item.product_id, item.quantity + 1))} type="button">+</button><button className="min-h-10 px-2 text-sm text-rose-700 underline" disabled={busy} onClick={() => act(() => remove(item.product_id))} type="button">Xóa</button></div></div></article>)}<button className="min-h-10 text-sm text-rose-700 underline" disabled={busy} onClick={() => { if (window.confirm('Xóa toàn bộ giỏ hàng?')) act(clear); }} type="button">Xóa toàn bộ giỏ hàng</button></div><aside className="h-fit rounded-2xl border border-[#dce7de] bg-white p-5 lg:sticky lg:top-5"><h2 className="font-semibold text-[#19352f]">Tạm tính</h2><p className="mt-3 text-2xl font-bold text-[#37665b]">{formatPrice(subtotal)}</p><p className="mt-2 text-xs text-slate-500">Giá sẽ được máy chủ kiểm tra lại khi đặt hàng. Phí giao hàng cố định sẽ hiển thị tại bước thanh toán.</p>{blocked && <p className="mt-3 text-sm text-rose-700">Có sản phẩm không thể mua. Hãy xóa trước khi tiếp tục.</p>}<Link aria-disabled={blocked} className={`mt-5 flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold ${blocked ? 'pointer-events-none bg-slate-200 text-slate-500' : 'bg-[#193f36] text-white'}`} href={user ? '/checkout' : '/login?returnTo=%2Fcheckout'}>{user ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'}</Link></aside></div>}
     {notice && <p className="mt-4 text-sm text-rose-700" role="alert">{notice}</p>}
  </div>;
}
