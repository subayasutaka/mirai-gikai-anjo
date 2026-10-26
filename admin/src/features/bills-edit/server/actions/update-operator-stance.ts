"use server";

import {
  ANJO_SYSTEM_PROMPT_WITH_OPERATOR_STANCE,
  createAnjoPrompt,
} from "@mirai-gikai/shared/anjo/ai-policy";
import {
  type OperatorStanceInput,
  operatorStanceForPrompt,
  operatorStanceInputSchema,
  toOperatorStanceColumns,
} from "@mirai-gikai/shared/anjo/operator-stance";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  findBillById,
  updateBillRecord,
} from "../repositories/bill-edit-repository";

/** 「すば康貴の賛否と理由」欄を保存する。説明文・AI用の資料とは別の項目に書く。 */
export async function updateOperatorStance(
  billId: string,
  input: OperatorStanceInput
) {
  await requireAdmin();
  const parsed = operatorStanceInputSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message };
  const columns = toOperatorStanceColumns(parsed.data);
  try {
    const bill = await findBillById(billId);
    if (bill.use_knowledge_source_in_chat && bill.knowledge_source) {
      try {
        createAnjoPrompt(
          bill,
          "あ".repeat(500),
          operatorStanceForPrompt({ ...bill, ...columns }),
          ANJO_SYSTEM_PROMPT_WITH_OPERATOR_STANCE
        );
      } catch {
        return {
          success: false,
          error:
            "AI用資料と理由を合わせると上限を超えます。理由を短くしてください。まだ保存していません。",
        };
      }
    }
    await updateBillRecord(billId, {
      ...columns,
      updated_at: new Date().toISOString(),
    });
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `保存中にエラーが発生しました: ${getErrorMessage(error, "不明なエラー")}`,
    };
  }
}
