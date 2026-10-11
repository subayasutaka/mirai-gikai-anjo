"use server";
import { createAdminClient } from "@mirai-gikai/supabase";
import { ANJO_SOURCE_MAX_BYTES } from "@mirai-gikai/shared/anjo/config";
import { createAnjoPrompt } from "@mirai-gikai/shared/anjo/ai-policy";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { mergeKnowledgeWithDeliberations } from "@/features/deliberations/shared/draft";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import {
  type BillContentsUpdateInput,
  billContentsUpdateSchema,
} from "../../shared/types/bill-contents";
import { findBillById } from "../repositories/bill-edit-repository";
export type UpdateBillContentsResult =
  | { success: true }
  | { success: false; error: string };
export async function updateBillContents(
  billId: string,
  input: BillContentsUpdateInput
): Promise<UpdateBillContentsResult> {
  try {
    await requireAdmin();
    const data = billContentsUpdateSchema.parse(input);
    const bill = await findBillById(billId);
    const knowledge = mergeKnowledgeWithDeliberations(
      bill.knowledge_source ?? "",
      data.hard.content || ""
    );
    if (new TextEncoder().encode(knowledge).length > ANJO_SOURCE_MAX_BYTES)
      return {
        success: false,
        error:
          "元資料と審議記録を合わせたAI資料が上限を超えます。質問と答弁の要約を短くしてください。まだ保存していません。",
      };
    if (bill.use_knowledge_source_in_chat && knowledge) {
      try {
        createAnjoPrompt(
          { ...bill, knowledge_source: knowledge },
          "あ".repeat(500)
        );
      } catch {
        return {
          success: false,
          error:
            "AI用資料が上限を超えます。審議記録の要約を短くしてください。まだ保存していません。",
        };
      }
    }
    const { error } = await createAdminClient().rpc("save_anjo_bill_contents", {
      p_bill_id: billId,
      p_normal: data.normal,
      p_hard: data.hard,
      p_knowledge_source: knowledge,
    });
    if (error)
      throw new Error("保存に失敗しました。接続を確認して再試行してください。");
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "議案の内容を保存できませんでした。",
    };
  }
}
