import type { Bill, BillInsert } from "../types";

/**
 * 議案データから複製用のinsertデータを生成する
 * ID・タイムスタンプを除去し、名前に「(複製)」を付与、ステータスをdraftに設定
 * 運営者の賛否と理由は議案ごとのものなので引き継がない
 */
export function prepareBillForDuplication(originalBill: Bill): BillInsert {
  const {
    id: _,
    created_at: __,
    updated_at: ___,
    status_order: ____,
    slug: _____,
    ...billWithoutId
  } = originalBill;

  return {
    ...billWithoutId,
    slug: null,
    name: `${originalBill.name} (複製)`,
    publish_status: "draft",
    is_review_completed: false,
    operator_vote: null,
    operator_reasons: null,
    operator_stance_written_on: null,
  };
}

/**
 * 議案コンテンツ配列から複製用のデータを生成する
 * IDを除去し、新しいbill_idを設定
 */
export function prepareBillContentsForDuplication<
  T extends { id: string; bill_id: string },
>(
  contents: T[],
  newBillId: string
): (Omit<T, "id" | "bill_id"> & { bill_id: string })[] {
  return contents.map((content) => {
    const { id: _, bill_id: __, ...contentData } = content;
    return {
      ...contentData,
      bill_id: newBillId,
    };
  });
}
