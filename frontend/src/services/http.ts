import { API_CONFIG } from "@/config/api";
import { ApiError } from "@/lib/apiError";
import { create, read, remove, replace, requestAllPages, requestList, requestPaginated, requestResponse, update } from "@/services/transport";

export { ApiError };
export const API_BASE_URL = API_CONFIG.BASE_URL;
export const get = read;
export const getResponse = requestResponse;
export const getList = requestList;
export const getPaginated = requestPaginated;
export const getAllPages = requestAllPages;
export const post = create;
export const patch = update;
export const put = replace;
export const del = remove;

export async function deleteResponse<T>(url: string): Promise<{ data: T; message: string }> {
  const response = await requestResponse<T>(url, { method: "delete" });
  return { data: response.data, message: response.message };
}

export async function uploadImage(file: File, directory?: string): Promise<{ path: string; url: string; mime: string; size: number }> {
  const data = new FormData();
  data.append("image", file);
  if (directory) data.append("directory", directory);
  return post("/admin/uploads/images", data);
}

export const uploadForm = <T>(url: string, data: FormData) => post<T>(url, data);
