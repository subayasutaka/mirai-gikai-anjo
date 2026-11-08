import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { validatePreviewToken } from "@/features/bills/server/loaders/validate-preview-token";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  ANJO_DATA_REVALIDATE_SECONDS,
  readBillData,
} from "../shared/read-bill-data";

// 公開中の議案はしばらく覚えておき、初回アクセスや同時アクセスのたびにDBへ行かない。
// 失敗（例外）は覚えないので、障害が続いても復旧後すぐ最新に戻る。
const listPublishedBills = unstable_cache(
  () =>
    readBillData("bill-list", (signal) =>
      createAdminClient()
        .from("bills")
        .select(
          "id,name,diet_session_id,status,status_note,submitted_date,introduction_date,plenary_question_date,committee_question_date,vote_date,bill_contents(title,summary,difficulty_level),diet_sessions(name,slug,start_date)"
        )
        .eq("publish_status", "published")
        .order("submitted_date", { ascending: false })
        .abortSignal(signal)
    ),
  ["anjo-published-bills"],
  { revalidate: ANJO_DATA_REVALIDATE_SECONDS, tags: [CACHE_TAGS.BILLS] }
);

export async function listAnjoBills() {
  return (await listPublishedBills()) ?? [];
}

function readBill(id: string, preview: boolean) {
  return readBillData("bill-detail", (signal) => {
    let query = createAdminClient()
      .from("bills")
      .select("*,bill_contents(*),diet_sessions(name)")
      .eq("id", id);
    if (!preview) query = query.eq("publish_status", "published");
    return query.abortSignal(signal).maybeSingle();
  });
}

const getPublishedBill = unstable_cache(
  (id: string) => readBill(id, false),
  ["anjo-published-bill"],
  { revalidate: ANJO_DATA_REVALIDATE_SECONDS, tags: [CACHE_TAGS.BILLS] }
);

export async function getAnjoBill(id: string, token?: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!token) return getPublishedBill(id);
  // プレビューは下書きを含むので覚えない。
  return (await validatePreviewToken(id, token)) ? readBill(id, true) : null;
}
