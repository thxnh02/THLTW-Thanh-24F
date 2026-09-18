"use client";
import { EntityEditorPage } from "@/components/admin/EntityEditorPage"; import { shippingFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/shipping-methods" fields={shippingFields} title="Sua phuong thuc giao hang" backUrl="/admin/shipping-methods" submitLabel="Luu thay doi" />; }
