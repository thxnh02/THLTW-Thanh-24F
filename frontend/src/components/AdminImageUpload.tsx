"use client";

import Image from "next/image";
import { useState } from "react";

import { apiUploadImage } from "@/lib/api";

export function AdminImageUpload({
  value,
  directory,
  onChange,
}: {
  value: string;
  directory: string;
  onChange: (url: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage("Đang tải ảnh lên...");

    try {
      const uploaded = await apiUploadImage(file, directory);
      onChange(uploaded.url);
      setMessage("Đã tải ảnh lên.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(event) => void upload(event.target.files?.[0])}
        disabled={uploading}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      {value ? <div className="flex items-center gap-3"><Image src={value} alt="Ảnh đã chọn" width={72} height={54} className="size-16 rounded-md border border-slate-200 object-cover" /><p className="break-all text-xs text-slate-500">{value}</p></div> : null}
      {message ? <p className="text-xs text-teal-700">{message}</p> : null}
    </div>
  );
}
