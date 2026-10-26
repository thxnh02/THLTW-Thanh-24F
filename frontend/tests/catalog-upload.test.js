const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const moduleUrl = pathToFileURL(path.join(__dirname, "../src/lib/catalogFormData.mjs")).href;

test("catalog upload serializes fields and file for a create request", async () => {
  const { catalogFormData } = await import(moduleUrl);
  const image = new Blob(["image bytes"], { type: "image/png" });
  const body = catalogFormData({ name: "Camera", category_id: 2, brand_id: null, sale_price: 750, status: false, image_file: image }, "image_file");

  assert.equal(body.get("name"), "Camera");
  assert.equal(body.get("category_id"), "2");
  assert.equal(body.get("brand_id"), "");
  assert.equal(body.get("sale_price"), "750");
  assert.equal(body.get("status"), "0");
  assert.equal(body.get("image_file").type, "image/png");
  assert.equal(body.has("_method"), false);
});

test("catalog upload spoofs PUT for multipart edits and leaves URL-only requests as JSON", async () => {
  const { catalogFormData } = await import(moduleUrl);
  const logo = new Blob(["logo bytes"], { type: "image/webp" });
  const body = catalogFormData({ name: "Acme", status: true, logo_file: logo }, "logo_file", "PUT");

  assert.equal(body.get("_method"), "PUT");
  assert.equal(body.get("status"), "1");
  assert.equal(body.get("logo_file").type, "image/webp");
  assert.equal(catalogFormData({ name: "Acme", logo: "https://example.com/logo.png", logo_file: null }, "logo_file", "PUT"), null);
});
