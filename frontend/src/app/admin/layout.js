import Header from "@/components/admin/Header";
import SideBar from "@/components/admin/SideBar";

export default function AdminLayout({ children }) {
  return <div className="flex min-h-screen"><SideBar /><div className="flex-1"><Header /><main className="p-6">{children}</main></div></div>;
}
