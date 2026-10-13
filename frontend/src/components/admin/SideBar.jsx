import Link from "next/link";

const links = [{ href: "/admin", label: "Dashboard" }, { href: "/admin/category", label: "Danh mục" }, { href: "/admin/brand", label: "Thương hiệu" }];

export default function SideBar() {
  return <aside className="min-h-screen w-56 bg-slate-900 p-5 text-slate-100"><Link href="/" className="mb-8 block text-lg font-bold">CT_24F</Link><nav className="space-y-2">{links.map((link) => <Link className="block rounded px-3 py-2 hover:bg-slate-700" href={link.href} key={link.href}>{link.label}</Link>)}</nav></aside>;
}
