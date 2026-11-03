"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axiosClient from '@/lib/axiosClient';
import commerceServices from '@/services/commerceServices';

export default function PaymentResultPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    axiosClient.get(`/payments/vnpay/return${window.location.search}`).then(async ({ data }) => {
      if (!active) return;
      if (!data.data?.verified_return || !data.data.order_id) { setError('Không thể xác thực trang trả về. Kiểm tra đơn hàng trong tài khoản.'); return; }
      const order = await commerceServices.order(data.data.order_id);
      if (active) setResult(order.data.data);
    }).catch(() => { if (active) setError('Không thể kiểm tra kết quả. Vui lòng xem đơn hàng trong tài khoản.'); });
    return () => { active = false; };
  }, []);
  const pendingId = result && ['pending', 'failed'].includes(result.payment_status) ? result.id : null;
  useEffect(() => {
    if (!pendingId) return;
    const timer = setInterval(() => commerceServices.order(pendingId).then(({ data }) => setResult(data.data)).catch(() => {}), 10000);
    return () => clearInterval(timer);
  }, [pendingId]);
  return <div className="mx-auto max-w-xl rounded-2xl border border-[#e3ebe5] bg-white p-8 text-center"><h1 className="text-2xl font-semibold text-[#19352f]">Kết quả thanh toán VNPay</h1><p className="mt-4 text-sm text-slate-600" role="status">{error || !result ? error || 'Đang kiểm tra thanh toán…' : result.payment_status === 'paid' ? 'Thanh toán thành công. Máy chủ đã xác nhận IPN hợp lệ.' : result.payment_status === 'failed' ? 'Thanh toán không thành công. Bạn có thể thử lại trong chi tiết đơn.' : 'Đang chờ xác nhận thanh toán từ VNPay. Trang trả về chưa xác nhận đã trả tiền.'}</p><Link className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white" href={result ? `/account/orders/${result.id}` : '/account/orders'}>Xem đơn hàng</Link></div>;
}
