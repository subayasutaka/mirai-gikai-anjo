import { describe, expect, it } from "vitest";
import {
  type DeliberationDraft,
  extractDeliberations,
  formatDeliberation,
  mergeKnowledgeWithDeliberations,
} from "./draft";

const draft: DeliberationDraft = {
  cleanedText: "全文",
  pairs: [
    {
      time: "00:01:02",
      questioner: "質問者未確認",
      question: "市内料金も変わるのか。",
      respondent: "答弁者未確認",
      answer: "市内料金は変わりません。",
    },
  ],
  cautions: [],
};
describe("確認済み審議記録の追加", () => {
  it("空白だけの質問は追加しない", () => {
    expect(() =>
      formatDeliberation("2026-09-12", "委員会質疑", {
        ...draft,
        pairs: [{ ...draft.pairs[0], question: "　 " }],
      })
    ).toThrow();
  });
  it("複数日の記録を編集・削除して元資料と残した記録を保つ", () => {
    const first = formatDeliberation("2026-09-11", "議案質疑", draft);
    const second = formatDeliberation("2026-09-12", "委員会質疑", {
      ...draft,
      pairs: [{ ...draft.pairs[0], answer: "2日目の答弁" }],
    });
    const knowledge = mergeKnowledgeWithDeliberations("原資料", first + second);
    const edited = second.replace("2日目の答弁", "修正した答弁");
    const result = mergeKnowledgeWithDeliberations(knowledge, edited);
    expect(result).toContain("原資料");
    expect(result).toContain("修正した答弁");
    expect(result).not.toContain("2日目の答弁");
    expect(result).not.toContain("2026.9.11");
  });
  it("否定・氏名未確認・時刻を保って日付を統一する", () => {
    const result = formatDeliberation("2026-09-12", "委員会質疑", draft);
    expect(result).toContain("2026.9.12 委員会質疑");
    expect(result).toContain("市内料金は変わりません。");
    expect(result).toContain("質問者未確認");
    expect(result).toContain("00:01:02");
  });
  it.each([
    "2026-02-30",
    "2026-13-01",
    "",
  ])("実在しない日付 %s を掲載しない", (date) => {
    expect(() => formatDeliberation(date, "委員会質疑", draft)).toThrow();
  });
  it("質問と答弁の組がない記録を掲載しない", () => {
    expect(() =>
      formatDeliberation("2026-09-12", "委員会質疑", { ...draft, pairs: [] })
    ).toThrow();
  });
  it("編集した記録へ置き換え、元資料を保ち、二重追加しない", () => {
    const content = formatDeliberation("2026-09-12", "委員会質疑", draft);
    const first = mergeKnowledgeWithDeliberations("原資料", content);
    expect(mergeKnowledgeWithDeliberations(first, content)).toBe(first);
    expect(first.startsWith("原資料\n")).toBe(true);
    expect(mergeKnowledgeWithDeliberations(first, "記録なし")).toBe("原資料");
    expect(extractDeliberations(content)).not.toContain("anjo-deliberation");
  });
  it("入力のHTMLを掲載用マークアップとして通さない", () => {
    expect(
      formatDeliberation("2026-09-12", "委員会質疑", {
        ...draft,
        pairs: [{ ...draft.pairs[0], question: "<script>evil</script>" }],
      })
    ).toContain("\\<script\\>");
  });
});
