"use client";

import { useEffect, useRef } from "react";

const fieldLabels = {
  name: "Tên", title: "Tiêu đề", slug: "Đường dẫn", content: "Nội dung",
  category_id: "Danh mục", brand_id: "Thương hiệu", parent_id: "Danh mục cha",
  price: "Giá gốc", sale_price: "Giá khuyến mãi", description: "Mô tả",
  image: "Ảnh", image_file: "Tệp ảnh", logo: "Logo", logo_file: "Tệp logo",
  sort_order: "Thứ tự", status: "Trạng thái",
};

export default function AdminErrorDialog({ message, errors = {}, onClose }) {
  const dialogRef = useRef(null);
  const details = Object.entries(errors).flatMap(([field, messages]) =>
    (Array.isArray(messages) ? messages : [messages]).filter(Boolean).map((text) => ({ field, text }))
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (message && dialog && !dialog.open) dialog.showModal();
    if (!message && dialog?.open) dialog.close();
  }, [message]);

  return (
    <dialog
      aria-labelledby="admin-error-title"
      aria-describedby="admin-error-description"
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-rose-100 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="p-6 sm:p-7">
        <div aria-hidden="true" className="mb-4 grid size-11 place-items-center rounded-xl bg-rose-50 text-xl font-bold text-rose-700">!</div>
        <h2 className="text-xl font-semibold" id="admin-error-title">Có lỗi xảy ra</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" id="admin-error-description">{message}</p>
        {details.length > 0 && <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-rose-50 p-4 text-sm text-rose-900">
          {details.map(({ field, text }, index) => <li key={`${field}-${index}`}><span className="font-semibold">{fieldLabels[field] ?? field}:</span> {text}</li>)}
        </ul>}
        <button autoFocus className="mt-6 min-h-11 w-full rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={onClose} type="button">Đã hiểu, quay lại chỉnh sửa</button>
      </div>
    </dialog>
  );
}
