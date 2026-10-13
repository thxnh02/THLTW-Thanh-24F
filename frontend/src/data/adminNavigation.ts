import {
  BarChart3,
  Boxes,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Package,
  Percent,
  RotateCcw,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavigationItem = {
  label: string;
  href: string;
  permission: string;
  icon: LucideIcon;
};

export type AdminNavigationGroup = {
  label: string;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationGroup[] = [
  { label: "Tổng quan", items: [{ label: "Tổng quan", href: "/admin", permission: "dashboard", icon: LayoutDashboard }] },
  { label: "Thương mại", items: [{ label: "Sản phẩm", href: "/admin/products", permission: "catalog", icon: Package }, { label: "Danh mục", href: "/admin/categories", permission: "catalog", icon: Tags }, { label: "Thương hiệu", href: "/admin/brands", permission: "catalog", icon: Store }, { label: "Đơn hàng", href: "/admin/orders", permission: "orders", icon: ShoppingBag }, { label: "Đổi trả", href: "/admin/returns", permission: "returns", icon: RotateCcw }] },
  { label: "Vận hành", items: [{ label: "Kho", href: "/admin/stock", permission: "stock", icon: Boxes }, { label: "Vận chuyển", href: "/admin/shipping-methods", permission: "shipping", icon: Truck }, { label: "Nhập CSV", href: "/admin/import/products", permission: "catalog", icon: Upload }] },
  { label: "Khách hàng", items: [{ label: "Thành viên", href: "/admin/users", permission: "users", icon: Users }, { label: "Liên hệ", href: "/admin/contacts", permission: "contacts", icon: MessageSquare }] },
  { label: "Marketing", items: [{ label: "Khuyến mãi", href: "/admin/promotions", permission: "promotions", icon: Percent }] },
  { label: "Nội dung", items: [{ label: "Bài viết", href: "/admin/posts", permission: "content", icon: FileText }, { label: "Chủ đề", href: "/admin/post-categories", permission: "content", icon: Tags }, { label: "Trang", href: "/admin/pages", permission: "content", icon: FileText }, { label: "Menu", href: "/admin/menus", permission: "content", icon: LayoutDashboard }, { label: "Banner", href: "/admin/banners", permission: "content", icon: ImageIcon }, { label: "Thư viện ảnh", href: "/admin/media", permission: "content", icon: ImageIcon }] },
  { label: "Phân tích", items: [{ label: "Báo cáo", href: "/admin/reports", permission: "reports", icon: BarChart3 }] },
  { label: "Hệ thống", items: [{ label: "Cấu hình", href: "/admin/settings", permission: "settings", icon: Settings }] },
];
