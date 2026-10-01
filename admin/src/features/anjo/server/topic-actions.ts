"use server";
import { createAdminClient } from "@mirai-gikai/supabase";
import {
  createTopicPrompt,
  topicStatusNote,
  topicEditSchema,
  type TopicEdit,
} from "@mirai-gikai/shared/anjo/topics";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";

export async function saveTopic(
  input: TopicEdit
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    await requireAdmin();
    const parsed = topicEditSchema.safeParse(input);
    if (!parsed.success)
      return {
        success: false,
        error: `入力を確認してください：${parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join(" ／ ")}`,
      };
    const d = parsed.data;
    const sb = createAdminClient();
    const { data: session, error: sessionError } = await sb
      .from("diet_sessions")
      .select("name")
      .eq("id", d.sessionId)
      .single();
    if (sessionError || !session)
      return { success: false, error: "会期を確認できませんでした。" };
    const { data: linkedBills, error: linkedError } = await sb
      .from("bills")
      .select(
        "id,name,status,status_note,introduction_date,plenary_question_date,committee_question_date,vote_date"
      )
      .in("id", d.billIds);
    if (linkedError || linkedBills?.length !== d.billIds.length)
      return { success: false, error: "関係する議案を確認できませんでした。" };
    // Never silently truncate source material. Reserve room for the longest question.
    try {
      createTopicPrompt(
        d.content,
        session.name,
        topicStatusNote(linkedBills),
        "あ".repeat(500)
      );
    } catch {
      return {
        success: false,
        error:
          "説明・内訳・AI資料が長すぎます。要約を短くしてください。保存していません。",
      };
    }
    if (d.content.relatedTopics.some((r) => r.id === d.id))
      return { success: false, error: "自分自身は関連する内容に選べません。" };
    if (d.content.relatedTopics.length) {
      const ids = [...new Set(d.content.relatedTopics.map((r) => r.id))];
      const { data: related, error } = await sb
        .from("anjo_topics")
        .select("id")
        .in("id", ids);
      if (error || related?.length !== ids.length)
        return {
          success: false,
          error: "関連する内容を確認できませんでした。",
        };
    }
    const { error } = await sb.rpc("save_anjo_topic", {
      p_id: d.id,
      p_session_id: d.sessionId,
      p_content: d.content,
      p_bill_ids: d.billIds,
      p_publish_status: d.publishStatus,
      p_reviewed: d.reviewed,
      p_sort_order: d.sortOrder,
      p_expected_updated_at: d.expectedUpdatedAt ?? undefined,
    });
    if (error)
      return {
        success: false,
        error: error.message.includes("stale_topic")
          ? "別の画面で更新されています。再読み込みして確認してください。今回の入力は保存していません。"
          : error.message.includes("invalid_bill_links")
            ? "同じ会期の議案を選んでください。公開するには関連する議案もすべて公開済みにしてください。"
            : "保存できませんでした。接続を確認して再試行してください。",
      };
    revalidatePath(routes.topics());
    revalidatePath(routes.topicEdit(d.id));
    return { success: true, id: d.id };
  } catch {
    return {
      success: false,
      error: "保存できませんでした。ログイン状態と接続を確認してください。",
    };
  }
}
