"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import postServices from "@/services/postServices";

export default function DeletePostPage() {
  const { id } = useParams();
  const load = useCallback(() => postServices.getPost(id), [id]);

  return <ConfirmActionPage actionLabel="Chuyển vào thùng rác" backHref={`/admin/posts/${id}`} load={load} recordLabel={(post) => `${post.title} · ${post.slug}`} submit={() => postServices.deletePost(id)} successHref="/admin/posts" title="Xóa bài viết này?" warning="Bài viết sẽ được chuyển vào thùng rác và có thể khôi phục sau." />;
}
