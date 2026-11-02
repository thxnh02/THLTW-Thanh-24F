export function safeAdminReturnTo(value) {
  const target = String(value ?? '');
  if (target === '/admin') return target;
  if (/^\/admin\/[a-z0-9_/-]+$/i.test(target) && !target.includes('//') && !target.startsWith('/admin/login')) {
    return target;
  }
  return '/admin';
}
