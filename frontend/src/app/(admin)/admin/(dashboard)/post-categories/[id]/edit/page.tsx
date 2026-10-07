"use client";
import { EntityEditorPage } from "@/components/admin/entity/EntityEditorPage"; import { postCategoryFields } from "@/components/admin/entity/entityConfigs";
export default function Page() { return <EntityEditorPage endpoint="/admin/post-categories" fields={postCategoryFields} title="Sửa chuyên mục" backUrl="/admin/post-categories" submitLabel="Lưu thay đổi" />; }
