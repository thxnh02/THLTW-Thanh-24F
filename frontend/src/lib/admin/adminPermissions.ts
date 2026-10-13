export const rolePermissions: Record<string, string[]> = {
  admin: ["*"],
  manager: ["dashboard", "reports", "catalog", "promotions", "orders", "returns", "shipping", "stock", "content", "contacts"],
  staff: ["orders", "returns", "stock", "contacts"],
};

export function canSee(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  const permissions = rolePermissions[role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}
