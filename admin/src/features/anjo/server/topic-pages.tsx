import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@mirai-gikai/supabase";
import {
  EMPTY_TOPIC_CONTENT,
  topicContentSchema,
} from "@mirai-gikai/shared/anjo/topics";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import { TopicForm } from "../client/topic-form";

export async function TopicListPage() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("anjo_topics")
    .select("*,diet_sessions(name)")
    .order("sort_order");
  if (error) throw new Error("内容一覧を取得できませんでした。");
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">暮らしの内容を管理</h1>
      <p>
        予算の中の一つの変更を登録し、関係する議案につなぎます。同じ内容を会計ごとに重ねて作る必要はありません。
      </p>
      <Link className="underline font-bold" href={routes.topicNew()}>
        内容を追加する
      </Link>
      <div className="space-y-3">
        {(data ?? []).map((row) => {
          const c = topicContentSchema.parse(row.content);
          return (
            <Link
              key={row.id}
              href={routes.topicEdit(row.id)}
              className="block rounded-lg border bg-white p-5"
            >
              <strong>{c.title}</strong>
              <p>
                {row.diet_sessions?.name} ／{" "}
                {row.publish_status === "published" ? "掲載中" : "下書き"} ／{" "}
                {row.is_review_completed ? "本人確認済み" : "本人未確認"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export async function TopicEditPage({ id }: { id?: string }) {
  await requireAdmin();
  const sb = createAdminClient();
  const [sessions, bills, topics] = await Promise.all([
    sb
      .from("diet_sessions")
      .select("id,name")
      .order("start_date", { ascending: false }),
    sb
      .from("bills")
      .select("id,name,diet_session_id,publish_status,status_note"),
    sb.from("anjo_topics").select("*,anjo_topic_bills(bill_id)"),
  ]);
  if (sessions.error || bills.error || topics.error)
    throw new Error("編集する資料を取得できませんでした。");
  const row = id ? topics.data.find((t) => t.id === id) : null;
  if (id && !row) notFound();
  const now = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
  return (
    <TopicForm
      key={row?.updated_at || "new"}
      initial={{
        id: row?.id || randomUUID(),
        sessionId: row?.diet_session_id || sessions.data[0]?.id || "",
        content: row
          ? topicContentSchema.parse(row.content)
          : { ...EMPTY_TOPIC_CONTENT, checkedOn: now },
        billIds: row?.anjo_topic_bills.map((link) => link.bill_id) || [],
        publishStatus:
          row?.publish_status === "published" ? "published" : "draft",
        reviewed: row?.is_review_completed || false,
        sortOrder: row?.sort_order || 0,
        expectedUpdatedAt: row?.updated_at || null,
      }}
      sessions={sessions.data}
      bills={bills.data}
      topics={topics.data.map((t) => ({
        id: t.id,
        title: topicContentSchema.parse(t.content).title,
      }))}
    />
  );
}
