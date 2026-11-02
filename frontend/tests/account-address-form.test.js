const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const loadForm = () => import(pathToFileURL(path.join(__dirname, '../src/lib/accountAddressForm.mjs')).href);

test('address draft sends only editable fields and trims user-entered text', async () => {
  const { toAddressPayload } = await loadForm();
  assert.deepEqual(toAddressPayload({
    id: 8, user_id: 12, is_default: true, full_address: 'server value',
    label: ' Nhà riêng ', recipient_name: ' Nguyễn An ', recipient_phone: '0912345678',
    province: ' Hà Nội ', ward: ' Phường Ba Đình ', street: ' 10 Kim Mã ',
    district: '', detail: '', delivery_note: '', province_code: '', ward_code: '',
  }), {
    label: 'Nhà riêng', recipient_name: 'Nguyễn An', recipient_phone: '0912345678',
    province: 'Hà Nội', ward: 'Phường Ba Đình', street: '10 Kim Mã',
    district: null, detail: null, delivery_note: null, province_code: null, ward_code: null,
  });
});

test('address draft catches missing Vietnam location and invalid recipient phone before submitting', async () => {
  const { validateAddressDraft } = await loadForm();
  const errors = validateAddressDraft({ label: '', recipient_name: '', recipient_phone: 'abc', province: '', ward: '', street: '' });
  assert.deepEqual(Object.keys(errors).sort(), ['label', 'province', 'recipient_name', 'recipient_phone', 'street', 'ward']);
  assert.deepEqual(validateAddressDraft({ label: 'Nhà riêng', recipient_name: 'Nguyễn An', recipient_phone: '+84912345678', province: 'Hà Nội', ward: 'Ba Đình', street: '10 Kim Mã' }), {});
});
