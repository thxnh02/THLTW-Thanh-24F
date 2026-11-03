"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import commerceServices from '@/services/commerceServices';
import { formatPrice } from '@/components/shop/ProductCard';
import { downloadErrorMessage, saveBlobDownload } from '@/lib/downloadFile';

const paymentLabels = {
  pending: 'Đang chờ xác nhận thanh toán',
  needs_review: 'Giao dịch cần quản trị viên đối soát; chưa xác nhận đã thanh toán',
  failed: 'Thanh toán không thành công',
  paid: 'Thanh toán VNPay thành công',
  demo_paid: 'Đặt hàng thành công · thanh toán khi giao hàng',
};
const attemptLabels = { pending: 'Đang chờ', needs_review: 'Cần đối soát', failed: 'Không thành công', succeeded: 'Đã xác nhận' };

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reload = () => commerceServices.order(id).then(({ data }) => { setOrder(data.data); setError(''); }).catch(() => setError('Không thể tải đơn hàng.'));
  useEffect(() => { reload(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const retry = async () => {
    setBusy(true);
    try { const { data } = await commerceServices.retry(id); window.location.assign(data.data.payment_url); }
    catch (requestError) { setError(requestError.response?.data?.message ?? 'Không thể thanh toán lại.'); setBusy(false); reload(); }
  };
  const cancel = async () => {
    if (!window.confirm('Hủy đơn hàng này?')) return;
    setBusy(true);
    try { const { data } = await commerceServices.cancel(id); setOrder(data.data); }
    catch (requestError) { setError(requestError.response?.data?.message ?? 'Không thể hủy đơn.'); }
    finally { setBusy(false); }
  };
  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await commerceServices.orderPdf(id);
      saveBlobDownload(response.data, `phieu-don-hang-${order.order_code ?? order.id}.pdf`);
    } catch (requestError) {
      setError(await downloadErrorMessage(requestError, 'Không thể tải phiếu đơn hàng.'));
    } finally {
      setDownloading(false);
    }
  };
  if (error && !order) return <p className="rounded-xl border border-rose-200 p-4 text-rose-700" role="alert">{error}</p>;
  if (!order) return <p role="status">Đang tải đơn hàng…</p>;
  const address = order.shipping_snapshot;
  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5">
      <Link className="text-sm text-[#37665b] underline" href="/account/orders">← Đơn hàng</Link>
      <h2 className="mt-3 text-xl font-semibold text-[#19352f]">Đơn #{order.id}</h2>
      <p className="mt-2 text-sm text-slate-600">Trạng thái xử lý: {{ pending: 'Chờ xử lý', processing: 'Đang xử lý', delivered: 'Đã giao', cancelled: 'Đã hủy' }[order.status] ?? order.status}</p>
      <p aria-live="polite" className="mt-2 text-sm font-semibold text-[#37665b]">{order.status === 'cancelled' && order.payment_method === 'cod' ? 'Đơn COD đã hủy' : paymentLabels[order.payment_status] ?? 'Đơn cũ chưa có dữ liệu thanh toán'}</p>
      {order.payment_status === 'demo_paid' && <p className="mt-2 text-xs text-slate-500">Bạn sẽ thanh toán khi nhận hàng (COD).</p>}
      {order.payment_status === 'needs_review' && <p className="mt-2 text-sm text-amber-800">Không thử thanh toán lại khi kết quả còn mơ hồ. Quản trị viên cần kiểm tra giao dịch.</p>}
      {order.payment_review_required && order.payment_status === 'paid' && <p className="mt-2 text-sm text-amber-800">Có giao dịch bổ sung đang được quản trị viên kiểm tra. Vui lòng không thanh toán thêm.</p>}
      {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {order.payment_method === 'vnpay' && ['pending', 'needs_review'].includes(order.payment_status) && <button className="min-h-11 rounded-full border border-[#b7d0bd] px-5 text-sm font-semibold text-[#28584a]" disabled={busy} onClick={reload} type="button">Kiểm tra lại trạng thái</button>}
        {order.payment_method === 'vnpay' && ['pending', 'failed'].includes(order.payment_status) && order.status === 'pending' && <button className="min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={retry} type="button">Thử thanh toán VNPay</button>}
        {order.payment_method === 'cod' && order.status === 'pending' && <button className="min-h-11 px-3 text-sm text-rose-700 underline" disabled={busy} onClick={cancel} type="button">Hủy đơn</button>}
        <button className="min-h-11 rounded-full border border-[#b7d0bd] px-5 text-sm font-semibold text-[#28584a] disabled:opacity-50" disabled={downloading} onClick={downloadPdf} type="button">{downloading ? 'Đang tạo phiếu…' : 'Tải phiếu đơn hàng PDF'}</button>
      </div>
    </section>
    {order.payment_method === 'vnpay' && <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h3 className="font-semibold">Lịch sử giao dịch VNPay</h3><div className="mt-3 space-y-3">{order.payment_attempts?.length ? order.payment_attempts.map((attempt) => <div className="rounded-xl bg-[#f4f7f4] p-3 text-sm" key={attempt.id}><p>Giao dịch #{attempt.id}: <strong>{attemptLabels[attempt.state] ?? 'Chưa rõ'}</strong></p><p className="mt-1 text-xs text-slate-600">Tạo: {attempt.created_at ? new Date(attempt.created_at).toLocaleString('vi-VN') : 'Chưa rõ'} · Kiểm tra gần nhất: {attempt.last_checked_at ? new Date(attempt.last_checked_at).toLocaleString('vi-VN') : 'Chưa kiểm tra'}</p></div>) : <p className="text-sm text-slate-500">Chưa có giao dịch.</p>}</div></section>}
    <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h3 className="font-semibold">Sản phẩm</h3><div className="mt-3 space-y-2">{order.items?.length ? order.items.map((item) => <p className="flex justify-between gap-3 text-sm" key={item.id}><span>{item.product_name} × {item.quantity}</span><span>{formatPrice(item.line_total_vnd)}</span></p>) : <p className="text-sm text-slate-500">Đơn cũ chưa có chi tiết sản phẩm.</p>}</div><p className="mt-4 border-t pt-3 font-bold">Tổng cộng: {order.grand_total_vnd == null ? 'Chưa có tổng tiền' : formatPrice(order.grand_total_vnd)}</p></section>
    {address && <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h3 className="font-semibold">Địa chỉ lúc đặt hàng</h3><p className="mt-2 text-sm text-slate-600">{address.recipient_name} · {address.recipient_phone}<br />{[address.detail, address.street, address.ward, address.district, address.province].filter(Boolean).join(', ')}</p></section>}
  </div>;
}
