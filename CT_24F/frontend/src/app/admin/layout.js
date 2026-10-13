import Header from "@/components/admin/Header";
import SideBar from "@/components/admin/SideBar";

export default function AdminLayout({ children }) {
  return <div className="flex min-h-screen bg-[#f5f7f5]"><SideBar /><div className="min-w-0 flex-1"><Header /><main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main></div></div>;
}
