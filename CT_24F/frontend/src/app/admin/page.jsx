import Link from "next/link";

const cards = [
  { href: "/admin/category", icon: "▦", title: "Danh mục", detail: "Sắp xếp sản phẩm theo nhu cầu.", action: "Quản lý danh mục", color: "bg-[#eaf1eb]" },
  { href: "/admin/brand", icon: "✳", title: "Thương hiệu", detail: "Cập nhật bộ sưu tập thương hiệu.", action: "Quản lý thương hiệu", color: "bg-[#f5eee7]" },
  { href: "/admin/product/create", icon: "+", title: "Sản phẩm", detail: "Đưa một lựa chọn mới lên cửa hàng.", action: "Thêm sản phẩm", color: "bg-[#eef0f5]" },
];

export default function AdminPage() {
  return <section className="space-y-8">
    <div className="relative overflow-hidden rounded-[1.75rem] bg-[#193b34] p-8 text-white sm:p-11"><div className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#b8e0c7]/10 blur-3xl" /><div className="relative"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#b8e0c7]">CT_24F · Admin studio</p><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Chào mừng trở lại.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Không gian quản trị gọn gàng cho danh mục, thương hiệu và sản phẩm của cửa hàng.</p><Link className="mt-7 inline-flex rounded-full bg-[#d1edda] px-5 py-3 text-sm font-semibold text-[#193b34] transition hover:bg-white" href="/admin/product/create">+ Tạo sản phẩm mới</Link></div></div>
    <div><p className="eyebrow">Bắt đầu từ đây</p><h2 className="section-title mb-5">Quản lý cửa hàng</h2><div className="grid gap-4 lg:grid-cols-3">{cards.map((card) => <Link className="group rounded-[1.4rem] border border-[#e7ece8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md" href={card.href} key={card.title}><span className={`grid h-12 w-12 place-items-center rounded-2xl ${card.color} text-xl font-semibold text-[#37665b]`}>{card.icon}</span><h3 className="mt-5 text-lg font-semibold text-[#19352f]">{card.title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{card.detail}</p><span className="mt-5 inline-block text-sm font-semibold text-[#37665b]">{card.action} <span className="inline-block transition group-hover:translate-x-1">→</span></span></Link>)}</div></div>
  </section>;
}
