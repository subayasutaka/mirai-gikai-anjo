import type { TopicSearch } from "@/features/anjo/shared/topic-navigation";
import { AnjoBillPage } from "@/features/anjo/server/bill-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<TopicSearch & { difficulty?: string }>;
}) {
  return (
    <AnjoBillPage
      id={(await params).id}
      search={await searchParams}
      difficulty={(await searchParams).difficulty}
    />
  );
}
