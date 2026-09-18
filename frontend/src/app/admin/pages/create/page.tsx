"use client";
import { EntityCreatePage } from "@/components/admin/EntityEditorPage"; import { pageFields } from "@/components/admin/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/pages" fields={pageFields} title="Tao trang" backUrl="/admin/pages" submitLabel="Luu trang" />; }
