import { describe, expect, it } from "vitest";
import { summarizePilotUsage } from "./usage-summary";
describe("実証の利用集計", () => {
  it("未利用の平均応答を0秒と誤表示しない", () => {
    expect(summarizePilotUsage([])).toEqual({
      accepted: 0,
      completed: 0,
      cost: 0,
      reserved: 0,
      averageSeconds: null,
    });
  });
  it("失敗時も予約額に含め、成功した回答の時間を集計する", () => {
    const result = summarizePilotUsage([
      {
        state: "completed",
        actual_usd: 0.0005,
        reserved_usd: 0.01,
        duration_ms: 2000,
      },
      {
        state: "completed",
        actual_usd: 0.0007,
        reserved_usd: 0.01,
        duration_ms: 4000,
      },
      {
        state: "failed",
        actual_usd: null,
        reserved_usd: 0.01,
        duration_ms: 25000,
      },
    ]);
    expect(result).toMatchObject({
      accepted: 3,
      completed: 2,
      reserved: 0.03,
      averageSeconds: 3,
    });
    expect(result.cost).toBeCloseTo(0.0012);
  });
});
