import { axiosClient } from "@/lib/axiosClient";

// Admin routes share the same Sanctum cookie session; this named client keeps the boundary explicit.
export const axiosAdminClient = axiosClient;
