"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PostForm from "@/components/admin/PostForm";
import postServices from "@/services/postServices";

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let current = true;
    postServices.getPost(id).then(({ data }) => { if (current) setPost(data.data); }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy bài viết." : requestError.response?.data?.message ?? "Không thể tải bài viết.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  const save = async (data) => {
    setSubmitting(true); setErrors({}); setError("");
    try {
      await postServices.updatePost(id, data);
      router.push(`/admin/posts/${id}`);
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setError(requestError.response?.data?.message ?? "Không thể lưu bài viết.");
    } finally { setSubmitting(false); }
  };

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Nội dung</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Sửa bài viết</h1></header>{loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải bài viết…</p>}{error && <p className="rounded-xl bg-rose-50 p-4 text-rose-800" role="alert">{error}</p>}{post && <PostForm errors={errors} initialData={post} onSubmit={save} submitting={submitting} />}</section>;
}
