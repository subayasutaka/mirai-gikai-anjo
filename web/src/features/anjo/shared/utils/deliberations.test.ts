import { expect, it } from "vitest";
import { splitDeliberations } from "./deliberations";

it("本文と各会議の質問答弁を分け、出典と通常の本文を維持する", () => {
  const x = splitDeliberations(
    "## 内容\n本文\n\n## 議案質疑\n### 質問\n理由は？\n### 答弁\n経験です。\n\n## 出典\n[資料](https://example.com)\n\n## 委員会質疑\n付託省略。\n\n## 一般質問\n関連する質問。\n"
  );
  expect(x.body).toContain("## 内容");
  expect(x.body).toContain("[資料]");
  expect(x.body).not.toContain("理由は？");
  expect(x.records.議案質疑).toContain("経験です。");
  expect(x.records.委員会質疑).toBe("付託省略。");
  expect(x.records.一般質問).toBe("関連する質問。");
});
it("記録がないときは本文を変えず、空の記録を返す", () => {
  expect(splitDeliberations("説明です。")).toEqual({
    body: "説明です。",
    records: {},
  });
});

it("同じ種類の質疑を追記しても両方の記録と出典を維持する", () => {
  const x = splitDeliberations(
    "## 議案質疑\n9月3日の質問。[出典A](https://example.com/a)\n\n## 議案質疑\n9月15日の答弁。[出典B](https://example.com/b)"
  );
  expect(x.records.議案質疑).toContain("9月3日");
  expect(x.records.議案質疑).toContain("9月15日");
  expect(x.records.議案質疑).toContain("出典A");
  expect(x.records.議案質疑).toContain("出典B");
});
