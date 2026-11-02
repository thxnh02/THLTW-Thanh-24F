import Link from "next/link";
import { useState } from "react";

export { authErrorMessage, authFieldErrors } from "@/lib/customerAuth";

export const authInputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-[#d8e2da] bg-white px-3.5 text-[16px] text-[#19352f] outline-none transition placeholder:text-slate-400 focus:border-[#6d9588] focus:ring-2 focus:ring-[#37665b]/15";
export const authLabelClass = "block text-sm font-medium text-[#29483f]";
export const authButtonClass = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#193f36] px-5 text-sm font-semibold text-white transition hover:bg-[#28564d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] disabled:cursor-wait disabled:opacity-60";

export function AuthFormShell({ eyebrow = "TÀI KHOẢN CT_24F", title, description, children, footer }) {
  return <section className="mx-auto w-full max-w-[480px] py-5 sm:py-10">
    <div className="rounded-2xl border border-[#e1e9e2] bg-white p-5 shadow-sm sm:p-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#19352f]">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-[#e8ede9] pt-5 text-sm text-slate-600">{footer}</div>}
    </div>
    <Link className="mx-auto mt-5 flex min-h-11 w-fit items-center rounded-lg px-3 text-sm font-medium text-[#37665b] hover:underline focus-visible:outline-2 focus-visible:outline-[#37665b]" href="/">Quay lại cửa hàng</Link>
  </section>;
}
export function AuthField({ label, id, error, children }) {
  return <div>
    <label className={authLabelClass} htmlFor={id}>{label}</label>
    {children}
    {error && <p className="mt-1.5 text-xs text-rose-700" id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}

export function AuthNotice({ children, tone = "error" }) {
  if (!children) return null;
  const styles = tone === "success" ? "border-[#cfdfd2] bg-[#eff5ef] text-[#29483f]" : "border-rose-100 bg-rose-50 text-rose-800";
  return <p className={`rounded-xl border p-3.5 text-sm leading-5 ${styles}`} role={tone === "success" ? "status" : "alert"}>{children}</p>;
}

export function PasswordInput({ id, value, onChange, autoComplete, error, required = true }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} autoComplete={autoComplete} className={`${authInputClass} pr-16`} id={id} maxLength={128} name={id} onChange={onChange} required={required} type={visible ? "text" : "password"} value={value} />
    <button aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute inset-y-0 right-1 my-1 min-w-14 rounded-lg px-2 text-xs font-medium text-[#37665b] hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-[#37665b]" onClick={() => setVisible((current) => !current)} type="button">{visible ? "Ẩn" : "Hiện"}</button>
  </div>;
}
