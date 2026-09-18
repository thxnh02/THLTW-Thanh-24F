"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import type { Post, PostCategory } from "@/types/api";

type PostForm = {
  id?: number;
  post_category_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  status: "draft" | "published";
  published_at: string;
};

const emptyForm: PostForm = {
  post_category_id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  thumbnail: "/product-placeholder.svg",
  status: "draft",
  published_at: "",
};

export default function AdminPostsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    Promise.all([apiGetList<Post>("/admin/posts"), apiGetList<PostCategory>("/admin/post-categories")])
      .then(([postPayload, categoryPayload]) => {
        setPosts(postPayload);
        setCategories(categoryPayload);
      })
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      post_category_id: form.post_category_id ? Number(form.post_category_id) : undefined,
      title: form.title,
      slug: form.slug || undefined,
      excerpt: form.excerpt || undefined,
      content: form.content,
      thumbnail: form.thumbnail || undefined,
      status: form.status,
      published_at: form.published_at || undefined,
    };
    if (form.id) {
      await apiPatch(`/admin/posts/${form.id}`, payload);
      setMessage("Đã cập nhật bài viết.");
    } else {
      await apiPost("/admin/posts", payload);
      setMessage("Đã tạo bài viết.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(post: Post) {
    const accepted = await confirm({
      title: "Xóa bài viết?",
      message: `Bạn chắc chắn muốn xóa bài viết "${post.title}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    await apiDelete(`/admin/posts/${post.id}`);
      setMessage("Đã xóa bài viết.");
    load();
  }

  function edit(post: Post) {
    setForm({
      id: post.id,
      post_category_id: post.post_category_id ? String(post.post_category_id) : "",
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      thumbnail: post.thumbnail ?? "/product-placeholder.svg",
      status: post.status ?? "draft",
      published_at: post.published_at ? post.published_at.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quản lý bài viết</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
        <Input label="Tiêu đề" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
        <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Chu de
          <select value={form.post_category_id} onChange={(event) => setForm({ ...form, post_category_id: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="">Không có</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Thumbnail
          <input value={form.thumbnail} onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
          <div className="mt-2">
            <AdminImageUpload value={form.thumbnail} directory="posts" onChange={(value) => setForm({ ...form, thumbnail: value })} />
          </div>
        </label>
        <Input label="Published at" type="datetime-local" value={form.published_at} onChange={(value) => setForm({ ...form, published_at: value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PostForm["status"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-3">
          Tom tat
          <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-3">
          Nội dung
          <textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white lg:col-span-3">{form.id ? "Cập nhật" : "Tạo bài viết"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Bài viết</th>
              <th className="p-3">Chủ đề</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{post.title}</td>
                <td className="p-3">{post.category?.name ?? "-"}</td>
                <td className="p-3">{post.status === "published" ? "Đã xuất bản" : "Bản nháp"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => edit(post)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">
                    Sua
                  </button>
                  <button type="button" onClick={() => remove(post)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">
                    Xoa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
    </label>
  );
}
