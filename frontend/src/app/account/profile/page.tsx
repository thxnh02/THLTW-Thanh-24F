"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { apiDelete, apiPatch, apiPost, apiUploadForm } from "@/lib/api";
import type { User } from "@/types/api";
import { Button, Input, SectionCard, Skeleton } from "@/components/ui";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [form, setForm] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (ready && !user) router.push("/login");
  }, [ready, router, user]);

  const profileForm = form ?? { name: user?.name ?? "", phone: user?.phone ?? "" };

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

  async function resendVerification() {
    setResending(true);
    try {
      await apiPost("/auth/email/verification-notification", {});
      toast.success("Đã gửi email xác minh. Hãy kiểm tra hộp thư của bạn.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể gửi email xác minh.");
    } finally {
      setResending(false);
    }
  }

  if (!ready || !user) return <main className="mx-auto max-w-7xl px-4 py-12"><Skeleton className="h-64 w-full" /></main>;

  return <main className="grid gap-6">
    <SectionCard><div className="flex flex-wrap items-center gap-4"><Avatar user={user} large /><div className="min-w-0 flex-1"><h2 className="text-xl font-bold text-slate-950">Ảnh đại diện</h2><p className="mt-1 text-sm text-slate-600">JPG, PNG hoặc WebP, tối đa 2 MB.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={avatarLoading} onClick={() => fileRef.current?.click()}>{avatarLoading ? "Đang xử lý..." : "Tải ảnh lên"}</Button>{user.avatar_url ? <Button type="button" variant="danger" disabled={avatarLoading} onClick={() => void removeAvatar()}>Xóa ảnh</Button> : null}</div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); }} /></div></SectionCard>
    <SectionCard><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Thông tin cá nhân</h2><p className="mt-1 text-sm text-slate-600">Cập nhật thông tin dùng cho liên hệ và giao hàng.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{roleLabel(user.role)}</span></div><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Email<Input value={user.email} disabled className="mt-1 bg-slate-50" /></label><label className="text-sm font-semibold text-slate-700">Họ và tên<Input required value={profileForm.name} onChange={(event) => setForm({ ...profileForm, name: event.target.value })} className="mt-1" /></label><label className="text-sm font-semibold text-slate-700">Điện thoại<Input value={profileForm.phone} onChange={(event) => setForm({ ...profileForm, phone: event.target.value })} className="mt-1" /></label><div className="flex items-end"><Button disabled={saving}>{saving ? "Đang lưu..." : "Lưu hồ sơ"}</Button></div></form></SectionCard>
    <SectionCard><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Xác minh email</h2><p className="mt-1 text-sm text-slate-600">Email hiện tại: {user.email}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.email_verified_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{user.email_verified_at ? "Đã xác minh" : "Chưa xác minh"}</span></div>{!user.email_verified_at ? <Button type="button" variant="secondary" className="mt-4" disabled={resending} onClick={() => void resendVerification()}>{resending ? "Đang gửi..." : "Gửi lại email xác minh"}</Button> : null}</SectionCard>
  </main>;
}

function Avatar({ user, large = false }: { user: User; large?: boolean }) {
  return user.avatar_url ? <img src={user.avatar_url} alt={`Ảnh đại diện của ${user.name}`} className={`${large ? "size-24" : "size-9"} rounded-full object-cover`} /> : <span className={`inline-flex ${large ? "size-24 text-3xl" : "size-9 text-sm"} items-center justify-center rounded-full bg-teal-100 font-bold text-teal-900`} aria-label={`Ảnh đại diện của ${user.name}`}>{initials(user.name)}</span>;
}

function initials(name: string): string { return name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase(); }
function roleLabel(role: User["role"]): string { return { admin: "Quản trị viên", manager: "Quản lý", staff: "Nhân viên", member: "Thành viên" }[role]; }
