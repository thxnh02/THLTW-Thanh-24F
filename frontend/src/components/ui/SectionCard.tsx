import type { ReactNode } from "react";

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}>{children}</section>;
}
