import "server-only";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import type { BillUpdateInput } from "../../shared/types";
import { updateBillRecord } from "../repositories/bill-edit-repository";

/**
 * 議案を更新する。安城実証ではインタビュー等の連動処理は行わない。
 * admin の server action と MCP の update_bill ツールから共通で呼び出す。
 * 部分更新に対応するため input は Partial で受ける（undefined フィールドは更新対象外）。
 */
export async function updateBillWithSideEffects(
  id: string,
  input: Partial<BillUpdateInput>
) {
  const { submitted_date, ...rest } = input;
  const definedFields = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined)
  );

  await updateBillRecord(id, {
    ...definedFields,
    ...(submitted_date !== undefined && {
      submitted_date: submitted_date
        ? `${submitted_date}T00:00:00+09:00`
        : null,
    }),
    updated_at: new Date().toISOString(),
  });

  // 安城実証ではインタビューを利用しない。議案の保存だけを行う。
  await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
}
