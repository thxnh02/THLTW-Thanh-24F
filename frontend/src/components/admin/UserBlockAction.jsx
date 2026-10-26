"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import userServices from "@/services/userServices";

export default function UserBlockAction({ mode }) {
  const { id } = useParams();
  const load = useCallback(() => userServices.getUser(id), [id]);
  const blocking = mode === "block";

  return <ConfirmActionPage actionLabel={blocking ? "Xác nhận khóa" : "Xác nhận mở khóa"} backHref={`/admin/users/${id}`} load={load} recordLabel={(user) => `${user.name} · ${user.email}`} submit={() => blocking ? userServices.blockUser(id) : userServices.unblockUser(id)} successHref={`/admin/users/${id}`} title={blocking ? "Khóa người dùng?" : "Mở khóa người dùng?"} warning={blocking ? "Tài khoản sẽ được đánh dấu đã khóa. Người dùng và các đơn hàng không bị xóa." : "Tài khoản sẽ trở lại trạng thái hoạt động."} />;
}
