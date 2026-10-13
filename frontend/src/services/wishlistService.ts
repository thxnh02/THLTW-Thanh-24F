import { API_CONFIG } from "@/config/api";
import { create, read, remove } from "@/services/transport";
import type { WishlistItem } from "@/types/api";
export const wishlistService = { getWishlist: () => read<WishlistItem[]>(API_CONFIG.ENDPOINTS.ACCOUNT.WISHLIST), add: (productId: number) => create<void>(API_CONFIG.ENDPOINTS.ACCOUNT.WISHLIST, { product_id: productId }), remove: (productId: number) => remove<void>(API_CONFIG.ENDPOINTS.ACCOUNT.WISHLIST_ITEM(productId)) };
