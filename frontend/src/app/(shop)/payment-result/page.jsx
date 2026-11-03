"use client";

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import commerceServices from '@/services/commerceServices';

export default function PaymentResultPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    let active = true;
    commerceServices.returnStatus(window.location.search).then(async ({ data }) => {
      if (!active) return;
      if (!data.data?.verified_return || !data.data.order_id) {
        setError('Liên kết trả về không hợp lệ hoặc đã hết quyền truy cập. Hãy xem đơn hàng trong tài khoản.');
        return;
      }
      const order = await commerceServices.order(data.data.order_id);
      if (active) setResult(order.data.data);
    }).catch(() => {
      if (active) setError('Không thể kiểm tra kết quả. Vui lòng xem đơn hàng trong tài khoản.');
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
  const message = error || (!result ? 'Đang kiểm tra thanh toán…'
    : status === 'paid' ? 'Thanh toán VNPay đã được máy chủ xác nhận.'
      : status === 'failed' ? 'VNPay xác nhận giao dịch không thành công. Bạn có thể thử lại trong chi tiết đơn hàng.'
        : status === 'needs_review' ? 'Giao dịch cần quản trị viên đối soát. Vui lòng chưa thử thanh toán lại để tránh trả tiền hai lần.'
          : status === 'pending' ? 'Đang chờ IPN hoặc đối soát VNPay. Trang trả về chưa chứng minh đã thanh toán.'
            : status === 'demo_paid' ? 'Đây là thanh toán mô phỏng, chưa có tiền thực nhận.'
              : 'Trạng thái đơn hàng cần được kiểm tra trong tài khoản.');

  return <div className="mx-auto max-w-xl rounded-2xl border border-[#e3ebe5] bg-white p-5 text-center sm:p-8">
    <h1 className="text-2xl font-semibold text-[#19352f]">Kết quả thanh toán VNPay</h1>
    {result?.order_code && <p className="mt-2 break-all text-xs text-slate-500">Mã đơn: {result.order_code}</p>}
    <p aria-live="polite" className={`mt-4 text-sm ${status === 'paid' ? 'text-emerald-700' : status === 'failed' || status === 'needs_review' || error ? 'text-amber-800' : 'text-slate-600'}`} role="status">{message}</p>
    {['pending', 'needs_review'].includes(status) && <button className="mt-5 min-h-11 rounded-full border border-[#b7d0bd] px-5 text-sm font-semibold text-[#28584a] disabled:opacity-50" disabled={checking} onClick={() => refreshOrder(result.id)} type="button">{checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>}
    <div className="mt-5"><Link className="inline-flex min-h-11 items-center rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white" href={result ? `/account/orders/${result.id}` : '/account/orders'}>Xem đơn hàng</Link></div>
  </div>;
}
