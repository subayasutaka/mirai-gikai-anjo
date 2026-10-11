import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { validatePreviewToken } from "@/features/bills/server/loaders/validate-preview-token";
import { readBillData } from "../shared/read-bill-data";

export async function listAnjoBills() {
  const data = await readBillData("bill-list", (signal) =>
    createAdminClient()
      .from("bills")
      .select(
        "id,name,diet_session_id,status,status_note,submitted_date,introduction_date,plenary_question_date,committee_question_date,vote_date,bill_contents(title,summary,difficulty_level),diet_sessions(name,slug,start_date)"
      )
      .eq("publish_status", "published")
      .order("submitted_date", { ascending: false })
      .abortSignal(signal)
  );
  return data ?? [];
}

export async function getAnjoBill(id: string, token?: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const preview = token ? await validatePreviewToken(id, token) : false;
  if (token && !preview) return null;
  return readBillData("bill-detail", (signal) => {
    let query = createAdminClient()
      .from("bills")
      .select("*,bill_contents(*),diet_sessions(name)")
      .eq("id", id);
    if (!preview) query = query.eq("publish_status", "published");
    return query.abortSignal(signal).maybeSingle();
  });
}
