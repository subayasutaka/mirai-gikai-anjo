import { describe, expect, it } from "vitest";
import { getBudgetKind, getTopicScope } from "./budget-kind";

describe("予算議案の分類", () => {
  it.each([
    [
      "第63号議案 令和8年度安城市一般会計補正予算（第1号）について",
      "supplementary",
    ],
    [
      "第６４号議案　令和８年度安城市介護保険事業特別会計補正予算（第１号）について",
      "supplementary",
    ],
    ["第10号議案 令和9年度安城市一般会計予算について", "initial"],
    ["第12号議案 令和9年度安城市水道事業会計予算について", "initial"],
    ["認定第1号 令和7年度安城市一般会計決算について", null],
    ["報告第1号 補正予算に関する報告", null],
    ["第60号議案 安城市総合斎苑条例の一部改正について", null],
  ] as const)("%s", (name, expected) => {
    expect(getBudgetKind(name)).toBe(expected);
  });
  it("当初予算や他の議案を含む会期を補正予算だけと表示しない", () => {
    const supplementary = "第63号議案 令和8年度一般会計補正予算について";
    const initial = "第10号議案 令和9年度一般会計予算について";
    expect(getTopicScope([supplementary]).hard).toBe("補正予算の事業・内訳");
    const past = getTopicScope([
      "第10号議案 令和6年度一般会計補正予算について",
    ]);
    expect(`${past.normal}${past.explanation}`).not.toMatch(/今年/);
    expect(getTopicScope([initial, supplementary]).hard).toBe(
      "予算の事業・内訳"
    );
    expect(getTopicScope(["条例改正案"]).hard).toBe("議案別の事業・内容");
    expect(getTopicScope([]).hard).toBe("議案別の事業・内容");
  });
});
