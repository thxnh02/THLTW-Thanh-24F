"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import commerceServices from '@/services/commerceServices';
import { formatPrice } from '@/components/shop/ProductCard';

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reload = () => commerceServices.order(id).then(({ data }) => { setOrder(data.data); setError(''); }).catch(() => setError('Không thể tải đơn hàng.'));
  useEffect(() => { reload(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (order?.payment_status !== 'pending') return; const timer = setInterval(reload, 10000); return () => clearInterval(timer); }, [order?.payment_status, id]); // eslint-disable-line react-hooks/exhaustive-deps
  const retry = async () => { setBusy(true); try { const { data } = await commerceServices.retry(id); window.location.assign(data.data.payment_url); } catch (requestError) { setError(requestError.response?.data?.message ?? 'Không thể thanh toán lại.'); setBusy(false); } };
  const cancel = async () => { if (!window.confirm('Hủy đơn hàng này?')) return; setBusy(true); try { const { data } = await commerceServices.cancel(id); setOrder(data.data); } catch (requestError) { setError(requestError.response?.data?.message ?? 'Không thể hủy đơn.'); } finally { setBusy(false); } };
  if (error && !order) return <p className="rounded-xl border border-rose-200 p-4 text-rose-700" role="alert">{error}</p>;
  if (!order) return <p role="status">Đang tải đơn hàng…</p>;
  const address = order.shipping_snapshot;
  return <div className="space-y-5"><section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><Link className="text-sm text-[#37665b] underline" href="/account/orders">← Đơn hàng</Link><h2 className="mt-3 text-xl font-semibold text-[#19352f]">Đơn #{order.id}</h2><p className="mt-2 text-sm text-slate-600">Trạng thái xử lý: {{ pending: 'Chờ xử lý', processing: 'Đang xử lý', delivered: 'Đã giao', cancelled: 'Đã hủy' }[order.status] ?? order.status}</p><p className="mt-2 text-sm font-semibold text-[#37665b]">{order.status === 'cancelled' && order.payment_method === 'cod' ? 'Đơn COD mô phỏng đã hủy' : order.payment_status === 'demo_paid' ? 'Đặt hàng và thanh toán thành công (mô phỏng)' : order.payment_status === 'paid' ? 'Thanh toán VNPay thành công' : order.payment_status === 'failed' ? 'Thanh toán không thành công' : order.payment_status === 'pending' ? 'Đang chờ xác nhận thanh toán' : 'Đơn cũ chưa có dữ liệu thanh toán'}</p>{order.payment_status === 'demo_paid' && <p className="mt-2 text-xs text-slate-500">Đây là kết quả demo; chưa có tiền thực nhận.</p>}{error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}{order.payment_method === 'vnpay' && ['pending', 'failed'].includes(order.payment_status) && <button className="mt-4 min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={retry} type="button">Thử thanh toán VNPay</button>}{order.payment_method === 'cod' && order.status === 'pending' && <button className="mt-4 min-h-11 px-3 text-sm text-rose-700 underline" disabled={busy} onClick={cancel} type="button">Hủy đơn</button>}</section><section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h3 className="font-semibold">Sản phẩm</h3><div className="mt-3 space-y-2">{order.items?.length ? order.items.map((item) => <p className="flex justify-between gap-3 text-sm" key={item.id}><span>{item.product_name} × {item.quantity}</span><span>{formatPrice(item.line_total_vnd)}</span></p>) : <p className="text-sm text-slate-500">Đơn cũ chưa có chi tiết sản phẩm.</p>}</div><p className="mt-4 border-t pt-3 font-bold">Tổng cộng: {order.grand_total_vnd == null ? 'Chưa có tổng tiền' : formatPrice(order.grand_total_vnd)}</p></section>{address && <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5"><h3 className="font-semibold">Địa chỉ lúc đặt hàng</h3><p className="mt-2 text-sm text-slate-600">{address.recipient_name} · {address.recipient_phone}<br />{[address.detail, address.street, address.ward, address.district, address.province].filter(Boolean).join(', ')}</p></section>}</div>;
}
