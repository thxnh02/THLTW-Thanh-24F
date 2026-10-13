import Link from "next/link";

export default function ShopLayout({ children }) {
  return <><header className="border-b bg-white"><nav className="mx-auto flex max-w-6xl gap-5 p-4"><Link className="font-bold" href="/">CT_24F Shop</Link><Link href="/categories">Danh mục</Link><Link href="/brands">Thương hiệu</Link><Link href="/products">Sản phẩm</Link><Link href="/admin">Admin</Link></nav></header><main className="mx-auto max-w-6xl p-6">{children}</main></>;
}
