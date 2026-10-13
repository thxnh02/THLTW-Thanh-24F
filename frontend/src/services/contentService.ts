import { API_CONFIG } from "@/config/api";
import { create, read, requestList, requestPaginated } from "@/services/transport";
import type { HomePayload, Page, Post, PostCategory } from "@/types/api";
export const contentService = { getHomepage: () => read<HomePayload>(API_CONFIG.ENDPOINTS.CATALOG.HOMEPAGE), getPosts: (query = "") => requestPaginated<Post>(`${API_CONFIG.ENDPOINTS.CONTENT.POSTS}${query ? `?${query}` : ""}`), getPost: (slug: string) => read<Post>(API_CONFIG.ENDPOINTS.CONTENT.POST(slug)), getPostCategories: () => requestList<PostCategory>(API_CONFIG.ENDPOINTS.CONTENT.POST_CATEGORIES), getPage: (slug: string) => read<Page>(API_CONFIG.ENDPOINTS.CONTENT.PAGE(slug)), sendContact: (payload: unknown) => create<void>(API_CONFIG.ENDPOINTS.CONTENT.CONTACT, payload) };
