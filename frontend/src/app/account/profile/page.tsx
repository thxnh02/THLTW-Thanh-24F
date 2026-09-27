"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { EmailVerificationPanel } from "@/components/EmailVerificationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { apiDelete, apiPatch, apiUploadForm } from "@/lib/api";
import type { User } from "@/types/api";
import { Badge, Button, Input, SectionCard, Skeleton } from "@/components/ui";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [form, setForm] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (ready && !user) router.push("/login");
  }, [ready, router, user]);

  if (!ready || !user) {
    return <main className="mx-auto max-w-7xl px-4 py-12"><Skeleton className="h-80 w-full" /></main>;
  }

  const profileForm = form ?? { name: user.name, phone: user.phone ?? "" };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiPatch<User>("/account/profile", profileForm);
      await refreshUser();
      toast.success("Đã cập nhật hồ sơ.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarLoading(true);
    try {
      const payload = new FormData();
      payload.append("avatar", file);
      await apiUploadForm<User>("/account/avatar", payload);
      await refreshUser();
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.");
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setAvatarLoading(true);
    try {
      await apiDelete("/account/avatar");
      await refreshUser();
      toast.success("Đã xóa ảnh đại diện.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể xóa ảnh đại diện.");
    } finally {
      setAvatarLoading(false);
    }
  }

  return (
    <main className="grid gap-6">
      <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar user={user} large />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-normal">{user.name}</h2>
              <Badge tone="brand">{roleLabel(user.role)}</Badge>
            </div>
            <p className="mt-2 truncate text-sm text-slate-300">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">Thành viên từ {formatDate(user.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={avatarLoading} onClick={() => fileRef.current?.click()}>
              {avatarLoading ? "Đang xử lý..." : "Đổi ảnh"}
            </Button>
            {user.avatar_url ? <Button type="button" variant="quiet" disabled={avatarLoading} onClick={() => void removeAvatar()}>Xóa ảnh</Button> : null}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); }} />
        </div>
        <div className="grid divide-y divide-slate-800 border-t border-slate-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <ProfileStat label="Trạng thái" value={user.status === "active" ? "Đang hoạt động" : "Đang khóa"} />
          <ProfileStat label="Đơn hàng" value={String(user.orders_count ?? 0)} />
          <ProfileStat label="Email" value={user.email_verified_at ? "Đã xác minh" : "Chờ xác minh"} />
        </div>
      </section>

      <EmailVerificationPanel />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <SectionCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Hồ sơ cá nhân</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Thông tin liên hệ</h2>
              <p className="mt-1 text-sm text-slate-600">Thông tin này được dùng cho liên hệ và giao hàng.</p>
            </div>
            <Badge tone="neutral">Cập nhật bất cứ lúc nào</Badge>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Email đăng nhập<Input value={user.email} disabled className="mt-1 bg-slate-50" /></label>
            <label className="text-sm font-semibold text-slate-700">Họ và tên<Input required value={profileForm.name} onChange={(event) => setForm({ ...profileForm, name: event.target.value })} className="mt-1" /></label>
            <label className="text-sm font-semibold text-slate-700">Số điện thoại<Input value={profileForm.phone} onChange={(event) => setForm({ ...profileForm, phone: event.target.value })} placeholder="Ví dụ: 0901 234 567" className="mt-1" /></label>
            <div className="flex items-end"><Button disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
          </form>
        </SectionCard>

        <SectionCard>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Truy cập nhanh</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Quản lý tài khoản</h2>
          <div className="mt-5 grid gap-2">
            <QuickLink href="/account/security" title="Bảo mật tài khoản" description="Mật khẩu và email đăng nhập" />
            <QuickLink href="/account/addresses" title="Địa chỉ giao hàng" description="Quản lý địa chỉ mặc định" />
            <QuickLink href="/account/orders" title="Lịch sử đơn hàng" description="Theo dõi các đơn đã mua" />
            <QuickLink href="/wishlist" title="Sản phẩm yêu thích" description="Danh sách bạn đang quan tâm" />
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

function Avatar({ user, large = false }: { user: User; large?: boolean }) {
  return user.avatar_url ? <Image src={user.avatar_url} alt={`Ảnh đại diện của ${user.name}`} width={large ? 96 : 36} height={large ? 96 : 36} unoptimized className={`${large ? "size-24" : "size-9"} rounded-full object-cover ring-4 ring-white/10`} /> : <span className={`inline-flex ${large ? "size-24 text-3xl" : "size-9 text-sm"} items-center justify-center rounded-full bg-teal-500 font-bold text-white ring-4 ring-white/10`} aria-label={`Ảnh đại diện của ${user.name}`}>{initials(user.name)}</span>;
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return <div className="px-6 py-4"><p className="text-xs font-medium text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>;
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link href={href} className="group rounded-md border border-slate-200 px-4 py-3 transition hover:border-teal-500 hover:bg-teal-50"><span className="block text-sm font-bold text-slate-900 group-hover:text-teal-900">{title}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></Link>;
}

function initials(name: string): string { return name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase(); }
function roleLabel(role: User["role"]): string { return { admin: "Quản trị viên", manager: "Quản lý", staff: "Nhân viên", member: "Thành viên" }[role]; }
function formatDate(value?: string): string { return value ? new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(value)) : "chưa rõ"; }
