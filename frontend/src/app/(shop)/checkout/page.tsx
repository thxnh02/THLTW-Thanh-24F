"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, CircleDollarSign, CreditCard, MapPin, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge, Button, Input, Select, Textarea } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useStoreSettings } from "@/context/StoreSettingsContext";
import { accountService } from "@/services/accountService";
import { checkoutService } from "@/services/checkoutService";
import { formatVnd } from "@/utils/format";
import type { Address, ShippingMethod } from "@/types/api";

type PaymentMethod = "cod" | "vnpay";
type CheckoutResponse = { code: string; grand_total: string | number; payment_method?: PaymentMethod; payment_status?: string; payment_url?: string };

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const settings = useStoreSettings();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", address: "", note: "", promotionCode: "", paymentMethod: "cod" as PaymentMethod, shippingMethodId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const selectedShipping = shippingMethods.find((method) => String(method.id) === form.shippingMethodId);

  useEffect(() => {
    if (!user) return;
    accountService.getAddresses().then((data) => {
      setAddresses(data);
      const preferred = data.find((item) => item.is_default) || data[0];
      if (preferred) applyAddress(preferred);
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    checkoutService.getShippingMethods(subtotal).then((methods) => {
      setShippingMethods(methods);
      setForm((current) => current.shippingMethodId || !methods.length ? current : { ...current, shippingMethodId: String(methods[0].id) });
    }).catch(() => setError("Không thể tải phương thức vận chuyển."));
  }, [subtotal]);

  function applyAddress(address: Address) {
    setForm((current) => ({ ...current, name: address.recipient_name, phone: address.phone, address: [address.address_line, address.ward, address.district, address.province].filter(Boolean).join(", ") }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const order = await checkoutService.checkout<CheckoutResponse>({
        customer: { name: form.name || user?.name, email: form.email || user?.email, phone: form.phone || user?.phone, address: form.address },
        note: form.note || undefined,
        payment_method: form.paymentMethod,
        shipping_method_id: form.shippingMethodId ? Number(form.shippingMethodId) : undefined,
        promotion_code: form.promotionCode || undefined,
        idempotency_key: window.crypto.randomUUID(),
        items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
      });
      clearCart();
      if (order.payment_url) {
        window.location.href = order.payment_url;
        return;
      }
      setSuccess(order);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <OrderSuccess order={success} />;
  if (!items.length) return <main className="page-shell py-12"><section className="mx-auto max-w-xl rounded-lg border border-[var(--border)] bg-white p-10 text-center shadow-[var(--shadow-card)]"><CircleDollarSign className="mx-auto text-teal-700" size={32} aria-hidden="true" /><h1 className="mt-4 text-2xl font-bold">Chưa có sản phẩm để thanh toán</h1><p className="mt-2 text-slate-600">Hãy thêm sản phẩm vào giỏ trước khi tiếp tục.</p><Link href="/products" className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-teal-700">Quay lại mua sắm</Link></section></main>;

  return <main className="page-shell py-8 sm:py-10"><header className="mb-8 border-b border-[var(--border)] pb-6"><p className="text-sm font-bold uppercase tracking-[0.1em] text-teal-700">Hoàn tất đơn hàng</p><h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">Thanh toán an toàn</h1><div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><Step label="Thông tin" active /><ChevronRight size={15} className="text-slate-400" aria-hidden="true" /><Step label="Vận chuyển" /><ChevronRight size={15} className="text-slate-400" aria-hidden="true" /><Step label="Thanh toán" /></div></header><form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-6"><section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"><SectionHeading icon={<MapPin size={19} />} eyebrow="Thông tin giao hàng" title="Nhận hàng ở đâu?" />{addresses.length ? <label className="mt-5 block text-sm font-semibold text-slate-700">Chọn địa chỉ đã lưu<Select className="mt-1.5" defaultValue="" onChange={(event) => { const selected = addresses.find((item) => String(item.id) === event.target.value); if (selected) applyAddress(selected); }}><option value="">Nhập địa chỉ mới</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.recipient_name} · {address.address_line}</option>)}</Select></label> : null}<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Họ và tên" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /><Field label="Số điện thoại" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required /><Field label="Địa chỉ giao hàng" value={form.address} onChange={(value) => setForm({ ...form, address: value })} required /></div><label className="mt-4 block text-sm font-semibold text-slate-700">Ghi chú<Textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="mt-1.5" placeholder="Ghi chú cho người giao hàng (không bắt buộc)" /></label></section><section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"><SectionHeading icon={<Truck size={19} />} eyebrow="Vận chuyển và thanh toán" title="Chọn cách nhận và trả tiền" /><label className="mt-5 block text-sm font-semibold text-slate-700">Phương thức vận chuyển<Select value={form.shippingMethodId} onChange={(event) => setForm({ ...form, shippingMethodId: event.target.value })} className="mt-1.5" required><option value="">Chọn phương thức</option>{shippingMethods.map((method) => <option key={method.id} value={method.id}>{method.name} · {formatVnd(method.fee)}</option>)}</Select>{selectedShipping ? <span className="mt-1.5 block text-xs font-normal text-slate-500">Dự kiến {selectedShipping.estimated_days_min ?? "?"}-{selectedShipping.estimated_days_max ?? "?"} ngày.</span> : null}</label><fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">Phương thức thanh toán</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><PaymentOption active={form.paymentMethod === "cod"} icon={<CircleDollarSign size={19} />} title="Thanh toán khi nhận hàng" description="Thanh toán khi nhận sản phẩm." onClick={() => setForm({ ...form, paymentMethod: "cod" })} /><PaymentOption active={form.paymentMethod === "vnpay"} icon={<CreditCard size={19} />} title="Thanh toán qua VNPay" description="Chuyển sang cổng VNPay để hoàn tất." disabled={!settings.vnpay_enabled} onClick={() => setForm({ ...form, paymentMethod: "vnpay" })} /></div></fieldset><div className="mt-5"><Field label="Mã giảm giá" value={form.promotionCode} onChange={(value) => setForm({ ...form, promotionCode: value.toUpperCase() })} placeholder="Nhập mã nếu có" /></div></section></div><OrderSummary items={items} subtotal={subtotal} shippingFee={Number(selectedShipping?.fee ?? 0)} error={error} submitting={submitting} hasShipping={shippingMethods.length > 0} paymentMethod={form.paymentMethod} /></form></main>;
}

function OrderSuccess({ order }: { order: CheckoutResponse }) {
  return <main className="page-shell max-w-2xl py-14"><section className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-[var(--shadow-lift)]"><div className="bg-emerald-50 px-6 py-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"><Check size={28} aria-hidden="true" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[0.1em] text-emerald-700">Đã tiếp nhận đơn</p><h1 className="mt-2 text-3xl font-black text-emerald-950">Đặt hàng thành công</h1><p className="mt-3 text-emerald-900">Mã đơn hàng <strong>{order.code}</strong> đã được tạo.</p></div><div className="space-y-4 p-6 text-center"><Badge tone="success">{order.payment_method === "vnpay" ? "Đang chờ xác nhận VNPay" : "Thanh toán khi nhận hàng (COD)"}</Badge><p className="text-sm text-slate-600">Tổng tiền: <strong className="text-slate-950">{formatVnd(order.grand_total)}</strong></p><div className="flex flex-wrap justify-center gap-3 pt-2"><Link href={`/account/orders/${order.code}`}><Button>Xem chi tiết đơn hàng</Button></Link><Link href="/products"><Button variant="secondary">Tiếp tục mua sắm</Button></Link></div></div></section></main>;
}

function SectionHeading({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) { return <div className="flex items-start gap-3"><span className="mt-1 text-teal-700" aria-hidden="true">{icon}</span><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-teal-700">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2></div></div>; }
function Step({ label, active = false }: { label: string; active?: boolean }) { return <span className={`font-semibold ${active ? "text-teal-700" : "text-slate-500"}`}>{label}</span>; }
function PaymentOption({ active, title, description, icon, disabled = false, onClick }: { active: boolean; title: string; description: string; icon: React.ReactNode; disabled?: boolean; onClick: () => void }) { return <button type="button" disabled={disabled} onClick={onClick} className={`relative w-full rounded-lg border p-4 text-left transition ${active ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/15" : "border-[var(--border)] hover:border-teal-300 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-50`}><span className="mb-3 block text-teal-700" aria-hidden="true">{icon}</span><span className="block pr-6 text-sm font-bold text-slate-950">{title}</span><span className="mt-1 block pr-5 text-xs leading-5 text-slate-500">{description}</span><span className={`absolute right-4 top-4 size-4 rounded-full border-4 ${active ? "border-teal-600 bg-white" : "border-slate-300"}`} aria-hidden="true" /></button>; }
function Field({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) { return <label className="block text-sm font-semibold text-slate-700">{label}<Input type={type} required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5" /></label>; }
function OrderSummary({ items, subtotal, shippingFee, error, submitting, hasShipping, paymentMethod }: { items: ReturnType<typeof useCart>["items"]; subtotal: number; shippingFee: number; error: string; submitting: boolean; hasShipping: boolean; paymentMethod: PaymentMethod }) { return <aside className="h-fit rounded-lg border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-28"><p className="text-xs font-bold uppercase tracking-[0.1em] text-teal-700">Tóm tắt đơn hàng</p><h2 className="mt-1 text-xl font-bold text-slate-950">{items.length} sản phẩm</h2><div className="mt-5 space-y-3">{items.map((item) => <div key={item.variantId} className="flex gap-3 text-sm"><div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-slate-100">{item.image ? <Image src={item.image} alt="" fill unoptimized sizes="48px" className="object-cover" /> : null}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{item.productName}</p><p className="text-slate-500">{item.variantName} × {item.quantity}</p></div><p className="font-semibold">{formatVnd(item.price * item.quantity)}</p></div>)}</div><dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4 text-sm"><div className="flex justify-between gap-4"><dt>Tạm tính</dt><dd>{formatVnd(subtotal)}</dd></div><div className="flex justify-between gap-4"><dt>Phí vận chuyển</dt><dd>{formatVnd(shippingFee)}</dd></div><div className="flex justify-between gap-4 border-t border-[var(--border)] pt-3 text-base font-bold text-slate-950"><dt>Dự kiến thanh toán</dt><dd>{formatVnd(subtotal + shippingFee)}</dd></div></dl>{error ? <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={submitting || !hasShipping} className="mt-6 w-full">{submitting ? "Đang xử lý..." : paymentMethod === "cod" ? "Đặt hàng COD" : "Tiếp tục đến VNPay"}</Button><p className="mt-3 text-center text-xs leading-5 text-slate-500">Tổng tiền cuối cùng được xác nhận bởi hệ thống khi đặt hàng.</p></aside>; }
