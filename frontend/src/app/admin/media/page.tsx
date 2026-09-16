"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGet } from "@/lib/api";

type MediaFile = {
  path: string;
  url: string;
  size: number;
  last_modified: number;
};

export default function AdminMediaPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [directory, setDirectory] = useState("products");
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<MediaFile[]>(`/admin/uploads/images${directory ? `?directory=${encodeURIComponent(directory)}` : ""}`)
      .then(setFiles)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [directory, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(file: MediaFile) {
    const accepted = await confirm({
      title: "Xoa anh?",
      message: `Ban chac chan muon xoa file "${file.path}"? Nhung noi dang dung URL nay se bi mat anh.`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    await apiDelete(`/admin/uploads/images?path=${encodeURIComponent(file.path)}`);
    setMessage("Da xoa anh.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Thu vien anh</h1>
        <select value={directory} onChange={(event) => setDirectory(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Tat ca</option>
          <option value="products">Products</option>
          <option value="banners">Banners</option>
          <option value="posts">Posts</option>
          <option value="settings">Settings</option>
        </select>
      </div>
      <div className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <AdminImageUpload value="" directory={directory || "products"} onChange={() => load()} />
      </div>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {files.map((file) => (
          <article key={file.path} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <Image src={file.url} alt={file.path} width={480} height={320} className="aspect-[4/3] w-full bg-slate-100 object-cover" />
            <div className="grid gap-2 p-3">
              <p className="break-all text-xs text-slate-600">{file.path}</p>
              <p className="text-xs text-slate-500">{Math.round(file.size / 1024)} KB</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigator.clipboard.writeText(file.url)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">
                  Copy URL
                </button>
                <button type="button" onClick={() => remove(file)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">
                  Xoa
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
