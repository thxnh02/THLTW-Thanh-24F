"use client";

import { useEffect, useRef, useState } from "react";
import { catalogImageUrl } from "@/lib/catalogImage";

// Trường ảnh dùng chung cho form sản phẩm/danh mục/thương hiệu: chọn tệp, xem trước, dùng URL hoặc xóa.
export default function AdminImageField({ label, name, fileName, value, file, errors = {}, onUrlChange, onFileChange }) {
  const fileInput = useRef(null);
  const objectUrl = useRef("");
  const [localPreview, setLocalPreview] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    return () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); };
  }, []);

  const selectFile = (nextFile) => {
    if (nextFile && nextFile.size > 2 * 1024 * 1024) {
      if (fileInput.current) fileInput.current.value = "";
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = "";
      setLocalPreview("");
      onFileChange(null);
      setLocalError("Ảnh không được vượt quá 2 MB.");
      return;
    }
    setLocalError("");
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = nextFile ? URL.createObjectURL(nextFile) : "";
    setLocalPreview(objectUrl.current);
    setPreviewFailed(false);
    onFileChange(nextFile);
  };

  const preview = file ? localPreview : catalogImageUrl(value?.trim() ?? "");
  const fileError = errors[fileName]?.[0];
  const urlError = errors[name]?.[0];

  return <div className="space-y-3">
    <label className="admin-label" htmlFor={fileName}>{label} — tải từ máy
      <input accept="image/jpeg,image/png,image/webp,image/gif" aria-invalid={Boolean(fileError)} className="admin-input cursor-pointer" id={fileName} name={fileName} ref={fileInput} type="file" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
    </label>
    <p className="text-xs text-slate-500">JPEG, PNG, WebP hoặc GIF; tối đa 2 MB. Ảnh được lưu trong cơ sở dữ liệu.</p>
    {(localError || fileError) && <small className="block text-rose-700" role="alert">{localError || fileError}</small>}
    <label className="admin-label" htmlFor={name}>Hoặc dùng đường dẫn ảnh
      <input aria-invalid={Boolean(urlError)} className="admin-input" id={name} maxLength={255} name={name} type="text" value={value ?? ""} onChange={(event) => { if (fileInput.current) fileInput.current.value = ""; selectFile(null); onUrlChange(event.target.value); }} />
    </label>
    {urlError && <small className="block text-rose-700" role="alert">{urlError}</small>}
    <div aria-live="polite" className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {preview && !previewFailed ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`Xem trước ${label.toLowerCase()}`} className="h-20 w-20 rounded-lg object-cover" src={preview} onError={() => setPreviewFailed(true)} />
      </> : <div className="grid h-20 w-20 place-items-center rounded-lg bg-slate-200 text-xs font-semibold text-slate-500">Chưa có ảnh</div>}
      <div className="space-y-2"><p className="text-sm font-semibold text-slate-800">Xem trước hình ảnh</p>{(file || value) && <button className="text-xs font-semibold text-rose-700 hover:underline" type="button" onClick={() => { if (fileInput.current) fileInput.current.value = ""; selectFile(null); onUrlChange(""); }}>Xóa ảnh</button>}</div>
    </div>
  </div>;
}
