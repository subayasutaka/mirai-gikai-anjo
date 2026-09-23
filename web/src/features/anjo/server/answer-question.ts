import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { createAdminClient } from "@mirai-gikai/supabase";
import { gateway, generateText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
  ANJO_AI_MODEL,
  ANJO_AI_PROVIDER_OPTIONS,
  ANJO_SYSTEM_PROMPT,
  createAnjoPrompt,
  MAX_OUTPUT_TOKENS,
  questionSchema,
} from "../shared/ai-policy";
import { executeAnjoAnswer } from "../shared/execute-answer";
import { getMarkdownReadings } from "./furigana";
import {
  createTopicPrompt,
  topicStatusNote,
} from "@mirai-gikai/shared/anjo/topics";
import { listAnjoTopics } from "./topic-repository";

async function fail(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
      readings: await getMarkdownReadings(message).catch(() => ({})),
    },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}
export async function answerAnjoQuestion(request: NextRequest) {
  if (process.env.ANJO_AI_ENABLED !== "true")
    return fail("AIは接続準備中です。", 503);
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return fail("この議案ページから質問してください。", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail("質問の形式が正しくありません。", 415);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 4096)
    return fail("質問は500文字以内で入力してください。", 413);
  let parsed: ReturnType<typeof questionSchema.safeParse>;
  try {
    parsed = questionSchema.safeParse(JSON.parse(text));
  } catch {
    return fail("質問の形式が正しくありません。", 400);
  }
  if (!parsed.success) return fail("質問は1〜500文字で入力してください。", 400);
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return fail("接続設定の確認中です。", 503);
  const sb = createAdminClient();
  const { data: bill, error } = await sb
    .from("bills")
    .select(
      "id,name,status,status_note,knowledge_source,use_knowledge_source_in_chat"
    )
    .eq("id", parsed.data.billId)
    .eq("publish_status", "published")
    .maybeSingle();
  if (error) return fail("資料を取得できませんでした。", 503);
  if (
    !bill ||
    !bill.use_knowledge_source_in_chat ||
    (!parsed.data.topicId && !bill.knowledge_source?.trim())
  )
    return fail("質問用の資料がまだ登録されていません。", 404);
  let prompt: string;
  try {
    if (parsed.data.topicId) {
      const topic = (await listAnjoTopics()).find(
        (t) =>
          t.id === parsed.data.topicId &&
          t.anjo_topic_bills.some((link) => link.bill_id === bill.id)
      );
      if (!topic)
        return fail("この内容の質問用資料は公開されていません。", 404);
      prompt = createTopicPrompt(
        topic.content,
        topic.diet_sessions?.name || "会期未登録",
        topicStatusNote(
          topic.anjo_topic_bills.flatMap((link) =>
            link.bills ? [link.bills] : []
          )
        ),
        parsed.data.question
      );
    } else {
      prompt = createAnjoPrompt(bill, parsed.data.question);
    }
  } catch {
    return fail("資料の長さを運営者が確認しています。", 503);
  }
  const id = randomUUID();
  // Vercel supplies this header. Shared local fallback remains under global caps.
  const client =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
  const clientHash = createHmac("sha256", secret)
    .update(today + ":" + client)
    .digest("hex");
  const result = await executeAnjoAnswer({
    reserve: async () => {
      const reserved = await sb.rpc("reserve_anjo_ai_request", {
        p_id: id,
        p_bill_id: bill.id,
        p_client_hash: clientHash,
      });
      if (reserved.error) throw new Error("reservation_failed");
      return reserved.data;
    },
    generate: async () => {
      const generated = await generateText({
        model: gateway(ANJO_AI_MODEL),
        system: ANJO_SYSTEM_PROMPT,
        prompt,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(25000),
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
      if (saved.error) console.error("Anjo AI usage update failed", id);
    },
  });
  return "answer" in result
    ? NextResponse.json(
        {
          answer: result.answer,
          readings: await getMarkdownReadings(result.answer).catch(() => ({})),
        },
        { headers: { "Cache-Control": "no-store" } }
      )
    : fail(result.error, result.status);
}
