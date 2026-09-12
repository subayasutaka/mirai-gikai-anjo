import { AnjoBillPage } from "@/features/anjo/server/bill-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ difficulty?: string }>;
}) {
  return (
    <AnjoBillPage
      id={(await params).id}
      difficulty={(await searchParams).difficulty}
    />
  );
}
