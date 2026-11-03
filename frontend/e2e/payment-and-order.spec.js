const { test, expect } = require('@playwright/test');

const order = (overrides = {}) => ({
  id: 1,
  order_code: 'CT24F-TEST-0001',
  status: 'pending',
  payment_method: 'cod',
  payment_status: 'pending',
  grand_total_vnd: 100000,
  items: [],
  payment_attempts: [],
  payment_review_required: false,
  ...overrides,
});

async function mockCustomerOrderApi(page, currentOrder) {
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/api/auth/me')) {
      return route.fulfill({ json: { data: { user: { id: 7, name: 'Khách kiểm thử', email: 'browser@example.test' } } } });
    }
    if (url.pathname.endsWith('/api/account/orders/1/export/pdf')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'content-disposition': 'attachment; filename="phieu-don-hang-CT24F-TEST-0001.pdf"' },
        body: Buffer.from('%PDF-1.4\n% controlled browser test\n'),
      });
    }
    if (url.pathname.endsWith('/api/account/orders/1')) {
      return route.fulfill({ json: { data: currentOrder } });
    }
    return route.fulfill({ status: 404, json: { message: 'API test route not configured' } });
  });
}

async function mockCheckoutApi(page) {
  let signedIn = false;
  let cart = { items: [] };
  const currentOrder = order();
  const product = { id: 42, name: 'Tai nghe thử nghiệm', slug: 'tai-nghe-thu-nghiem', price: 100000, sale_price: null, stock_quantity: 5, image: null };
  const address = { id: 8, recipient_name: 'Khách kiểm thử', recipient_phone: '0900000000', full_address: 'Phường thử nghiệm, TP. Hồ Chí Minh', is_default: true };

  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/api/auth/me')) {
      return signedIn
        ? route.fulfill({ json: { data: { user: { id: 7, name: 'Khách kiểm thử', email: 'browser@example.test' } } } })
        : route.fulfill({ status: 401, json: { message: 'Unauthenticated.' } });
    }
    if (path.endsWith('/api/auth/login') && route.request().method() === 'POST') {
      signedIn = true;
      return route.fulfill({ json: { data: { user: { id: 7, name: 'Khách kiểm thử', email: 'browser@example.test' } } } });
    }
    if (path.endsWith('/api/auth/register') && route.request().method() === 'POST') {
      return route.fulfill({ status: 201, json: { data: { user: { id: 7, name: 'Khách kiểm thử', email: 'browser@example.test' } } } });
    }
    if (path.endsWith('/api/products/price-range')) return route.fulfill({ json: { data: { min_price: 100000, max_price: 100000 } } });
    if (path.endsWith('/api/products/id/42')) return route.fulfill({ json: { data: product } });
    if (path.endsWith('/api/products')) return route.fulfill({ json: { data: [product], meta: { current_page: 1, last_page: 1, total: 1 } } });
    if (path.endsWith('/api/categories') || path.endsWith('/api/brands')) return route.fulfill({ json: { data: [] } });
    if (path.endsWith('/api/account/cart/items') && route.request().method() === 'POST') {
      cart = { items: [{ product_id: 42, quantity: 1, unit_price_vnd: 100000, available: true, product }] };
      return route.fulfill({ json: { data: cart } });
    }
    if (path.endsWith('/api/account/cart')) return route.fulfill({ json: { data: cart } });
    if (path.endsWith('/api/account/addresses')) return route.fulfill({ json: { data: { addresses: [address] } } });
    if (path.endsWith('/api/commerce/options')) return route.fulfill({ json: { data: { cod_enabled: true, vnpay_sandbox_enabled: false, shipping_fee_vnd: 0 } } });
    if (path.endsWith('/api/account/orders') && route.request().method() === 'POST') {
      return route.fulfill({ json: { data: { order: currentOrder } } });
    }
    if (path.endsWith('/api/account/orders/1')) return route.fulfill({ json: { data: currentOrder } });
    return route.fulfill({ status: 404, json: { message: 'API test route not configured' } });
  });
}

