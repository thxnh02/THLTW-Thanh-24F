export const emptyAddressDraft = {
  label: 'Nhà riêng', recipient_name: '', recipient_phone: '', province: '', province_code: '',
  ward: '', ward_code: '', district: '', street: '', detail: '', delivery_note: '',
};

const editableFields = Object.keys(emptyAddressDraft);

export function toAddressPayload(draft) {
  return Object.fromEntries(editableFields.map((key) => {
    const value = String(draft[key] ?? '').trim();
    return [key, value || (['province_code', 'ward_code', 'district', 'detail', 'delivery_note'].includes(key) ? null : '')];
  }));
}

export function validateAddressDraft(draft) {
  const payload = toAddressPayload(draft);
  const errors = {};
  for (const key of ['label', 'recipient_name', 'province', 'ward', 'street']) {
    if (!payload[key]) errors[key] = 'Vui lòng nhập thông tin này.';
  }
  if (!/^(0\d{9}|\+84\d{9})$/.test(payload.recipient_phone)) errors.recipient_phone = 'Số điện thoại cần có 10 chữ số hoặc bắt đầu bằng +84.';
  return errors;
}
