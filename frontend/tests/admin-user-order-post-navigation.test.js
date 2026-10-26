const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const read = (file) => readFileSync(path.join(__dirname, file), "utf8");

test("user, order and post routes exist and are linked from the sidebar", () => {
  const sidebar = read("../src/components/admin/SideBar.jsx");
  for (const section of ["users", "orders", "posts"]) {
    assert.match(sidebar, new RegExp(`/admin/${section}`));
    assert.ok(existsSync(path.join(__dirname, `../src/app/admin/${section}/page.jsx`)));
    assert.match(read(`../src/app/admin/${section}/page.jsx`), /<Pagination/);
  }
  for (const route of [
    "users/[id]/page.jsx", "users/[id]/block/page.jsx", "users/[id]/unblock/page.jsx",
    "orders/[id]/page.jsx", "orders/[id]/status/page.jsx",
    "posts/create/page.jsx", "posts/[id]/page.jsx", "posts/[id]/edit/page.jsx", "posts/[id]/delete/page.jsx",
    "posts/trash/page.jsx",
  ]) assert.ok(existsSync(path.join(__dirname, "../src/app/admin", route)), route);
});

test("changing order status and deleting a post require explicit confirmation", () => {
  const status = read("../src/app/admin/orders/[id]/status/page.jsx");
  const deletion = read("../src/app/admin/posts/[id]/delete/page.jsx");
  assert.match(status, /confirmed/);
  assert.match(status, /orderServices\.updateStatus\(id, nextStatus\)/);
  assert.match(deletion, /ConfirmActionPage/);
  assert.match(deletion, /submit=\{\(\) => postServices\.deletePost\(id\)\}/);
  const posts = read("../src/app/admin/posts/page.jsx");
  const trash = read("../src/app/admin/posts/trash/page.jsx");
  assert.match(posts, /\/admin\/posts\/trash/);
  assert.match(posts, /ConfirmDialog/);
  assert.match(trash, /requireAcknowledgement/);
  assert.match(trash, /runBulkTrashAction/);
});

test("all new pages call service wrappers rather than raw Axios", () => {
  for (const section of ["users", "orders", "posts"]) {
    const page = read(`../src/app/admin/${section}/page.jsx`);
    assert.match(page, new RegExp(`${section.slice(0, -1)}Services|postServices`));
    assert.doesNotMatch(page, /axiosAdmin\.|axiosClient\./);
  }
});
