import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { validatePreviewToken } from "@/features/bills/server/loaders/validate-preview-token";

export async function listAnjoBills() {
  const { data, error } = await createAdminClient()
    .from("bills")
    .select(
      "id,name,status,status_note,submitted_date,bill_contents(title,summary,difficulty_level),diet_sessions(name)"
    )
    .eq("publish_status", "published")
    .order("submitted_date", { ascending: false });
  if (error) throw new Error("議案一覧を取得できませんでした。");
  return data;
}

export async function getAnjoBill(id: string, token?: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const preview = token ? await validatePreviewToken(id, token) : false;
  if (token && !preview) return null;
  let query = createAdminClient()
    .from("bills")
    .select("*,bill_contents(*),diet_sessions(name)")
    .eq("id", id);
  if (!preview) query = query.eq("publish_status", "published");
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("議案を取得できませんでした。");
  return data;
}
