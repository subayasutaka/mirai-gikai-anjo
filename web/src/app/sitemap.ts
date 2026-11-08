import type { MetadataRoute } from "next";
import { loadSitemapPaths } from "@/features/anjo/server/sitemap-paths";
import { buildSitemapEntries } from "@/features/anjo/shared/utils/search-indexing";
import { getBasicAuthConfig } from "@/lib/basic-auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Basic認証で閉じている間は、検索エンジンに知らせるページは無い。
  if (getBasicAuthConfig()) return [];
  return buildSitemapEntries(env.webUrl, await loadSitemapPaths());
}
