import type { Order } from "@/types/api";

export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger";

const orderStatusLabels: Record<Order["status"], string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  canceled: "Đã hủy",
};

const paymentStatusLabels: Record<string, string> = {
  paid: "Đã thanh toán",
  unpaid: "Chưa thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

const paymentMethodLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  vnpay: "VNPay",
};

export function orderStatusLabel(status: string): string {
  return orderStatusLabels[status as Order["status"]] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return paymentStatusLabels[status] ?? status;
}

export function paymentMethodLabel(method: string): string {
  return paymentMethodLabels[method] ?? method;
}

export function orderStatusTone(status: string): StatusTone {
  if (status === "completed") return "success";
  if (status === "canceled") return "danger";
  if (status === "shipping") return "warning";
  return "brand";
}

export function paymentStatusTone(status: string): StatusTone {
  if (status === "paid") return "success";
  if (status === "failed") return "danger";
  if (status === "refunded") return "warning";
  return "neutral";
}
