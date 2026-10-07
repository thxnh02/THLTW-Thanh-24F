"use client";
import { EntityCreatePage } from "@/components/admin/entity/EntityEditorPage"; import { pageFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityCreatePage endpoint="/admin/pages" fields={pageFields} title="Tao trang" backUrl="/admin/pages" submitLabel="Lưu trang" />; }
