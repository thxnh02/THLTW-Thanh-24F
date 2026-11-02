export function safeCustomerReturnTo(value, fallback = "/account") {
  const target = String(value ?? "");
  if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;

  const normalized = target.toLowerCase();
  if (normalized === "/admin" || normalized.startsWith("/admin/") || normalized.startsWith("/login")) return fallback;
  return target;
}

export function authErrorMessage(error, fallback = "Không thể hoàn tất yêu cầu. Vui lòng thử lại.") {
  const response = error?.response?.data;
  if (typeof response?.message === "string") return response.message;
  if (error?.response?.status === 419) return "Phiên bảo mật đã hết hạn. Vui lòng thử lại.";
  if (error?.response?.status === 429) return "Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.";
  return fallback;
}

export function authFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  return errors && typeof errors === "object" ? errors : {};
}

export function maskEmail(email) {
  const [name, domain] = String(email ?? "").split("@");
  if (!name || !domain) return "";
  return `${name.slice(0, 1)}${"•".repeat(Math.min(Math.max(name.length - 1, 2), 6))}@${domain}`;
}
