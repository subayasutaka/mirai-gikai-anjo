import type { MetadataRoute } from "next";
import { listAnjoBills } from "@/features/anjo/server/repository";
import { listAnjoTopics } from "@/features/anjo/server/topic-repository";
import { resolveSiteUrl } from "@/features/anjo/shared/utils/search-indexing";
import { getBasicAuthConfig } from "@/lib/basic-auth";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Basic認証で閉じている間は、検索エンジンに知らせるページは無い。
  if (getBasicAuthConfig()) return [];
  const siteUrl = resolveSiteUrl(process.env);
  const fixedPaths = [
    routes.home(),
    routes.billsList(),
    routes.terms(),
    routes.privacy(),
  ];
  // 読み込みに失敗しても、固定のページだけは知らせる。
  const [bills, topics] = await Promise.all([
    listAnjoBills().catch(() => []),
    listAnjoTopics().catch(() => []),
  ]);
  return [
    ...fixedPaths,
    ...bills.map((bill) => routes.billDetail(bill.id)),
    ...topics.map((topic) => routes.topicDetail(topic.id)),
  ].map((path) => ({ url: `${siteUrl}${path}` }));
}