async function mockAdminOrdersApi(page, currentOrder) {
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/api/admin/me')) {
      return route.fulfill({ json: { data: { user: { id: 9, name: 'Quản trị kiểm thử', email: 'admin@example.test' } } } });
    }
    if (url.pathname.endsWith('/api/admin/orders/export/csv')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv; charset=UTF-8',
        body: '\uFEFFMã đơn,Thanh toán,Trạng thái\nCT24F-TEST-0001,Thanh toán khi nhận hàng,Đơn hàng đang chờ xử lý\n',
      });
    }
    if (url.pathname.endsWith('/api/admin/orders/1/export/pdf')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'content-disposition': 'attachment; filename="phieu-don-hang-CT24F-TEST-0001.pdf"' },
        body: Buffer.from('%PDF-1.4\n% controlled browser test\n'),
      });
    }
    if (url.pathname.endsWith('/api/admin/orders/1/status') && route.request().method() === 'PATCH') {
      currentOrder.status = route.request().postDataJSON().status;
      currentOrder.allowed_next_statuses = [];
      return route.fulfill({ json: { data: currentOrder } });
    }
    if (url.pathname.endsWith('/api/admin/orders/1')) {
      return route.fulfill({ json: { data: { ...currentOrder, user: { name: 'Khách kiểm thử', email: 'buyer@example.test' } } } });
    }
    if (url.pathname.endsWith('/api/admin/orders')) {
      return route.fulfill({
        json: {
          data: [{ ...currentOrder, user: { name: 'Khách kiểm thử', email: 'buyer@example.test' }, created_at: '2026-11-03T08:00:00Z', allowed_next_statuses: ['processing'] }],
          meta: { current_page: 1, last_page: 1, total: 1 },
        },
      });
    }
    return route.fulfill({ status: 404, json: { message: 'API test route not configured' } });
  });
}

test('customer can register without verification, sign in, add a product and place a COD order', async ({ page }) => {
  await mockCheckoutApi(page);
  await page.goto('/register');
  await page.getByLabel('Họ và tên').fill('Khách kiểm thử');
  await page.getByLabel('Email').fill('browser@example.test');
  await page.locator('#register-password').fill('local-test-password');
  await page.locator('#register-password-confirmation').fill('local-test-password');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByText(/Tài khoản đã được tạo\. Hãy đăng nhập để tiếp tục/)).toBeVisible();

  await page.goto('/login?returnTo=%2Fproducts');
  await page.getByLabel('Email').fill('browser@example.test');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('local-test-password');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page).toHaveURL(/\/products$/);
  await page.getByRole('button', { name: 'Thêm Tai nghe thử nghiệm vào giỏ' }).click();
  await expect(page.getByText('Đã thêm vào giỏ.')).toBeVisible();
  await page.goto('/cart');
  await expect(page.getByText('Tai nghe thử nghiệm')).toBeVisible();
  await page.getByRole('link', { name: 'Tiến hành đặt hàng' }).click();
  await expect(page.getByRole('heading', { name: 'Đặt hàng', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận đặt hàng' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đặt hàng thành công');
  await expect(page.getByRole('status')).toContainText('Bạn thanh toán khi nhận hàng.');
});

test('password reset accepts the controlled OTP response without sending real email', async ({ page }) => {
  let submittedCode = null;
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/api/auth/me')) return route.fulfill({ status: 401, json: { message: 'Unauthenticated.' } });
    if (path.endsWith('/api/auth/forgot-password') && route.request().method() === 'POST') return route.fulfill({ json: { message: 'If the account exists, a code has been sent.' } });
    if (path.endsWith('/api/auth/forgot-password/reset') && route.request().method() === 'POST') {
      submittedCode = route.request().postDataJSON().code;
      return route.fulfill({ json: { message: 'Password updated.' } });
    }
    return route.fulfill({ status: 404, json: { message: 'API test route not configured' } });
  });

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('browser@example.test');
  await page.getByRole('button', { name: 'Gửi mã đặt lại' }).click();
  await expect(page.getByRole('status')).toContainText('Nếu email đã đăng ký và có thể nhận thư');
  await page.getByRole('link', { name: 'Nhập mã và tạo mật khẩu mới' }).click();
  await page.locator('#reset-code').fill('123456');
  await page.locator('#reset-password').fill('new-local-password');
  await page.locator('#reset-password-confirmation').fill('new-local-password');
  await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();

  await expect(page.getByRole('status')).toContainText('Mật khẩu đã được cập nhật');
  expect(submittedCode).toBe('123456');
});

