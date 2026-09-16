"use client";

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

  async function upload(file?: File) {
    if (!file) {
      return;
    }

    setMessage("Dang tai anh...");

    try {
      const uploaded = await apiUploadImage(file, directory);
      onChange(uploaded.url);
      setMessage("Da tai anh len.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the tai anh.");
    }
  }

  return (
    <div className="grid gap-2">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(event) => upload(event.target.files?.[0])}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      {value ? <p className="break-all text-xs text-slate-500">{value}</p> : null}
      {message ? <p className="text-xs text-teal-700">{message}</p> : null}
    </div>
  );
}
