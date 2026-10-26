"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PostForm from "@/components/admin/PostForm";
import AdminErrorDialog from "@/components/admin/AdminErrorDialog";
import postServices from "@/services/postServices";

export default function CreatePostPage() {
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const save = async (data) => {
    setSubmitting(true); setErrors({}); setPopup("");
    try {
      const response = await postServices.createPost(data);
      router.push(`/admin/posts/${response.data.data.id}`);
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setPopup(requestError.response?.data?.message ?? "Không thể tạo bài viết.");
    } finally { setSubmitting(false); }
  };

  return <section className="mx-auto max-w-6xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Nội dung</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Thêm bài viết</h1><p className="mt-2 text-sm text-slate-600">Soạn nội dung và chọn trạng thái hiển thị.</p></header><PostForm errors={errors} onSubmit={save} submitting={submitting} /><AdminErrorDialog errors={errors} message={popup} onClose={() => setPopup("")} /></section>;
}
