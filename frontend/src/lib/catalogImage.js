import API_CONFIG from "@/config/api";

// Uploaded images are served by Laravel; external/legacy image URLs still work.
export function catalogImageUrl(value) {
  if (!value) return "";
  if (!value.startsWith("/api/catalog-images/")) return value;

  try {
    return new URL(value, API_CONFIG.BASE_URL).toString();
  } catch {
    return value;
  }
}
