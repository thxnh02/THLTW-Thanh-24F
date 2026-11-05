const { test, expect } = require('@playwright/test');

test.skip(process.env.CT24F_LIVE_CHECK !== '1', 'Cần backend và dữ liệu nội dung trên máy để kiểm tra trực tiếp.');

test('real storefront pages fit the screen and expose the information pages', async ({ page }) => {
  for (const route of ['/', '/products', '/contact', '/pages/gioi-thieu', '/pages/huong-dan-mua-hang', '/pages/doi-tra-va-ho-tro']) {
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response.status(), route).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    const overflowing = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflowing.scroll, route).toBeLessThanOrEqual(overflowing.client + 1);
  }
  await expect(page.getByRole('link', { name: 'Giới thiệu', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hướng dẫn mua hàng', exact: true })).toBeVisible();
  await page.goto('/products');
  await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bộ lọc sản phẩm' })).toBeVisible();
  await expect(page.getByLabel('Danh mục', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('heading', { name: 'Bộ lọc sản phẩm' })).toBeHidden();
});
