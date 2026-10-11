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
    expect(estimateAnjoCost(1000, 500)).toBeCloseTo(0.0003);
    expect(estimateAnjoCost(24000, 1000)).toBeLessThan(0.01);
  });
  it("人事案の提出予定と候補者未公表を、同意済みと混同せずAIへ渡す", () => {
    const prompt = createAnjoPrompt(
      {
        name: "同意第5号 固定資産評価審査委員会委員の選任について",
        status: "preparing",
        status_note: "9月15日に提出・採決予定。結果は未確認。",
        knowledge_source:
          "現職の任期満了に伴う後任の選任。候補者は公表資料に記載なし。",
      },
      "誰の任命が決まった？"
    );
    expect(prompt).toContain('"資料種別":"consent"');
    expect(prompt).toContain('"登録状態":"提出予定"');
    expect(prompt).toContain("候補者は公表資料に記載なし");
    expect(prompt).not.toContain("採決・同意");
  });
  it("報告と決算の意味を状態・参照資料と一緒に渡す", () => {
    const report = createAnjoPrompt(
      {
        name: "報告第12号 専決処分",
        status: "introduced",
        status_note: "議会への報告",
        knowledge_source: "損害賠償の額",
      },
      "可決した？"
    );
    expect(report).toContain('"資料種別":"report"');
    expect(report).toContain("報告資料を掲載");
    const certification = createAnjoPrompt(
      {
        name: "認定第8号 下水道決算",
        status: "enacted",
        status_note: null,
        knowledge_source: "2025年度決算",
      },
      "追加予算？"
    );
    expect(certification).toContain("採決・認定");
    expect(certification).not.toContain("原案可決");
  });
});
