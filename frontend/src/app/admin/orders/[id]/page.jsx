"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import orderServices from "@/services/orderServices";
import { downloadErrorMessage, saveBlobDownload } from "@/lib/downloadFile";

const paymentText = {
  demo_paid: "COD · chờ thu khi giao hàng",
  paid: "VNPay đã xác nhận thanh toán",
  pending: "Đang chờ xác nhận VNPay",
  failed: "VNPay xác nhận thất bại; tồn kho còn được giữ",
  needs_review: "Cần đối soát thủ công; chưa được coi là đã thanh toán",
};
const attemptText = { pending: "Đang chờ", succeeded: "Đã xác nhận", failed: "Thất bại", needs_review: "Cần đối soát" };
const reasonText = {
  late_or_conflicting_success: "Giao dịch thành công đến muộn hoặc trùng", conflicting_transaction_id: "Mã giao dịch VNPay không khớp",
  query_not_configured: "QueryDr chưa được cấu hình", legacy_missing_pay_timestamp: "Giao dịch cũ thiếu mốc tạo URL",
  local_order_mismatch: "Dữ liệu đơn và giao dịch không khớp", query_http_error: "VNPay trả lỗi HTTP",
  query_network_error: "Không kết nối được VNPay", query_invalid_signature: "Chữ ký phản hồi không hợp lệ",
  query_api_error: "VNPay chưa trả kết quả giao dịch", query_transaction_mismatch: "Thông tin giao dịch không khớp",
  query_malformed: "Phản hồi VNPay thiếu thông tin cần thiết",
  query_paid: "VNPay xác nhận thanh toán", query_terminal_failure: "VNPay xác nhận thất bại",
  query_incomplete: "Giao dịch chưa hoàn tất", expired_but_query_incomplete: "URL hết hạn nhưng giao dịch chưa rõ kết quả",
  query_suspicious_status: "Trạng thái giao dịch cần kiểm tra", ipn_00: "IPN thanh toán thành công",
  ipn_01: "IPN giao dịch chưa hoàn tất", ipn_02: "IPN giao dịch thất bại", ipn_04: "IPN giao dịch bị đảo", ipn_07: "IPN nghi vấn gian lận",
};
const outcomeText = { success: "Đã xác nhận", failed: "Thất bại", pending: "Đang chờ", review: "Cần kiểm tra", duplicate: "Thông báo trùng", closed_unpaid: "Đã đóng đơn", invalid: "Không hợp lệ" };

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let current = true;
    orderServices.getOrder(id).then(({ data }) => { if (current) setOrder(data.data); }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy đơn hàng." : requestError.response?.data?.message ?? "Không thể tải đơn hàng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  const reconcile = async (attemptId) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await orderServices.reconcile(id, attemptId);
      setOrder(data.data.order); setNotice(data.data.outcome === "success" ? "VNPay đã xác nhận thanh toán." : data.data.outcome === "failed" ? "VNPay xác nhận giao dịch thất bại." : "Chưa đủ bằng chứng thanh toán; cần tiếp tục theo dõi hoặc xem xét.");
    } catch (requestError) { setError(requestError.response?.data?.message ?? "Không thể đối soát lúc này."); }
    finally { setBusy(false); }
  };
  const closeUnpaid = async () => {
    if (!confirmed || reason.trim().length < 10) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await orderServices.closeUnpaid(id, reason.trim());
      setOrder(data.data); setNotice("Đã đóng đơn chưa thanh toán và hoàn lại tồn kho một lần.");
      setConfirmed(false);
    } catch (requestError) { setError(requestError.response?.data?.message ?? "Không thể đóng đơn."); }
    finally { setBusy(false); }
  };
  const downloadPdf = async () => {
    setDownloading(true); setError("");
    try {
      const response = await orderServices.orderPdf(id);
      saveBlobDownload(response.data, `phieu-don-hang-${order.order_code ?? order.id}.pdf`);
    } catch (requestError) {
      setError(await downloadErrorMessage(requestError, "Không thể tải phiếu đơn hàng."));
    } finally { setDownloading(false); }
  };
  const canClose = order?.payment_method === "vnpay" && order.status === "pending" && order.payment_status === "failed"
    && order.payment_attempts?.length > 0 && order.payment_attempts.every((attempt) => attempt.state === "failed");

  return <section className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Đơn hàng</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Chi tiết đơn #{id}</h1></header>
    {loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải đơn hàng…</p>}
    {error && <p className="rounded-xl bg-rose-50 p-5 text-rose-800" role="alert">{error}</p>}
    {notice && <p className="rounded-xl bg-emerald-50 p-5 text-emerald-800" role="status">{notice}</p>}
    {order && <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {order.payment_review_required && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900" role="alert">Có giao dịch thành công đến muộn hoặc trùng sau thay đổi trạng thái. Kiểm tra với VNPay trước khi xử lý tiền hay giao hàng; hệ thống không tự ghi nhận lần thanh toán này.</p>}
      <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt><dd className="mt-2"><OrderStatusBadge status={order.status} /></dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt><dd className="mt-1">{new Date(order.created_at).toLocaleString("vi-VN")}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Người dùng</dt><dd className="mt-1 font-semibold">{order.user?.name ?? "—"}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Email</dt><dd className="mt-1">{order.user?.email ?? "—"}</dd></div></dl>
      <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">Thanh toán: {order.status === "cancelled" && order.payment_method === "cod" ? "Đơn COD đã hủy" : paymentText[order.payment_status] ?? "Đơn cũ chưa có dữ liệu thanh toán"}</p><p className="mt-2">Tổng tiền: {order.grand_total_vnd == null ? "—" : `${Number(order.grand_total_vnd).toLocaleString("vi-VN")} đ`}</p></div>
      <div><h2 className="font-semibold">Sản phẩm</h2>{order.items?.length ? order.items.map((item) => <p className="mt-2 text-sm" key={item.id}>{item.product_name} × {item.quantity}</p>) : <p className="mt-2 text-sm text-slate-500">Đơn cũ chưa có chi tiết sản phẩm.</p>}</div>
      {order.shipping_snapshot && <div className="text-sm"><h2 className="font-semibold">Địa chỉ khi đặt</h2><p className="mt-1">{order.shipping_snapshot.recipient_name} · {order.shipping_snapshot.recipient_phone}</p><p>{[order.shipping_snapshot.detail, order.shipping_snapshot.street, order.shipping_snapshot.ward, order.shipping_snapshot.district, order.shipping_snapshot.province].filter(Boolean).join(", ")}</p></div>}
      {order.payment_attempts?.length > 0 && <div><h2 className="font-semibold">Lần thanh toán VNPay</h2><div className="mt-2 space-y-2">{order.payment_attempts.map((attempt) => <div className="rounded-lg bg-slate-50 p-3 text-xs" key={attempt.id}><p className="break-all font-semibold">{attemptText[attempt.state] ?? attempt.state} · #{attempt.id} · {attempt.txn_ref}</p><p className="mt-1 text-slate-600">Hết hạn URL: {attempt.pay_expires_at ? new Date(attempt.pay_expires_at).toLocaleString("vi-VN") : "Giao dịch cũ, thiếu mốc thời gian"} · Đối soát gần nhất: {attempt.last_checked_at ? new Date(attempt.last_checked_at).toLocaleString("vi-VN") : "Chưa"}</p>{attempt.review_reason && <p className="mt-1 text-amber-800">Lý do cần xem: {reasonText[attempt.review_reason] ?? 'Cần quản trị viên kiểm tra'}</p>}{['pending', 'needs_review'].includes(attempt.state) && <button className="mt-2 min-h-10 rounded-lg border border-indigo-300 px-3 font-semibold text-indigo-700 disabled:opacity-50" disabled={busy} onClick={() => reconcile(attempt.id)} type="button">Đối soát QueryDr</button>}</div>)}</div></div>}
      {order.payment_events?.length > 0 && <div><h2 className="font-semibold">Nhật ký đối soát</h2><ul className="mt-2 space-y-1 text-xs text-slate-600">{order.payment_events.map((event) => <li key={event.id}>{new Date(event.created_at).toLocaleString("vi-VN")} · {event.source === 'admin' ? 'Quản trị viên' : event.source === 'ipn' ? 'IPN' : 'QueryDr'} · {outcomeText[event.outcome] ?? 'Cần kiểm tra'} · {reasonText[event.reason] ?? (event.source === 'admin' ? event.reason : 'Cần kiểm tra')}</li>)}</ul></div>}
      {order.notification_delivery?.length > 0 && <div><h2 className="font-semibold">Tình trạng email thông báo</h2><ul className="mt-2 space-y-2 text-xs text-slate-600">{order.notification_delivery.map((item) => <li className="rounded-lg bg-slate-50 p-3" key={item.id}><strong>{item.title}</strong><p className="mt-1">Khách: {item.email_status ?? "Chưa bật"} · lần gửi {item.email_attempt_count ?? 0}/3{item.email_sent_at ? ` · SMTP chấp nhận ${new Date(item.email_sent_at).toLocaleString("vi-VN")}` : ""}</p>{item.admin_email_status && <p>Admin: {item.admin_email_status} · lần gửi {item.admin_email_attempt_count ?? 0}/3</p>}</li>)}</ul><p className="mt-2 text-xs text-slate-500">“Đã gửi” nghĩa là SMTP đã nhận thư, không xác nhận thư vào hộp thư đến.</p></div>}
      {canClose && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"><h2 className="font-semibold text-amber-900">Đóng đơn chưa thanh toán</h2><p className="mt-1 text-amber-800">Chỉ thực hiện sau khi tất cả giao dịch đã được xác nhận thất bại. Hệ thống sẽ hoàn lại tồn kho.</p><label className="mt-3 block" htmlFor="close-reason">Lý do kiểm tra<input className="mt-1 block min-h-11 w-full rounded-lg border px-3" id="close-reason" maxLength={120} onChange={(event) => setReason(event.target.value)} value={reason} /></label><label className="mt-3 flex items-center gap-2"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />Tôi đã kiểm tra kết quả giao dịch</label><button className="mt-3 min-h-11 rounded-lg bg-rose-700 px-4 font-semibold text-white disabled:opacity-50" disabled={busy || !confirmed || reason.trim().length < 10} onClick={closeUnpaid} type="button">Đóng đơn và hoàn kho</button></div>}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/admin/orders">Quay lại</Link><button className="inline-flex min-h-11 items-center rounded-lg border border-emerald-300 px-4 text-sm font-semibold text-emerald-800 disabled:opacity-50" disabled={downloading} onClick={downloadPdf} type="button">{downloading ? "Đang tạo phiếu…" : "Tải phiếu đơn hàng PDF"}</button>{order.allowed_next_statuses?.length > 0 && <Link className="inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800" href={`/admin/orders/${id}/status`}>Cập nhật trạng thái</Link>}</div>
    </div>}
  </section>;
}
