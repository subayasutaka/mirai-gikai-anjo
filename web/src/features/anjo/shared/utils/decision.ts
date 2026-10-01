import { getAnjoDocumentKind } from "@mirai-gikai/shared/anjo/document-kind";

export function anjoDecision(name: string, status: string) {
  const kind = getAnjoDocumentKind(name);
  if (kind === "report")
    return {
      label: "報告",
      tone: "neutral",
      explanation: "議会に報告された資料です。",
    } as const;
  if (!["enacted", "rejected"].includes(status))
    return {
      label: "結果未確認",
      tone: "neutral",
      explanation: "決まった結果は、資料を確認して掲載します。",
    } as const;
  const positive = status === "enacted";
  return {
    label:
      kind === "consent"
        ? positive
          ? "同意"
          : "不同意"
        : kind === "certification"
          ? positive
            ? "認定"
            : "不認定"
          : positive
            ? "可決"
            : "否決",
    tone: positive ? "positive" : "negative",
    explanation:
      kind === "consent"
        ? positive
          ? "議会が委員の任命に同意しました。"
          : "議会は委員の任命に同意しませんでした。"
        : kind === "certification"
          ? positive
            ? "議会が決算を認定しました。"
            : "議会は決算を認定しませんでした。"
          : positive
            ? "議会で案が認められました。"
            : "議会で案が認められませんでした。",
  } as const;
}

export function decisionSource(text: string) {
  return text.match(
    /https:\/\/anjo-shigikai\.jp\/know\/result\/wp-content\/uploads\/\d{4}\/\d{2}\/giketsukekka[^\s)]+\.pdf/
  )?.[0];
}

export function decisionDate(
  name: string,
  status: string,
  dates: { introduction_date: string | null; vote_date: string | null }
) {
  return getAnjoDocumentKind(name) === "report"
    ? dates.introduction_date
    : ["enacted", "rejected"].includes(status)
      ? dates.vote_date
      : null;
}
