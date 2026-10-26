// Chuyển dữ liệu form sang multipart khi có tệp; không có tệp thì service tiếp tục gửi JSON.
export function catalogFormData(data, fileKey, method = "POST") {
  const { [fileKey]: file, ...fields } = data;
  if (!file) return null;

  const body = new FormData();
  if (method !== "POST") body.append("_method", method);

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    body.append(key, value === null ? "" : typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
  body.append(fileKey, file);

  return body;
}
