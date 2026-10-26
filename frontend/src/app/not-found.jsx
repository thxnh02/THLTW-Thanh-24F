import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">Lỗi 404</p>
      <h1 className="text-3xl font-semibold text-slate-950">Không tìm thấy trang</h1>
      <p className="text-slate-600">Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi.</p>
      <Link className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800" href="/">Về trang chủ</Link>
    </main>
  );
}
