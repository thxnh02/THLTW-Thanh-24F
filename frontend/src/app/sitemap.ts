import type { MetadataRoute } from "next";

import { API_BASE_URL } from "@/lib/api";
import type { Page, Post, Product } from "@/types/api";

type Paginated<T> = {
  data?: T[];
};

const staticRoutes = ["", "/products", "/posts", "/contact", "/login", "/register"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  const urls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const [products, posts, pages] = await Promise.all([
    fetchList<Product>("/products?per_page=50"),
    fetchList<Post>("/posts?per_page=50"),
    fetchList<Page>("/pages?per_page=50"),
  ]);

  products.forEach((product) => {
    urls.push({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  posts.forEach((post) => {
    urls.push({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  pages.forEach((page) => {
    urls.push({
      url: `${siteUrl}/pages/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  });

  return urls;
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: T[] | Paginated<T> };

    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    return payload.data?.data ?? [];
  } catch {
    return [];
  }
}
