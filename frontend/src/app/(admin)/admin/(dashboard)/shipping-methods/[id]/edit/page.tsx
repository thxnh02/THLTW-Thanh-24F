"use client";
import { EntityEditorPage } from "@/components/admin/entity/EntityEditorPage"; import { shippingFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/shipping-methods" fields={shippingFields} title="Sửa phương thức giao hàng" backUrl="/admin/shipping-methods" submitLabel="Lưu thay đổi" />; }
