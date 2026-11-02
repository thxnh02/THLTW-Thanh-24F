const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const loadHelpers = () => import(pathToFileURL(path.join(__dirname, "../src/lib/customerAuthHelpers.mjs")).href);

test("customer return paths allow local storefront destinations and reject external or admin targets", async () => {
  const { safeCustomerReturnTo } = await loadHelpers();
  assert.equal(safeCustomerReturnTo("/products?category_id=4"), "/products?category_id=4");
  assert.equal(safeCustomerReturnTo("https://attacker.example"), "/account");
  assert.equal(safeCustomerReturnTo("//attacker.example"), "/account");
  assert.equal(safeCustomerReturnTo("/\\attacker.example"), "/account");
  assert.equal(safeCustomerReturnTo("/admin/users"), "/account");
  assert.equal(safeCustomerReturnTo("/login?returnTo=/products"), "/account");
  assert.equal(safeCustomerReturnTo("/orders", "/products"), "/orders");
});

test("auth feedback exposes Vietnamese API errors and safely masks email addresses", async () => {
  const { authErrorMessage, authFieldErrors, maskEmail } = await loadHelpers();
  assert.equal(authErrorMessage({ response: { status: 419 } }), "Phiên bảo mật đã hết hạn. Vui lòng thử lại.");
  assert.equal(authErrorMessage({ response: { data: { message: "Mã đã hết hạn." } } }), "Mã đã hết hạn.");
  assert.deepEqual(authFieldErrors({ response: { data: { errors: { email: ["Email không hợp lệ."] } } } }), { email: ["Email không hợp lệ."] });
  assert.equal(maskEmail("customer@example.com"), "c••••••@example.com");
  assert.equal(maskEmail("invalid-email"), "");
});
