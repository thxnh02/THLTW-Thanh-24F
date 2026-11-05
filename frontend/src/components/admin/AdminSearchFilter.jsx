"use client";

import { useState } from "react";

export default function AdminSearchFilter({ onSearch, status, onStatusChange }) {
  const [draft, setDraft] = useState("");
  return <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); onSearch(draft.trim()); }}>
    <label className="text-sm font-medium">Từ khóa<input className="admin-input mt-1 block" maxLength={100} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tên hoặc đường dẫn" /></label>
    <label className="text-sm font-medium">Hiển thị<select className="admin-input mt-1 block" value={status} onChange={(event) => onStatusChange(event.target.value)}><option value="">Tất cả</option><option value="1">Đang hiển thị</option><option value="0">Đã ẩn</option></select></label>
    <button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white" type="submit">Tìm kiếm</button>
  </form>;
}
