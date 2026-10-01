import { notFound } from "next/navigation";
import { AnjoBillPage } from "@/features/anjo/server/bill-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; difficulty?: string }>;
}) {
  const query = await searchParams;
  if (!query.token) notFound();
  return (
    <AnjoBillPage
      id={(await params).id}
      token={query.token}
      difficulty={query.difficulty}
    />
  );
}
