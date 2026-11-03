export function saveBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadErrorMessage(error, fallback) {
  const status = error?.response?.status;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi tải tệp.';
  if (status === 403) return 'Tài khoản hiện không có quyền tải tệp này.';
  const body = error?.response?.data;
  if (body instanceof Blob) {
    try {
      const json = JSON.parse(await body.text());
      return json.message ?? fallback;
    } catch {
      return fallback;
    }
  }
  return error?.response?.data?.message ?? fallback;
}
