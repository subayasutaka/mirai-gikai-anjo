import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import {
  isTopicPublic,
  topicContentSchema,
} from "@mirai-gikai/shared/anjo/topics";
import { readBillData } from "../shared/read-bill-data";

export async function listAnjoTopics() {
  const rows = await readBillData("bill-list", (signal) =>
    createAdminClient()
      .from("anjo_topics")
      .select(
        "*,diet_sessions(name,slug),anjo_topic_bills(bill_id,bills(id,name,diet_session_id,publish_status,status,status_note,introduction_date,plenary_question_date,committee_question_date,vote_date))"
      )
      .eq("publish_status", "published")
      .order("sort_order")
      .order("id")
      .abortSignal(signal)
  );
  // Unpublishing any linked formal bill also hides this explanation and its AI.
  return (rows ?? [])
    .filter((row) =>
      isTopicPublic(
        row,
        row.anjo_topic_bills.map((link) => link.bills)
      )
    )
    .map((row) => ({ ...row, content: topicContentSchema.parse(row.content) }));
}
export type AnjoTopic = Awaited<ReturnType<typeof listAnjoTopics>>[number];
