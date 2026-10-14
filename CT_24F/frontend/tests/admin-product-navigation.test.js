const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const read = (relativePath) => readFileSync(path.join(__dirname, relativePath), "utf8");
const dashboard = read("../src/app/admin/page.jsx");
const sidebar = read("../src/components/admin/SideBar.jsx");
const productList = read("../src/app/admin/product/page.jsx");
const createPage = read("../src/app/admin/product/create/page.jsx");

test("dashboard and sidebar lead to the product list", () => {
  assert.match(dashboard, /href="\/admin\/product"/);
  assert.match(sidebar, /href: "\/admin\/product", label: "Sản phẩm"/);
  assert.doesNotMatch(dashboard, /href="\/admin\/product\/create"/);
});

test("product list has a button that opens the separate create route", () => {
  assert.match(productList, /href="\/admin\/product\/create"/);
  assert.match(productList, /Thêm sản phẩm/);
  assert.match(createPage, /<h1[^>]*>Thêm sản phẩm<\/h1>/);
});

test("create page contains no placeholder helper copy", () => {
  assert.doesNotMatch(createPage, /Ví dụ:|Mô tả ngắn về sản phẩm|Tên rõ ràng/);
});

test("category, brand, and product each have paginated list, edit, and trash routes", () => {
  for (const table of ["category", "brand", "product"]) {
    assert.ok(existsSync(path.join(__dirname, `../src/app/admin/${table}/page.jsx`)), `${table} list route exists`);
    assert.ok(existsSync(path.join(__dirname, `../src/app/admin/${table}/trash/page.jsx`)), `${table} trash route exists`);
    assert.ok(existsSync(path.join(__dirname, `../src/app/admin/${table}/[id]/edit/page.jsx`)), `${table} edit route exists`);
    assert.ok(existsSync(path.join(__dirname, `../src/app/admin/${table}/[id]/restore/page.jsx`)), `${table} restore route exists`);
    assert.match(read(`../src/app/admin/${table}/page.jsx`), /Pagination/);
    assert.match(read(`../src/app/admin/${table}/trash/page.jsx`), /Pagination|TrashTable/);
  }
});

test("catalog API controllers and models expose soft-delete recovery", () => {
  const backend = path.resolve(__dirname, "../../backend");
  for (const table of ["Category", "Brand", "Product"]) {
    const controllerPath = path.join(backend, `app/Http/Controllers/Api/Admin/Admin${table}Controller.php`);
    const modelPath = path.join(backend, `app/Models/${table}.php`);
    assert.ok(existsSync(controllerPath), `${table} controller exists`);
    assert.match(readFileSync(controllerPath, "utf8"), /trash\(|restore\(|forceDestroy\(/);
    assert.match(readFileSync(modelPath, "utf8"), /SoftDeletes/);
  }
});

test("each catalog list has an obvious trash link and shared aligned row actions", () => {
  for (const table of ["category", "brand", "product"]) {
    const page = read(`../src/app/admin/${table}/page.jsx`);
    assert.match(page, new RegExp(`href="/admin/${table}/trash"`));
    assert.match(page, /Mở thùng rác/);
    assert.match(page, /AdminRowActions/);
  }
  const actionsPath = path.join(__dirname, "../src/components/admin/AdminRowActions.jsx");
  assert.ok(existsSync(actionsPath));
  assert.match(readFileSync(actionsPath, "utf8"), /h-10[^"']*w-\[6rem\]/);
});

test("restoring a trashed product is confirmed in place and keeps the admin on the trash page", () => {
  const productTrash = read("../src/app/admin/product/trash/page.jsx");
  assert.match(productTrash, /onClick=\{\(\) => \{ setNotice\(""\); setRestoreConfirming\(item\); \}\}/);
  assert.doesNotMatch(productTrash, /href=\{`\/admin\/product\/\$\{item\.id\}\/restore`\}/);
  assert.match(productTrash, /title="Khôi phục sản phẩm này\?"/);
  assert.match(productTrash, /recordLabel=\{\(record\) => `\$\{record\.name\} · \$\{record\.slug\}`\}/);
  assert.match(productTrash, /Sản phẩm sẽ trở lại trang quản trị\. Cần khôi phục danh mục và thương hiệu trước/);
  assert.match(productTrash, /productServices\.restoreProduct\(item\.id\)/);
  assert.match(productTrash, /setNotice\(`Đã khôi phục sản phẩm “\$\{record\.name\}”\.\`\)/);
});

test("trash tables support selecting visible rows and bulk actions on all catalog trash pages", () => {
  const adminTable = read("../src/components/admin/AdminTable.jsx");
  const trashTable = read("../src/components/admin/TrashTable.jsx");
  assert.match(adminTable, /Chọn tất cả trên trang này/);
  assert.match(adminTable, /Chọn \$\{row\.name\}/);
  assert.match(trashTable, /selectedIds/);
  for (const table of ["category", "brand", "product"]) {
    const page = read(`../src/app/admin/${table}/trash/page.jsx`);
    assert.match(page, /selectedIds/);
    assert.match(page, /restoreSelected/);
    assert.match(page, /deleteSelected/);
    assert.match(page, /requireAcknowledgement/);
  }
});

test("bulk trash actions report partial failures without losing which records failed", async () => {
  const actionHelperPath = path.join(__dirname, "../src/lib/adminTrashActions.mjs");
  assert.ok(existsSync(actionHelperPath), "bulk action helper exists");
  const { runBulkTrashAction } = await import(pathToFileURL(actionHelperPath));
  const records = [{ id: 4 }, { id: 7 }, { id: 9 }];
  const outcome = await runBulkTrashAction(records, async (id) => {
    if (id === 7) throw new Error("not eligible");
    return { id };
  });

  assert.deepEqual(outcome.succeeded.map(({ id }) => id), [4, 9]);
  assert.deepEqual(outcome.failed.map(({ id }) => id), [7]);
});

test("permanent deletion confirmation requires an explicit checkbox", () => {
  const confirmDialog = read("../src/components/admin/ConfirmDialog.jsx");
  assert.match(confirmDialog, /requireAcknowledgement/);
  assert.match(confirmDialog, /type="checkbox"/);
  assert.match(confirmDialog, /requireAcknowledgement && !acknowledged/);
});

test("admin dashboard initial motion attributes do not branch on client reduced-motion preference", () => {
  const adminPage = read("../src/app/admin/page.jsx");
  assert.doesNotMatch(adminPage, /initial=\{reduceMotion \? false/);
  assert.match(adminPage, /initial=\{\{ opacity: 0, y: 12 \}\}/);
  assert.match(adminPage, /initial=\{\{ opacity: 0, y: 10 \}\}/);
  assert.match(adminPage, /duration: reduceMotion \? 0 : 0\.35/);
});
