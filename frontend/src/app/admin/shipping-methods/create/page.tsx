"use client";
import { EntityCreatePage } from "@/components/admin/EntityEditorPage"; import { shippingFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/shipping-methods" fields={shippingFields} title="Tao phuong thuc giao hang" backUrl="/admin/shipping-methods" submitLabel="Luu phuong thuc" />; }
