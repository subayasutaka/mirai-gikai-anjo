import { describe, expect, it, vi } from "vitest";
import { executeAnjoAnswer } from "./execute-answer";

function dependencies() {
  return {
    reserve: vi.fn().mockResolvedValue("allowed"),
    generate: vi.fn().mockResolvedValue({
      text: " 資料にある回答 ",
      inputTokens: 1000,
      outputTokens: 500,
    }),
    record: vi.fn().mockResolvedValue(undefined),
  };
}
describe("安城AIの上限予約と回答処理", () => {
  it.each([
    "rate_limit",
    "daily_limit",
    "monthly_limit",
    "unavailable",
  ])("%s の場合は外部AIに送信しない", async (limit) => {
    const deps = dependencies();
    deps.reserve.mockResolvedValue(limit);
    expect((await executeAnjoAnswer(deps)).status).toBe(429);
    expect(deps.generate).not.toHaveBeenCalled();
    expect(deps.record).not.toHaveBeenCalled();
  });
  it("上限確認の障害時も外部AIに送信しない", async () => {
    const deps = dependencies();
    deps.reserve.mockRejectedValue(new Error("database unavailable"));
    expect((await executeAnjoAnswer(deps)).status).toBe(503);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("費用と時間だけ記録し、回答本文は保存しない", async () => {
    const deps = dependencies();
    expect(await executeAnjoAnswer(deps)).toEqual({
      answer: "資料にある回答",
      status: 200,
    });
    expect(deps.record).toHaveBeenCalledWith({
      model: "google/gemini-2.5-flash-lite",
      state: "completed",
      input_tokens: 1000,
      output_tokens: 500,
      actual_usd: 0.0003,
      duration_ms: expect.any(Number),
    });
    expect(deps.generate).toHaveBeenCalledTimes(1);
  });
  it("外部AIの障害は再送信せず失敗を記録する", async () => {
    const deps = dependencies();
    deps.generate.mockRejectedValue(new Error("provider unavailable"));
    expect((await executeAnjoAnswer(deps)).status).toBe(503);
    expect(deps.reserve).toHaveBeenCalledTimes(1);
    expect(deps.generate).toHaveBeenCalledTimes(1);
    expect(deps.record).toHaveBeenCalledWith({
      model: "google/gemini-2.5-flash-lite",
      state: "failed",
      duration_ms: expect.any(Number),
    });
  });
  it("空の回答を成功として表示しない", async () => {
    const deps = dependencies();
    deps.generate.mockResolvedValue({
      text: " ",
      inputTokens: 100,
      outputTokens: 10,
    });
    expect((await executeAnjoAnswer(deps)).status).toBe(502);
    expect(deps.record.mock.calls[0][0].state).toBe("failed");
  });
});
