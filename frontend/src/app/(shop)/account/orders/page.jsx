"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import commerceServices from '@/services/commerceServices';
import { formatPrice } from '@/components/shop/ProductCard';

const paymentLabel = (order) => order.status === 'cancelled' && order.payment_method === 'cod' ? 'Đơn COD đã hủy' : order.payment_status === 'demo_paid' ? 'COD · chờ thu khi giao hàng' : order.payment_status === 'paid' ? 'Đã thanh toán qua VNPay' : order.payment_status === 'failed' ? 'Thanh toán không thành công' : order.payment_status === 'pending' ? 'Đang chờ xác nhận thanh toán' : 'Đơn cũ chưa có dữ liệu thanh toán';
const statusLabel = { pending: 'Chờ xử lý', processing: 'Đang xử lý', delivered: 'Đã giao', cancelled: 'Đã hủy' };

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [last, setLast] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; commerceServices.orders(page).then(({ data }) => { if (active) { setOrders(data.data ?? []); setLast(data.meta?.last_page ?? 1); setError(''); } }).catch(() => { if (active) setError('Không thể tải đơn hàng.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [page]);
  return <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold text-[#19352f]">Đơn hàng của tôi</h2>{loading ? <p className="mt-5" role="status">Đang tải…</p> : error ? <p className="mt-5 text-rose-700" role="alert">{error}</p> : orders.length ? <div className="mt-5 space-y-3">{orders.map((order) => <Link className="block rounded-xl border border-[#e3ebe5] p-4 hover:bg-[#f6faf6]" href={`/account/orders/${order.id}`} key={order.id}><div className="flex flex-wrap justify-between gap-2"><strong>Đơn #{order.id}</strong><span>{order.grand_total_vnd == null ? 'Chưa có tổng tiền' : formatPrice(order.grand_total_vnd)}</span></div><p className="mt-1 text-sm text-slate-600">{paymentLabel(order)} · {statusLabel[order.status] ?? order.status}</p></Link>)}</div> : <p className="mt-5 text-sm text-slate-600">Bạn chưa có đơn hàng. <Link className="text-[#37665b] underline" href="/products">Xem sản phẩm</Link></p>}<div className="mt-5 flex gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">Trước</button><span>{page} / {last}</span><button disabled={page >= last} onClick={() => setPage(page + 1)} type="button">Sau</button></div></section>;
}
