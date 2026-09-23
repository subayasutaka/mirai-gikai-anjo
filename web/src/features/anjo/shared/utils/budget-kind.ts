import { getAnjoDocumentKind } from "@mirai-gikai/shared/anjo/document-kind";

export function getBudgetKind(
  name: string
): "supplementary" | "initial" | null {
  if (getAnjoDocumentKind(name) !== "bill") return null;
  const normalized = name.normalize("NFKC").replace(/\s/g, "");
  if (/年度.+補正予算(?:\([^)]*\))?(?:について)?$/.test(normalized))
    return "supplementary";
  if (/年度.+予算(?:\([^)]*\))?(?:について)?$/.test(normalized))
    return "initial";
  return null;
}

export function getTopicScope(names: string[]) {
  if (
    names.length &&
    names.every((name) => getBudgetKind(name) === "supplementary")
  ) {
    return {
      normal: "予算を見直す案の中身",
      hard: "補正予算の事業・内訳",
      explanation: "すでに決まっている予算を変更する「補正予算」の内容です。",
    };
  }
  if (names.length && names.every((name) => getBudgetKind(name))) {
    return {
      normal: "予算の使い道と見直し",
      hard: "予算の事業・内訳",
      explanation:
        "年度当初の予算や、その見直しに含まれる内容を掲載しています。",
    };
  }
  return {
    normal: "暮らしに関わる案の中身",
    hard: "議案別の事業・内容",
    explanation: "議案の中から、個別に説明している内容を掲載しています。",
  };
}
