"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import postServices from "@/services/postServices";

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    let current = true;
    postServices.getPost(id).then(({ data }) => { if (current) setPost(data.data); }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy bài viết." : requestError.response?.data?.message ?? "Không thể tải bài viết.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Nội dung</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Chi tiết bài viết</h1></header>{loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải bài viết…</p>}{error && <p className="rounded-xl bg-rose-50 p-5 text-rose-800" role="alert">{error}</p>}{post && <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div><h2 className="text-2xl font-semibold text-slate-950">{post.title}</h2><p className="mt-1 text-sm text-slate-500">{post.slug} · Cập nhật {new Date(post.updated_at).toLocaleString("vi-VN")}</p><div className="mt-3"><StatusBadge status={post.status} /></div></div><p className="whitespace-pre-wrap border-t border-slate-100 pt-5 text-sm leading-7 text-slate-700">{post.content}</p><div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/admin/posts">Quay lại</Link><Link className="inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white" href={`/admin/posts/${id}/edit`}>Sửa</Link><button className="inline-flex min-h-11 items-center rounded-lg bg-rose-50 px-4 text-sm font-semibold text-rose-800" onClick={() => setConfirming(post)} type="button">Xóa</button></div></article>}<ConfirmDialog actionLabel="Chuyển vào thùng rác" description="Bạn có chắc muốn xóa bài viết" onComplete={() => router.push("/admin/posts")} onConfirm={(row) => postServices.deletePost(row.id)} onDismiss={() => setConfirming(null)} record={confirming} recordLabel={(row) => row.title} title="Xóa bài viết này?" /></section>;
}
