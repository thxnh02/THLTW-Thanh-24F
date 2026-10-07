import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/layout/AdminShell";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
