import { AnjoBillIndex } from "@/features/anjo/server/bill-index";
import type { TopicSearch } from "@/features/anjo/shared/topic-navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TopicSearch>;
}) {
  return <AnjoBillIndex search={await searchParams} />;
}
