"use client";

import { useEffect, useRef, useState } from "react";
import { catalogImageUrl } from "@/lib/catalogImage";

// Trường ảnh dùng chung cho form sản phẩm/danh mục/thương hiệu: chọn tệp, xem trước, dùng URL hoặc xóa.
export default function AdminImageField({ label, name, fileName, value, file, errors = {}, onUrlChange, onFileChange, onError }) {
  const fileInput = useRef(null);
  const objectUrl = useRef("");
  const [localPreview, setLocalPreview] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [localError, setLocalError] = useState("");
  const [mode, setMode] = useState(() => value?.trim() ? "url" : "file");

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
      onError?.("Ảnh không được vượt quá 2 MB.");
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
    <p className="admin-label">{label}</p>
    <div aria-label="Nguồn hình ảnh" className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group">
      <button aria-pressed={mode === "file"} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "file" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => setMode("file")} type="button">Tải từ máy</button>
      <button aria-pressed={mode === "url"} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "url" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => { if (fileInput.current) fileInput.current.value = ""; selectFile(null); setMode("url"); }} type="button">Dùng đường dẫn</button>
    </div>
    {/* Hai nhánh có key riêng để React không tái sử dụng input file (uncontrolled) thành input URL (controlled). */}
    {mode === "file" ? <label className="admin-label" htmlFor={fileName} key="file">Chọn tệp ảnh
      <input accept="image/jpeg,image/png,image/webp,image/gif" aria-invalid={Boolean(fileError)} className="admin-input cursor-pointer" id={fileName} name={fileName} ref={fileInput} type="file" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
    </label> : <label className="admin-label" htmlFor={name} key="url">Đường dẫn ảnh
      <input aria-invalid={Boolean(urlError)} className="admin-input" id={name} maxLength={255} name={name} type="text" value={value ?? ""} onChange={(event) => { selectFile(null); onUrlChange(event.target.value); }} />
    </label>}
    <p className="text-xs text-slate-500">JPEG, PNG, WebP hoặc GIF; tối đa 2 MB. Tệp tải lên được lưu trong cơ sở dữ liệu.</p>
    {(localError || fileError || urlError) && <small className="block text-rose-700" role="alert">{localError || fileError || urlError}</small>}
    <div aria-live="polite" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
      {preview && !previewFailed ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`Xem trước ${label.toLowerCase()}`} className="h-14 w-14 rounded-lg object-cover" src={preview} onError={() => setPreviewFailed(true)} />
      </> : <div className="grid h-14 w-14 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500">Chưa có ảnh</div>}
      <div className="space-y-1"><p className="text-xs font-semibold text-slate-800">Xem trước hình ảnh</p>{(file || value) && <button className="text-xs font-semibold text-rose-700 hover:underline" type="button" onClick={() => { if (fileInput.current) fileInput.current.value = ""; selectFile(null); onUrlChange(""); }}>Xóa ảnh</button>}</div>
    </div>
  </div>;
}
