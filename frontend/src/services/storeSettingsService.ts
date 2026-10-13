import { API_CONFIG } from "@/config/api";
import { read } from "@/services/transport";
import type { StoreSettings } from "@/types/api";
export const storeSettingsService = { getPublic: () => read<StoreSettings>(API_CONFIG.ENDPOINTS.CATALOG.SETTINGS) };
