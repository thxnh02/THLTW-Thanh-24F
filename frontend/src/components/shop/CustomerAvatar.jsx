export default function CustomerAvatar({ user, size = 'size-10' }) {
  const name = user?.name?.trim() || 'Khách hàng';
  return <span
    aria-label={`Ảnh đại diện của ${name}`}
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcebe1] font-semibold text-[#245247] ${size}`}
    role="img"
    style={user?.avatar_url ? { backgroundImage: `url("${user.avatar_url}")`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
  >{user?.avatar_url ? '' : name.slice(0, 1).toLocaleUpperCase('vi-VN')}</span>;
}
