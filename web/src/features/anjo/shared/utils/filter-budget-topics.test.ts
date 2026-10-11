import { describe, expect, it } from "vitest";
import { filterBudgetTopics, getTopicBillIds } from "./filter-budget-topics";

const topics = [
  {
    id: "meal",
    content: { categories: ["福祉"], themes: ["物価高対応"] },
    anjo_topic_bills: [{ bill_id: "63" }, { bill_id: "64" }],
  },
  {
    id: "nursery",
    content: { categories: ["子育て", "福祉"], themes: ["物価高対応"] },
    anjo_topic_bills: [{ bill_id: "63" }],
  },
  {
    id: "water",
    content: { categories: ["暮らし"], themes: ["物価高対応"] },
    anjo_topic_bills: [{ bill_id: "63" }, { bill_id: "65" }],
  },
  {
    id: "air",
    content: { categories: ["教育"], themes: [] },
    anjo_topic_bills: [{ bill_id: "63" }],
  },
];

describe("暮らしと議案で共通の予算絞り込み", () => {
  it("物価高の3内容に関係する議案を3件にまとめる", () => {
    const selected = filterBudgetTopics(topics, {
      category: "",
      theme: "物価高対応",
    });
    expect(selected.map((t) => t.id)).toEqual(["meal", "nursery", "water"]);
    expect([...getTopicBillIds(selected)]).toEqual(["63", "64", "65"]);
  });
  it("同じ内容に分野とテーマの両方が一致する場合だけ対象にする", () => {
    const selected = filterBudgetTopics(topics, {
      category: "教育",
      theme: "物価高対応",
    });
    expect(selected).toEqual([]);
    expect([...getTopicBillIds(selected)]).toEqual([]);
  });
  it("副分野も対象にし、テーマを解除しても分野を保てる", () => {
    expect(
      filterBudgetTopics(topics, { category: "福祉", theme: "" }).map(
        (t) => t.id
      )
    ).toEqual(["meal", "nursery"]);
  });
  it("全条件を外すと全内容を表示し、未知のテーマは0件になる", () => {
    expect(filterBudgetTopics(topics, { category: "", theme: "" })).toEqual(
      topics
    );
    expect(
      filterBudgetTopics(topics, { category: "", theme: "未掲載" })
    ).toEqual([]);
  });
});