test('COD result confirms the order and says payment is due on delivery', async ({ page }) => {
  await mockCustomerOrderApi(page, order());
  await page.goto('/payment-result?order=1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đặt hàng thành công');
  await expect(page.getByRole('status')).toContainText('Bạn thanh toán khi nhận hàng.');
  await expect(page.getByText('Thanh toán khi nhận hàng', { exact: true })).toBeVisible();
  await expect(page.getByText('Đơn hàng đang chờ xử lý')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kiểm tra lại' })).toHaveCount(0);
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test('cancelled COD result never uses a success heading', async ({ page }) => {
  await mockCustomerOrderApi(page, order({ status: 'cancelled' }));
  await page.goto('/payment-result?order=1');

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText('Đơn hàng đã hủy');
  await expect(heading).not.toContainText(/thành công/i);
});

test('confirmed VNPay result is distinct from COD', async ({ page }) => {
  await mockCustomerOrderApi(page, order({ payment_method: 'vnpay', payment_status: 'paid' }));
  await page.goto('/payment-result?order=1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thanh toán thành công!');
  await expect(page.getByRole('status')).toContainText('VNPay đã xác nhận giao dịch thanh toán.');
  await expect(page.getByText('Thanh toán thành công qua VNPay')).toBeVisible();
});

test('pending VNPay result waits for server confirmation and offers manual refresh', async ({ page }) => {
  await mockCustomerOrderApi(page, order({ payment_method: 'vnpay', payment_status: 'pending' }));
  await page.goto('/payment-result?order=1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đang xác nhận thanh toán');
  await expect(page.getByRole('status')).toContainText('Đang chờ VNPay xác nhận giao dịch.');
  await expect(page.getByRole('button', { name: 'Kiểm tra lại' })).toBeEnabled();
});

test('manual-review payment state warns against paying again', async ({ page }) => {
  await mockCustomerOrderApi(page, order({ payment_method: 'vnpay', payment_status: 'needs_review', payment_review_required: true }));
  await page.goto('/payment-result?order=1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giao dịch cần kiểm tra');
  await expect(page.getByRole('status')).toContainText('Vui lòng không thanh toán lại');
});

test('failed VNPay result offers the backend-approved retry action', async ({ page }) => {
  await mockCustomerOrderApi(page, order({ payment_method: 'vnpay', payment_status: 'failed' }));
  await page.goto('/payment-result?order=1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thanh toán không thành công');
  await expect(page.getByRole('button', { name: 'Thử thanh toán lại' })).toBeVisible();
});

test('customer can download an order confirmation PDF from order details', async ({ page }) => {
  await mockCustomerOrderApi(page, order());
  await page.goto('/account/orders/1');

  await expect(page.getByRole('heading', { name: /Đơn #1/ })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /PDF/ }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toContain('CT24F-TEST-0001');
});

test('admin order list shows COD due on delivery and exports CSV', async ({ page }) => {
  await mockAdminOrdersApi(page, order());
  await page.goto('/admin/orders');

  await expect(page.getByRole('heading', { name: 'Đơn hàng', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Thanh toán khi nhận hàng' })).toBeVisible();
  await expect(page.getByText('COD · chờ thu khi giao hàng')).toHaveCount(0);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Xuất danh sách đơn hàng/ }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});

test('admin order detail shows COD due on delivery separately from fulfillment', async ({ page }) => {
  await mockAdminOrdersApi(page, order());
  await page.goto('/admin/orders/1');

  await expect(page.getByRole('heading', { name: /Chi tiết đơn #1/ })).toBeVisible();
  await expect(page.getByText(/Thanh toán: Thanh toán khi nhận hàng/)).toBeVisible();
  await expect(page.getByText(/Trạng thái đơn hàng: Đơn hàng đang chờ xử lý/)).toBeVisible();
});

test('admin confirms an eligible order status update before saving it', async ({ page }) => {
  await mockAdminOrdersApi(page, order({ allowed_next_statuses: ['processing'] }));
  await page.goto('/admin/orders/1/status');

  await expect(page.getByRole('heading', { name: 'Cập nhật trạng thái đơn #1' })).toBeVisible();
  await page.getByRole('checkbox', { name: /Tôi xác nhận chuyển trạng thái đơn hàng sang/ }).check();
  await page.getByRole('button', { name: 'Xác nhận cập nhật' }).click();
  await expect(page).toHaveURL(/\/admin\/orders\/1$/);
  await expect(page.getByText('Đơn hàng đang được xử lý')).toBeVisible();
});
