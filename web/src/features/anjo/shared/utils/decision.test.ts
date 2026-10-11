import { describe, expect, it } from "vitest";
import { anjoDecision, decisionDate, decisionSource } from "./decision";

describe("議決結果の表示", () => {
  it("議案・同意・認定の結果を区別する", () => {
    expect(anjoDecision("第65号議案", "enacted").label).toBe("可決");
    expect(anjoDecision("議員提出第7号", "rejected").label).toBe("否決");
    expect(anjoDecision("議員提出第7号", "rejected").tone).toBe("negative");
    expect(anjoDecision("同意第6号", "enacted").label).toBe("同意");
    expect(anjoDecision("同意第6号", "rejected").label).toBe("不同意");
    expect(anjoDecision("認定第1号", "enacted").label).toBe("認定");
    expect(anjoDecision("認定第1号", "rejected").label).toBe("不認定");
  });
  it("報告に可決を表示せず、審議中を否決にしない", () => {
    expect(anjoDecision("報告第12号", "enacted").label).toBe("報告");
    expect(anjoDecision("第1号", "in_receiving_house").label).toBe(
      "結果未確認"
    );
  });
  it("確認済みの議決結果の出典だけを抽出する", () => {
    const url =
      "https://anjo-shigikai.jp/know/result/wp-content/uploads/2026/09/giketsukekkaR809.pdf";
    expect(decisionSource(`[公式結果](${url})`)).toBe(url);
    expect(
      decisionSource("https://example.com/giketsukekka.pdf")
    ).toBeUndefined();
    expect(decisionSource("資料未登録")).toBeUndefined();
  });
});

it("報告は誤って採決日が入っていても提出日を使い、予定採決を結果にしない", () => {
  const dates = { introduction_date: "2026-08-27", vote_date: "2026-09-15" };
  expect(decisionDate("報告第12号", "enacted", dates)).toBe("2026-08-27");
  expect(decisionDate("第65号議案", "enacted", dates)).toBe("2026-09-15");
  expect(decisionDate("第65号議案", "rejected", dates)).toBe("2026-09-15");
  expect(decisionDate("第65号議案", "preparing", dates)).toBeNull();
});
