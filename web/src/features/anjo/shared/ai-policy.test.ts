import { describe, expect, it } from "vitest";
import {
  createAnjoPrompt,
  estimateAnjoCost,
  questionSchema,
} from "./ai-policy";

describe("安城AIの入力・費用制限", () => {
  it("空白・文字数超過・モデル指定を受け付けない", () => {
    const billId = "c875ef6b-65c9-4ed5-bdce-a0df9a79a923";
    expect(questionSchema.safeParse({ billId, question: "　" }).success).toBe(
      false
    );
    expect(
      questionSchema.safeParse({ billId, question: "あ".repeat(501) }).success
    ).toBe(false);
    expect(
      questionSchema.safeParse({ billId, question: "いつ？", model: "other" })
        .success
    ).toBe(false);
  });
  it("資料を黙って切り捨てず、長すぎる資料は送信を止める", () => {
    expect(() =>
      createAnjoPrompt(
        {
          name: "条例案",
          status: "introduced",
          status_note: null,
          knowledge_source: "あ".repeat(6000),
        },
        "何が変わる？"
      )
    ).toThrow("source_too_long");
  });
  it("登録資料と質問を別のデータとして渡す", () => {
    const p = createAnjoPrompt(
      {
        name: "条例案",
        status: "introduced",
        status_note: "議決未確認",
        knowledge_source: "令和9年4月1日から施行する案",
      },
      "可決済み？"
    );
    expect(p).toContain("議決未確認");
    expect(p).toContain("可決済み？");
  });
  it("入力と出力の単価を分けて推計する", () => {
    expect(estimateAnjoCost(1000, 500)).toBeCloseTo(0.000395);
    expect(estimateAnjoCost(24000, 1000)).toBeLessThan(0.01);
  });
});
