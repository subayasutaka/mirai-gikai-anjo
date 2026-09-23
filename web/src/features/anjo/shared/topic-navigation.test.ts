import { describe, expect, it } from "vitest";
import { readTopicSearch, topicQuery } from "./topic-navigation";
describe("一覧へ戻る際の絞り込み", () => {
  it("会期・分野・テーマ・入口をURLに保持する", () => {
    const state = readTopicSearch({
      view: "bills",
      session: "r8-3",
      category: "福祉",
      theme: "物価高対応",
    });
    expect(
      readTopicSearch(
        Object.fromEntries(new URLSearchParams(topicQuery(state)))
      )
    ).toEqual(state);
  });
  it("重複パラメーター・未定義の分野を無視し、任意の遷移先は受け付けない", () => {
    expect(
      readTopicSearch({
        view: "https://evil.example",
        category: ["福祉", "教育"],
        session: ["x"],
      })
    ).toEqual({ view: "life", category: "", session: "", theme: "" });
  });
});
