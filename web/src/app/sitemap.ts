import type { MetadataRoute } from "next";
// The access-controlled pilot is deliberately excluded from indexing.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
