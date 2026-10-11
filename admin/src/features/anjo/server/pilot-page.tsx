import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { summarizePilotUsage } from "../shared/usage-summary";
import { PasswordForm } from "../client/password-form";
export async function PilotPage() {
  await requireAdmin();
  const month = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })
    .slice(0, 7);
  const { data, error } = await createAdminClient()
    .from("anjo_ai_usage")
    .select("id,created_at,state,actual_usd,reserved_usd,duration_ms,model")
    .gte("created_at", month + "-01T00:00:00+09:00")
    .order("created_at", { ascending: false });
  if (error) throw new Error("実証の利用記録を取得できませんでした。");
  const summary = summarizePilotUsage(data ?? []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">実証の記録と設定</h1>
      <section className="rounded-lg border bg-white p-6 space-y-3">
        <h2 className="text-xl font-semibold">{month} のAI利用（日本時間）</h2>
        <p>
          成功 {summary.completed}件 ／ 受付 {summary.accepted}件 ／ 平均応答{" "}
          {summary.averageSeconds?.toFixed(1) ?? "—"}秒
        </p>
        <p>
          推計使用額 ${summary.cost.toFixed(6)} ／ 上限判定用の予約額 $
          {summary.reserved.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">
          初期実証は全体で1日10回・月100回までです。失敗した呼出しも上限に含めます。予約額は請求額ではありません。実際の無料枠残高はVercel
          AI Gatewayで確認してください。質問本文はこのDBには保存しません。
        </p>
        <p className="text-sm">
          効果は、回答の正確さ・分かりやすさ・更新にかかった分数も手順書の記録欄に残して評価します。
        </p>
      </section>
      <PasswordForm />
    </div>
  );
}
