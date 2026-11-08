import type { MetadataRoute } from "next";
import {
  ROBOTS_DISALLOW_PATHS,
  resolveSiteUrl,
} from "@/features/anjo/shared/utils/search-indexing";
import { getBasicAuthConfig } from "@/lib/basic-auth";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Basic認証で閉じている間は、検索エンジンの巡回を断る。
  if (getBasicAuthConfig()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROBOTS_DISALLOW_PATHS,
    },
    sitemap: `${resolveSiteUrl(process.env)}/sitemap.xml`,
  };
}
