import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import {
  ANJO_AI_MODEL,
  ANJO_AI_PROVIDER_OPTIONS,
} from "@mirai-gikai/shared/anjo/ai-policy";
import { executeAnjoAnswer } from "@mirai-gikai/shared/anjo/execute-answer";
import { createAdminClient } from "@mirai-gikai/supabase";
import { gateway, generateText } from "ai";
import {
  createDeliberationPrompt,
  DELIBERATION_SYSTEM,
  parseDeliberationDraft,
} from "../shared/prompt";

// Called only after the action has authenticated the editor.
export async function generateDeliberationDraft(
  billId: string,
  transcript: string,
  adminId: string
) {
  if (process.env.ANJO_AI_ENABLED !== "true" || !process.env.REVALIDATE_SECRET)
    throw new Error("AIの接続設定を確認してください。");
  const sb = createAdminClient();
  const { data: bill, error } = await sb
    .from("bills")
    .select("id,name")
    .eq("id", billId)
    .single();
  if (error || !bill) throw new Error("議案を確認できませんでした。");
  const prompt = createDeliberationPrompt(bill.name, transcript);
  const id = randomUUID();
  const clientHash = createHmac("sha256", process.env.REVALIDATE_SECRET)
    .update(
      new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }) +
        ":admin:" +
        adminId
    )
    .digest("hex");
  const result = await executeAnjoAnswer({
    reserve: async () => {
      const reserved = await sb.rpc("reserve_anjo_ai_request", {
        p_id: id,
        p_bill_id: bill.id,
        p_client_hash: clientHash,
        p_allow_draft: true,
      });
      if (reserved.error) throw new Error("reservation_failed");
      return reserved.data;
    },
    generate: async () => {
      const generated = await generateText({
        model: gateway(ANJO_AI_MODEL),
        system: DELIBERATION_SYSTEM,
        prompt,
        maxOutputTokens: 8000,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(60000),
        providerOptions: ANJO_AI_PROVIDER_OPTIONS,
      });
      return {
        text: generated.text,
        inputTokens: generated.usage.inputTokens ?? 0,
        outputTokens: generated.usage.outputTokens ?? 0,
      };
    },
    record: async (usage) => {
      const saved = await sb.from("anjo_ai_usage").update(usage).eq("id", id);
      if (saved.error) throw new Error("usage_save_failed");
    },
  });
  if (!("answer" in result)) throw new Error(result.error);
  try {
    return parseDeliberationDraft(result.answer);
  } catch {
    throw new Error(
      "AIの下書き形式を確認できませんでした。文字起こしは残っています。短く分けてから再試行してください（利用回数は計上されます）。"
    );
  }
}
