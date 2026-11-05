const { test, expect } = require('@playwright/test');

test.skip(process.env.CT24F_ISOLATED_CHECK !== '1', 'Cần backend SQLite riêng tại cổng 8011.');

test('admin can manage reviews, delivery fee and product-specific coupons', async ({ page }, testInfo) => {
  await page.route(/\/api\/|\/sanctum\//, async (route) => {
    const url = new URL(route.request().url());
    url.port = '8011';
    await route.fulfill({ response: await route.fetch({ url: url.toString() }) });
  });
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.test');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('Synthetic-Admin-123!');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan đơn hàng' })).toBeVisible();
  await expect(page.getByText('Đơn trong kỳ')).toBeVisible();
  await page.goto('/admin/reviews');
  await expect(page.getByText('Sản phẩm hoạt động tốt.')).toBeVisible();
  if (await page.getByRole('button', { name: 'Hiện', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Hiện', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Ẩn', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đang ẩn' })).toBeVisible();
  await page.getByRole('button', { name: 'Hiện', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đang hiện' })).toBeVisible();
  await page.goto('/admin/site-settings');
  await page.getByLabel('Tên cửa hàng').fill('CT_24F');
  await page.getByLabel('Phí giao hàng cố định (đ)').fill('15000');
  await page.getByRole('button', { name: 'Lưu cài đặt' }).click();
  await expect(page.getByText('Đã lưu cài đặt. Tải lại cửa hàng để xem thay đổi.')).toBeVisible();
  await page.goto('/admin/coupons');
  const code = testInfo.project.name === 'mobile-edge' ? 'E2EMOBILE' : 'E2EDESKTOP';
  await page.getByLabel('Mã', { exact: true }).fill(code);
  await page.getByLabel('Mức giảm').fill('20');
  await page.getByLabel('Số lượt mỗi khách').fill('1');
  await page.getByLabel('Áp dụng cho').selectOption('specific');
  await page.getByLabel('Tai nghe kiểm thử').check();
  await page.getByRole('button', { name: 'Tạo mã giảm giá' }).click();
  await expect(page.getByText('Đã lưu mã giảm giá.')).toBeVisible();
  await expect(page.getByText(code, { exact: true })).toBeVisible();
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
});
