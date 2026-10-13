import type { ReactNode } from "react";

type AdminTableProps = {
  children: ReactNode;
  minWidth?: string;
};

/**
 * Shared semantic table shell. List pages keep ownership of their data,
 * pagination and row-specific controls.
 */
export function AdminTable({ children, minWidth = "680px" }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
