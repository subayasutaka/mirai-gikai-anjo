import { ANJO_AI_MODEL, estimateAnjoCost } from "./ai-policy";

type Usage = {
  model: string;
  state: "completed" | "failed";
  input_tokens?: number;
  output_tokens?: number;
  actual_usd?: number;
  duration_ms: number;
};
type AnswerDependencies = {
  reserve: () => Promise<string>;
  generate: () => Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
  }>;
  record: (usage: Usage) => Promise<void>;
};
export type AnswerResult =
  | { answer: string; status: 200 }
  | { error: string; status: number };

// All side effects are injected. A failed call keeps its original reservation.
export async function executeAnjoAnswer(
  deps: AnswerDependencies
): Promise<AnswerResult> {
  let reserved: string;
  try {
    reserved = await deps.reserve();
  } catch {
    return {
      error: "利用上限を確認できないため、AIを停止しています。",
      status: 503,
    };
  }
  if (reserved !== "allowed") {
    return {
      error:
        reserved === "rate_limit"
          ? "少し時間を置いて、もう一度お試しください。"
          : "実証の利用上限に達しました。時間・日付を変えてお試しください。",
      status: 429,
    };
  }
  const started = Date.now();
  try {
    const result = await deps.generate();
    const answer = result.text.trim();
    await deps.record({
      model: ANJO_AI_MODEL,
      state: answer ? "completed" : "failed",
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      actual_usd: estimateAnjoCost(result.inputTokens, result.outputTokens),
      duration_ms: Date.now() - started,
    });
    return answer
      ? { answer, status: 200 }
      : {
          error: "回答を生成できませんでした。質問を短くしてお試しください。",
          status: 502,
        };
  } catch {
    // Recording failures must not result in a retry of a billable generation.
    try {
      await deps.record({ model: ANJO_AI_MODEL, state: "failed", duration_ms: Date.now() - started });
    } catch {
      /* The reservation remains counted even when recording fails. */
    }
    return {
      error: "AIへの接続に失敗しました。無料枠や接続状態を確認しています。",
      status: 503,
    };
  }
}
