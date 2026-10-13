"use client";
import { EntityCreatePage } from "@/components/admin/entity/EntityEditorPage"; import { shippingFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/shipping-methods" fields={shippingFields} title="Tạo phương thức giao hàng" backUrl="/admin/shipping-methods" submitLabel="Lưu phương thức" />; }
