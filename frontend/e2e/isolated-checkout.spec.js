const { test, expect } = require('@playwright/test');

test.skip(process.env.CT24F_ISOLATED_CHECK !== '1', 'Cần backend SQLite riêng tại cổng 8011.');

test('customer checkout and admin cancellation use the real isolated backend', async ({ page, request }) => {
  await page.route(/\/api\/|\/sanctum\//, async (route) => {
    const url = new URL(route.request().url());
    url.port = '8011';
    const response = await route.fetch({ url: url.toString() });
    await route.fulfill({ response });
  });
  const productsBefore = await (await request.get('http://127.0.0.1:8011/api/products?per_page=1')).json();
  const commerceOptions = await (await request.get('http://127.0.0.1:8011/api/commerce/options')).json();
  const stockBefore = productsBefore.data[0].stock_quantity;
  expect(stockBefore).toBeGreaterThan(0);
  await page.goto('/login?returnTo=%2Fproducts');
  await page.getByLabel('Email').fill('customer@example.test');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('Synthetic-Customer-123!');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.getByRole('button', { name: 'Thêm Tai nghe kiểm thử vào giỏ' }).click();
  await expect(page.getByText('Đã thêm vào giỏ.')).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Đặt hàng', exact: true })).toBeVisible();
  await page.getByLabel('Mã giảm giá').fill('CHECK20');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Đã áp dụng CHECK20.')).toBeVisible();
  const total = 80000 + Number(commerceOptions.data.shipping_fee_vnd);
  await expect(page.getByText(`${total.toLocaleString('vi-VN')} đ`, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận đặt hàng' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đặt hàng thành công');
  const productsAfter = await (await request.get('http://127.0.0.1:8011/api/products?per_page=1')).json();
  expect(productsAfter.data[0].stock_quantity).toBe(stockBefore - 1);

  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.test');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('Synthetic-Admin-123!');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto('/admin/orders');
  await expect(page.getByText('Tai nghe kiểm thử').first()).toBeVisible();
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  await page.getByRole('link', { name: 'Cập nhật' }).first().click();
  await page.getByLabel('Trạng thái tiếp theo').selectOption('cancelled');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Xác nhận cập nhật' }).click();
  await expect(page.getByText('Đã hủy').first()).toBeVisible();
  const productsAfterCancel = await (await request.get('http://127.0.0.1:8011/api/products?per_page=1')).json();
  expect(productsAfterCancel.data[0].stock_quantity).toBe(stockBefore);
});
