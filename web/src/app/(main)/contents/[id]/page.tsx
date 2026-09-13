import { AnjoTopicPage } from "@/features/anjo/server/topic-page";
import type { TopicSearch } from "@/features/anjo/shared/topic-navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<TopicSearch>;
}) {
  return <AnjoTopicPage id={(await params).id} search={await searchParams} />;
}
