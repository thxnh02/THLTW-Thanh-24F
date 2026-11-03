"use client";

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import commerceServices from '@/services/commerceServices';
import { formatPrice } from '@/components/shop/ProductCard';

export default function PaymentResultPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    const directOrderId = orderParam === null ? null : Number(orderParam);
    const load = directOrderId !== null
      ? Number.isSafeInteger(directOrderId) && directOrderId > 0
        ? commerceServices.order(directOrderId).then(({ data }) => ({ data: { data: data.data } }))
        : Promise.reject(new Error('invalid-order'))
      : commerceServices.returnStatus(window.location.search).then(async ({ data }) => {
        if (!data.data?.verified_return || !data.data.order_id) throw new Error('invalid-return');
        return commerceServices.order(data.data.order_id);
      });
    load.then(({ data }) => { if (active) setResult(data.data); }).catch(() => {
      if (active) setError('Liên kết trả về không hợp lệ, hết phiên đăng nhập hoặc bạn không có quyền xem đơn. Hãy đăng nhập để xem đơn hàng.');
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const refreshOrder = useCallback(async (orderId) => {
    if (!orderId) return;
    setChecking(true);
    try {
      const { data } = await commerceServices.order(orderId);
      setResult(data.data); setError('');
    } catch {
      setError('Chưa thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally { setChecking(false); }
  }, []);

  const retryPayment = async () => {
    if (!result?.id || retrying) return;
    setRetrying(true); setError('');
    try {
      const { data } = await commerceServices.retry(result.id);
      if (data.data?.payment_url) {
        window.location.assign(data.data.payment_url);
        return;
      }
      await refreshOrder(result.id);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Chưa thể thử thanh toán lại. Hãy xem chi tiết đơn hàng.');
    } finally { setRetrying(false); }
  };

  useEffect(() => {
    if (result?.payment_status !== 'pending' || pollCount >= 5) return;
    let timer;
    const schedule = () => {
      if (document.hidden || timer) return;
      timer = window.setTimeout(async () => {
        timer = null;
        if (document.hidden) return;
        await refreshOrder(result.id);
        setPollCount((count) => count + 1);
      }, Math.min(6000 * 2 ** pollCount, 30000));
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', schedule); };
  }, [result?.id, result?.payment_status, pollCount, refreshOrder]);

  const status = result?.payment_status;
  const isDemo = status === 'demo_paid' && result?.payment_method === 'cod';
  const message = error || (!result ? 'Đang kiểm tra thanh toán…'
    : isDemo ? 'Bạn sẽ thanh toán khi nhận hàng (COD).'
      : status === 'paid' ? 'Giao dịch VNPay đã được máy chủ xác nhận.'
        : status === 'failed' ? 'VNPay xác nhận giao dịch không thành công.'
          : status === 'needs_review' ? 'Chưa thể xác nhận kết quả. Vui lòng không thanh toán lại để tránh trả tiền hai lần.'
            : status === 'pending' ? 'Đang chờ VNPay xác nhận. Trang trả về chưa chứng minh đã thanh toán.'
              : result.status === 'cancelled' ? 'Đơn hàng đã được hủy.'
                : 'Trạng thái đơn hàng cần được kiểm tra trong tài khoản.');
  const title = isDemo ? 'Đặt hàng thành công'
    : status === 'paid' ? 'Thanh toán thành công!'
      : status === 'failed' ? 'Thanh toán không thành công'
        : status === 'needs_review' ? 'Giao dịch cần kiểm tra'
          : status === 'pending' ? 'Đang xác nhận thanh toán'
            : 'Kết quả thanh toán';
  const canRetry = status === 'failed' && result?.payment_method === 'vnpay'
    && result?.status === 'pending' && !result?.payment_review_required;

  return <section className="mx-auto max-w-xl rounded-2xl border border-[#e3ebe5] bg-white p-5 text-center sm:p-8">
    <h1 className="text-2xl font-semibold text-[#19352f]">{title}</h1>
    {result?.order_code && <p className="mt-2 break-all text-xs text-slate-500">Mã đơn: {result.order_code}</p>}
    <p aria-live="polite" className={`mt-4 text-sm ${status === 'paid' || isDemo ? 'text-emerald-700' : status === 'failed' || status === 'needs_review' || error ? 'text-amber-800' : 'text-slate-600'}`} role="status">{message}</p>
    {result && <dl className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 rounded-xl bg-[#f4f7f4] p-4 text-left text-sm">
      <dt className="text-slate-600">Tổng tiền</dt><dd className="text-right font-semibold">{result.grand_total_vnd == null ? 'Chưa có dữ liệu' : formatPrice(result.grand_total_vnd)}</dd>
      <dt className="text-slate-600">Phương thức</dt><dd className="text-right font-semibold">{result.payment_method === 'vnpay' ? 'VNPay' : result.payment_method === 'cod' ? 'COD · thanh toán khi nhận hàng' : 'Đơn cũ'}</dd>
      <dt className="text-slate-600">Trạng thái thanh toán</dt><dd className="text-right font-semibold">{status === 'demo_paid' ? 'COD · chờ thu khi giao hàng' : status ?? 'Chưa có dữ liệu'}</dd>
    </dl>}
    {result?.payment_review_required && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-900" role="alert">Có giao dịch khác cần Admin kiểm tra. Lần thanh toán đã xác nhận vẫn được giữ nguyên trạng thái.</p>}
    {['pending', 'needs_review'].includes(status) && <button className="mt-5 min-h-11 rounded-full border border-[#b7d0bd] px-5 text-sm font-semibold text-[#28584a] disabled:opacity-50" disabled={checking} onClick={() => refreshOrder(result.id)} type="button">{checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>}
    {canRetry && <button className="mt-5 min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={retrying} onClick={retryPayment} type="button">{retrying ? 'Đang tạo liên kết…' : 'Thử thanh toán lại'}</button>}
    <div className="mt-5 flex flex-wrap justify-center gap-3"><Link className="inline-flex min-h-11 items-center rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white" href={result ? `/account/orders/${result.id}` : '/account/orders'}>Xem chi tiết đơn hàng</Link><Link className="inline-flex min-h-11 items-center rounded-full border border-[#b7d0bd] px-5 text-sm font-semibold text-[#28584a]" href="/products">Tiếp tục mua sắm</Link></div>
  </section>;
}
