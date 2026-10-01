import { TopicEditPage } from "@/features/anjo/server/topic-pages";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TopicEditPage id={(await params).id} />;
}
