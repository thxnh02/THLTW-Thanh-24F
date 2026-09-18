"use client";

import { type SyntheticEvent, useState } from "react";

import { API_BASE_URL, apiUploadForm } from "@/lib/api";

type ImportResult = {
  total: number;
  valid: number;
  invalid: number;
  imported: number;
  rows: { line: number; sku: string; errors: string[] }[];
};

export default function AdminProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("create");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  async function submit(event: SyntheticEvent, action: "preview" | "import") {
    event.preventDefault();
    if (!file) {
      setMessage("Hãy chọn file CSV.");
      return;
    }

    setProcessing(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const payload = await apiUploadForm<ImportResult>(`/admin/products/import${action === "preview" ? "/preview" : ""}`, formData);
      setResult(payload);
      setMessage(action === "preview" ? "Đã kiểm tra file CSV." : "Đã nhập file CSV.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Xử lý file thất bại.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Nhập sản phẩm từ CSV</h1>
        <a href={`${API_BASE_URL}/admin/products/import/template`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Tai template</a>
      </div>
      <form className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Che do
          <select value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="create">Create only</option>
            <option value="update">Update existing</option>
            <option value="upsert">Upsert</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          File CSV
          <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <div className="flex gap-2">
          <button disabled={processing} onClick={(event) => submit(event, "preview")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold disabled:bg-slate-100">Preview</button>
          <button disabled={processing} onClick={(event) => submit(event, "import")} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">Import</button>
        </div>
      </form>
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-slate-700">{message}</p> : null}
      {result ? (
        <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <strong>Total: {result.total}</strong>
            <strong>Valid: {result.valid}</strong>
            <strong>Invalid: {result.invalid}</strong>
            <strong>Imported: {result.imported}</strong>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Dòng</th><th className="p-3">SKU</th><th className="p-3">Lỗi</th></tr></thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={`${row.line}-${row.sku}`} className="border-t border-slate-200">
                    <td className="p-3">{row.line}</td>
                    <td className="p-3">{row.sku}</td>
                    <td className="p-3 text-red-600">{row.errors.join(", ") || "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
