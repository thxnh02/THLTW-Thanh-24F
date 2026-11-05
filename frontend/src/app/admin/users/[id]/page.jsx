"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import userServices from "@/services/userServices";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!window.confirm('Xóa tài khoản này? Tài khoản sẽ không thể đăng nhập.')) return;
    setBusy(true); setError('');
    try { await userServices.deleteUser(id); router.push('/admin/users'); }
    catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể xóa tài khoản.'); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    let current = true;
    userServices.getUser(id).then(({ data }) => { if (current) setUser(data.data); }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy người dùng." : requestError.response?.data?.message ?? "Không thể tải người dùng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Tài khoản</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Chi tiết người dùng</h1></header>{loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải người dùng…</p>}{error && <p className="rounded-xl bg-rose-50 p-5 text-rose-800" role="alert">{error}</p>}{user && <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Họ tên</dt><dd className="mt-1 font-semibold text-slate-950">{user.name}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Email</dt><dd className="mt-1 text-slate-800">{user.email}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Số điện thoại</dt><dd className="mt-1">{user.phone ?? '—'}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt><dd className="mt-1">{user.blocked_at ? "Đã khóa" : "Hoạt động"}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Số đơn hàng</dt><dd className="mt-1">{user.orders_count ?? 0}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt><dd className="mt-1">{new Date(user.created_at).toLocaleString("vi-VN")}</dd></div></dl><div><h2 className="font-semibold">Địa chỉ đã lưu</h2>{user.addresses?.length ? <ul className="mt-2 space-y-2 text-sm text-slate-600">{user.addresses.map((address, index) => <li key={index}>{address.recipient_name} · {address.recipient_phone}<br />{[address.detail, address.street, address.ward, address.district, address.province].filter(Boolean).join(", ")}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Chưa có địa chỉ.</p>}</div><div><h2 className="font-semibold">Đơn hàng gần đây</h2>{user.orders?.length ? <ul className="mt-2 space-y-2">{user.orders.map((order) => <li key={order.id}><Link className="text-sm text-indigo-700 underline" href={`/admin/orders/${order.id}`}>Đơn #{order.id} · {order.grand_total_vnd == null ? 'Chưa có tổng tiền' : `${Number(order.grand_total_vnd).toLocaleString('vi-VN')} đ`}</Link></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Chưa có đơn hàng.</p>}</div><div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/admin/users">Quay lại</Link><Link className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-white ${user.blocked_at ? "bg-emerald-700" : "bg-rose-700"}`} href={`/admin/users/${id}/${user.blocked_at ? "unblock" : "block"}`}>{user.blocked_at ? "Mở khóa tài khoản" : "Khóa tài khoản"}</Link><button type="button" className="min-h-11 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50" disabled={busy} onClick={remove}>Xóa tài khoản</button></div></div>}</section>;
}
