"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/components/shop/ProductCard';
import customerAccountServices from '@/services/customerAccountServices';
import commerceServices from '@/services/commerceServices';
import axiosClient from '@/lib/axiosClient';
import AddressFormDialog from '@/components/shop/AddressFormDialog';
import { emptyAddressDraft, toAddressPayload, validateAddressDraft } from '@/lib/accountAddressForm.mjs';
import { authErrorMessage, authFieldErrors } from '@/components/shop/AuthFormShell';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const { server, refresh } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [options, setOptions] = useState(null);
  const [method, setMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buyId, setBuyId] = useState(null);
  const [buyProduct, setBuyProduct] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [invalidBuy, setInvalidBuy] = useState(false);
  const keyRef = useRef(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyAddressDraft);
  const [fieldErrors, setFieldErrors] = useState({});
  const [dialogError, setDialogError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const openAddress = (address = null) => {
    setEditing(address);
    setDraft(address ? { ...emptyAddressDraft, ...address, make_default: address.is_default } : { ...emptyAddressDraft, make_default: !addresses.length });
    setFieldErrors({}); setDialogError(''); setAddressOpen(true);
  };
  const saveAddress = async (event, overrideDraft) => {
    event.preventDefault();
    if (savingAddress) return;
    const current = overrideDraft ?? draft;
    const validation = validateAddressDraft(current);
    if (Object.keys(validation).length) { setFieldErrors(validation); return; }
    setSavingAddress(true); setFieldErrors({}); setDialogError('');
    try {
      const payload = toAddressPayload(current);
      const response = editing ? await customerAccountServices.updateAddress(editing.id, payload) : await customerAccountServices.createAddress(payload);
      const saved = response.data?.data?.address;
      if (!saved?.id) throw new Error('Máy chủ chưa xác nhận địa chỉ.');
      setAddresses((list) => editing ? list.map((item) => item.id === saved.id ? saved : item) : [saved, ...list]);
      setAddressId(String(saved.id));
      setAddressOpen(false);
      customerAccountServices.addresses().then(({ data }) => setAddresses(data.data?.addresses ?? [])).catch(() => {});
    } catch (requestError) { setFieldErrors(authFieldErrors(requestError)); setDialogError(authErrorMessage(requestError, 'Không thể lưu địa chỉ.')); }
    finally { setSavingAddress(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(`/login?returnTo=${encodeURIComponent(`/checkout${window.location.search}`)}`); return; }
    const params = new URLSearchParams(window.location.search);
    const rawBuy = params.get('buy');
    const rawQuantity = params.get('quantity') ?? '1';
    const productId = rawBuy === null ? null : Number(rawBuy);
    const quantity = Number(rawQuantity);
    if (rawBuy !== null && (!Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)) {
      Promise.resolve().then(() => { setInvalidBuy(true); setError('Thông tin Mua ngay không hợp lệ. Vui lòng chọn lại sản phẩm.'); setLoading(false); }); return;
    }
    Promise.all([customerAccountServices.addresses(), axiosClient.get('/commerce/options'),
      productId ? axiosClient.get(`/products/id/${productId}`) : refresh()])
      .then(([addressResponse, optionResponse, productResponse]) => {
        setBuyId(productId); setBuyQuantity(quantity);
        setInvalidBuy(false);
        const list = addressResponse.data?.data?.addresses ?? [];
        setAddresses(list); setAddressId(String(list[0]?.id ?? ''));
        setOptions(optionResponse.data?.data ?? null);
        if (productId) setBuyProduct(productResponse.data?.data ?? null);
      }).catch((requestError) => { setInvalidBuy(true); setError(requestError.response?.status === 404 ? 'Sản phẩm Mua ngay hiện không còn bán. Hãy chọn sản phẩm khác.' : requestError.response?.data?.message ?? 'Không thể tải thông tin đặt hàng.'); })
      .finally(() => setLoading(false));
  }, [authLoading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const buyPrice = buyProduct ? Math.round(Number(buyProduct.sale_price != null && Number(buyProduct.sale_price) < Number(buyProduct.price) ? buyProduct.sale_price : buyProduct.price)) : 0;
  const buyAvailable = buyProduct && (buyProduct.stock_quantity === null || buyProduct.stock_quantity >= buyQuantity);
  const rows = buyId ? (buyProduct ? [{ product_id: buyId, quantity: buyQuantity, unit_price_vnd: buyPrice,
    available: buyAvailable, product: buyProduct }] : []) : server?.items ?? [];
  const subtotal = rows.reduce((sum, row) => sum + (row.available ? row.unit_price_vnd * row.quantity : 0), 0);
  const appliedCoupon = coupon && coupon.subtotal_vnd === subtotal ? coupon : null;
  const total = subtotal - (appliedCoupon?.discount_vnd ?? 0) + (options?.shipping_fee_vnd ?? 0);
  const applyCoupon = async () => {
    if (!couponCode.trim() || couponLoading) return;
    setCouponLoading(true); setCouponError(''); setCoupon(null);
    try {
      const { data } = await commerceServices.previewCoupon({ code: couponCode.trim(),
        ...(buyId ? { buy_now_product_id: buyId, buy_now_quantity: buyQuantity } : {}) });
      setCoupon(data.data);
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setCouponError(errors ? Object.values(errors).flat()[0] : 'Không thể áp dụng mã giảm giá.');
    } finally { setCouponLoading(false); }
  };
  const ready = user && !invalidBuy && rows.length > 0 && rows.every((row) => row.available) && addressId && options
    && (method === 'cod' ? (options.cod_enabled ?? options.cod_demo_enabled) : options.vnpay_sandbox_enabled && total >= 5000 && total <= 9999999999);
  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true); setError('');
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    try {
      const { data } = await commerceServices.checkout({ address_id: Number(addressId), payment_method: method,
        idempotency_key: keyRef.current, customer_note: note || null, expected_shipping_fee_vnd: Number(options?.shipping_fee_vnd ?? 0),
        ...(appliedCoupon ? { coupon_code: appliedCoupon.code, coupon_expected_subtotal: appliedCoupon.subtotal_vnd, coupon_expected_discount: appliedCoupon.discount_vnd } : {}),
        ...(buyId ? { buy_now_product_id: buyId, buy_now_quantity: buyQuantity } : {}) });
      if (data.data?.payment_url) { window.location.assign(data.data.payment_url); return; }
      await refresh().catch(() => {});
      router.replace(`/payment-result?order=${encodeURIComponent(data.data.order.id)}`);
    } catch (requestError) {
      const fields = requestError.response?.data?.errors;
      setError(fields ? Object.values(fields).flat()[0] : requestError.response?.data?.message ?? 'Không thể đặt hàng. Vui lòng thử lại.');
    }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <p className="py-12 text-center" role="status">Đang tải thanh toán…</p>;
  return <div className="mx-auto max-w-5xl pb-12"><p className="eyebrow">Giỏ hàng → Địa chỉ → Thanh toán → Kết quả</p><h1 className="mt-2 text-3xl font-semibold text-[#19352f]">Đặt hàng</h1>
    {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
    {buyId && <section className="mt-5 rounded-2xl border border-[#cdded1] bg-[#f3f8f3] p-4"><p className="text-sm font-semibold text-[#19352f]">Mua ngay · giỏ hàng của bạn sẽ được giữ nguyên</p>{buyProduct ? <div className="mt-3 flex flex-wrap items-center gap-3"><Link className="text-sm text-[#37665b] underline" href={`/products/${encodeURIComponent(buyProduct.slug)}`}>{buyProduct.name}</Link><label className="text-sm" htmlFor="buy-now-quantity">Số lượng <input className="ml-2 h-11 w-20 rounded-xl border px-2" id="buy-now-quantity" min={1} max={Math.min(20, buyProduct.stock_quantity ?? 20)} onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= Math.min(20, buyProduct.stock_quantity ?? 20)) { setBuyQuantity(next); const url = new URL(window.location.href); url.searchParams.set('quantity', String(next)); window.history.replaceState(null, '', url); } }} type="number" value={buyQuantity} /></label>{!buyAvailable && <span className="text-sm text-rose-700">Sản phẩm không đủ số lượng. Hãy chọn ít hơn hoặc quay lại sản phẩm.</span>}</div> : <Link className="mt-2 inline-block text-sm text-[#37665b] underline" href="/products">Chọn sản phẩm khác</Link>}</section>}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="space-y-5"><section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h2 className="text-lg font-semibold text-[#19352f]">1. Địa chỉ nhận hàng</h2>{addresses.length ? <div className="mt-3 space-y-2">{addresses.map((address) => <label className="flex min-h-14 cursor-pointer gap-3 rounded-xl border border-[#e3ebe5] p-3" key={address.id}><input checked={addressId === String(address.id)} name="delivery-address" onChange={() => setAddressId(String(address.id))} type="radio" value={address.id} /><span className="text-sm"><strong>{address.recipient_name}</strong> · {address.recipient_phone}<br />{address.full_address}</span></label>)}</div> : <p className="mt-3 text-sm text-slate-600">Bạn chưa có địa chỉ nhận hàng.</p>}<div className="mt-3 flex flex-wrap gap-3"><button className="min-h-11 text-sm font-semibold text-[#37665b] underline" disabled={addresses.length >= 10} onClick={() => openAddress()} type="button">Thêm địa chỉ</button>{addressId && <button className="min-h-11 text-sm font-semibold text-[#37665b] underline" onClick={() => openAddress(addresses.find((item) => String(item.id) === addressId))} type="button">Sửa địa chỉ đã chọn</button>}<Link className="inline-flex min-h-11 items-center text-sm text-slate-600 underline" href="/account/addresses">Sổ địa chỉ</Link></div></section>
      <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h2 className="text-lg font-semibold text-[#19352f]">2. Phương thức thanh toán</h2><div className="mt-3 space-y-2"><label className="flex min-h-14 items-center gap-3 rounded-xl border p-3 text-sm"><input checked={method === 'cod'} disabled={!(options?.cod_enabled ?? options?.cod_demo_enabled)} name="method" onChange={() => setMethod('cod')} type="radio" />Thanh toán khi nhận hàng (COD)</label><label className="flex min-h-14 items-center gap-3 rounded-xl border p-3 text-sm"><input checked={method === 'vnpay'} disabled={!options?.vnpay_sandbox_enabled || total < 5000 || total > 9999999999} name="method" onChange={() => setMethod('vnpay')} type="radio" />Thanh toán qua VNPay — xác nhận bằng IPN hợp lệ</label></div>{!options?.vnpay_sandbox_enabled && <p className="mt-2 text-xs text-slate-500">VNPay hiện chưa khả dụng.</p>}{total > 0 && (total < 5000 || total > 9999999999) && <p className="mt-2 text-xs text-amber-700">VNPay chỉ nhận đơn từ 5.000 đ đến 9.999.999.999 đ. COD vẫn dùng được nếu đã bật.</p>}{!(options?.cod_enabled ?? options?.cod_demo_enabled) && <p className="mt-2 text-xs text-slate-500">COD chưa được bật trên máy chủ.</p>}<label className="mt-4 block text-sm font-medium text-[#19352f]" htmlFor="checkout-note">Ghi chú (tùy chọn)</label><textarea className="mt-1 w-full rounded-xl border border-[#dce7de] p-3 text-sm" id="checkout-note" maxLength={500} onChange={(event) => setNote(event.target.value)} rows={2} value={note} /></section></div>
      <aside className="h-fit rounded-2xl border border-[#dce7de] bg-white p-5 lg:sticky lg:top-5"><h2 className="font-semibold text-[#19352f]">3. Xác nhận đơn hàng</h2>{rows.length ? <div className="mt-3 space-y-2">{rows.map((row) => <p className="flex justify-between gap-3 text-sm" key={row.product_id}><span>{row.product?.name} × {row.quantity}</span><span className="shrink-0">{row.available ? formatPrice(row.unit_price_vnd * row.quantity) : 'Không bán'}</span></p>)}</div> : <p className="mt-3 text-sm text-slate-500">Không có sản phẩm để đặt.</p>}<label className="mt-4 block text-sm font-medium" htmlFor="coupon-code">Mã giảm giá</label><div className="mt-1 flex gap-2"><input className="admin-input min-w-0 flex-1" id="coupon-code" maxLength={40} value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setCoupon(null); setCouponError(''); }} /><button className="rounded-lg bg-[#193f36] px-3 text-sm font-semibold text-white disabled:opacity-50" disabled={!couponCode.trim() || couponLoading || !rows.length} onClick={applyCoupon} type="button">{couponLoading ? 'Đang kiểm tra…' : 'Áp dụng'}</button></div>{couponError && <p className="mt-2 text-sm text-rose-700" role="alert">{couponError}</p>}{coupon && !appliedCoupon && <p className="mt-2 text-sm text-amber-700">Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã.</p>}{appliedCoupon && <p className="mt-2 text-sm text-emerald-700">Đã áp dụng {appliedCoupon.code}.</p>}<div className="mt-4 border-t pt-3 text-sm"><p className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></p>{appliedCoupon && <p className="mt-2 flex justify-between text-emerald-700"><span>Giảm giá</span><span>−{formatPrice(appliedCoupon.discount_vnd)}</span></p>}<p className="mt-2 flex justify-between"><span>Phí giao hàng</span><span>{formatPrice(options?.shipping_fee_vnd ?? 0)}</span></p><p className="mt-3 flex justify-between text-lg font-bold text-[#19352f]"><span>Tổng cộng</span><span>{formatPrice(total)}</span></p></div>{rows.some((row) => row.price_changed) && <p className="mt-3 text-sm font-medium text-amber-700">Có sản phẩm đổi giá; hãy xem lại tổng tiền trước khi đặt.</p>}<p className="mt-3 text-xs text-slate-500">Tổng tiền cuối cùng được tính lại trên máy chủ. Với COD, bạn sẽ thanh toán khi nhận hàng.</p><button className="mt-5 min-h-12 w-full rounded-full bg-[#193f36] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!ready || submitting} onClick={submit} type="button">{submitting ? 'Đang xử lý…' : 'Xác nhận đặt hàng'}</button><Link className="mt-3 block text-center text-sm text-[#37665b] underline" href="/cart">Về giỏ hàng</Link></aside></div>
    <AddressFormDialog open={addressOpen} setOpen={setAddressOpen} editing={editing} draft={draft} setDraft={setDraft} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} dialogError={dialogError} saving={savingAddress} onSubmit={saveAddress} />
  </div>;
}
