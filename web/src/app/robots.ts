import type { MetadataRoute } from "next";
import { buildRobotsRules } from "@/features/anjo/shared/utils/search-indexing";
import { getBasicAuthConfig } from "@/lib/basic-auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsRules(getBasicAuthConfig() !== null, env.webUrl);
}
