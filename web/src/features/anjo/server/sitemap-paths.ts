import "server-only";
import { routes } from "@/lib/routes";
import { listAnjoBills } from "./repository";
import { listAnjoTopics } from "./topic-repository";

/** 検索エンジンに知らせるページのパス。読み込みに失敗しても固定のページは返す。 */
export async function loadSitemapPaths(): Promise<string[]> {
  const [bills, topics] = await Promise.all([
    listAnjoBills().catch(() => []),
    listAnjoTopics().catch(() => []),
  ]);
  return [
    routes.home(),
    routes.billsList(),
    routes.terms(),
    routes.privacy(),
    ...bills.map((bill) => routes.billDetail(bill.id)),
    ...topics.map((topic) => routes.topicDetail(topic.id)),
  ];
}
