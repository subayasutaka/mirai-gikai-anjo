import { z } from "zod";
import { isAnjoDecidedStatus } from "./config";
import { getAnjoDocumentKind } from "./document-kind";
import {
  formatProgressDateWithYear,
  isProgressDate,
} from "./progress-dates";

// 「すば康貴の賛否と理由」欄（運営者の意見）。説明文とは別の項目として持つ。
export const OPERATOR_VOTES = [
  "for",
  "against",
  "absent",
  "left",
  "chair",
] as const;
export type OperatorVote = (typeof OPERATOR_VOTES)[number];

export const OPERATOR_REASON_MAX_ITEMS = 3;
export const OPERATOR_REASONS_MAX_CHARS = 300;

export type OperatorStance = {
  vote: OperatorVote;
  reasons: string[];
  writtenOn: string;
};

type OperatorStanceColumns = {
  operator_vote: string | null;
  operator_reasons: string | null;
  operator_stance_written_on: string | null;
};

export function isOperatorVote(value: unknown): value is OperatorVote {
  return OPERATOR_VOTES.includes(value as OperatorVote);
}

/** 1行に1つの理由。行頭の「・」「-」は表示側で付けるので取り除く。 */
export function parseOperatorReasons(text: string | null | undefined) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[・\-*]\s*/, "").trim())
    .filter(Boolean);
}

export function readOperatorStance(
  bill: OperatorStanceColumns
): OperatorStance | null {
  if (
    !isOperatorVote(bill.operator_vote) ||
    !bill.operator_stance_written_on ||
    !isProgressDate(bill.operator_stance_written_on)
  )
    return null;
  return {
    vote: bill.operator_vote,
    reasons: parseOperatorReasons(bill.operator_reasons),
    writtenOn: bill.operator_stance_written_on,
  };
}


export type OperatorStanceState =
  | { state: "hidden" }
  | { state: "pending" }
  | { state: "missing" }
  | { state: "shown"; stance: OperatorStance };

/**
 * 欄の出し方。報告案件は採決がないので出さない。議決前は登録があっても賛否を出さない。
 * 画面とAIで同じ判断を使う。
 */
export function operatorStanceState(
  bill: OperatorStanceColumns & { name: string; status: string }
): OperatorStanceState {
  if (getAnjoDocumentKind(bill.name) === "report") return { state: "hidden" };
  if (!isAnjoDecidedStatus(bill.status)) return { state: "pending" };
  const stance = readOperatorStance(bill);
  return stance ? { state: "shown", stance } : { state: "missing" };
}

/** AIに渡す欄の文。欄が画面に出ていないときは渡さない。 */
export function operatorStanceForPrompt(
  bill: OperatorStanceColumns & { name: string; status: string }
) {
  const view = operatorStanceState(bill);
  return view.state === "shown"
    ? formatOperatorStanceForPrompt(view.stance, bill.name)
    : undefined;
}

/** 賛否の表し方。人事の同意案は「同意」、それ以外は「賛成」で書く。 */
export function operatorVoteText(vote: OperatorVote, billName: string) {
  const consent = getAnjoDocumentKind(billName) === "consent";
  switch (vote) {
    case "for":
      return consent
        ? { normal: "同意しました", hard: "同意" }
        : { normal: "賛成しました", hard: "賛成" };
    case "against":
      return consent
        ? { normal: "同意しませんでした", hard: "不同意" }
        : { normal: "反対しました", hard: "反対" };
    case "absent":
      return {
        normal: "この議案の採決のとき、欠席していました。",
        hard: "本議案の表決時は欠席。",
      };
    case "left":
      return {
        normal: "この議案の採決のとき、退席していました。",
        hard: "本議案の表決時は退席。",
      };
    case "chair":
      return {
        normal: "この議案の採決には、議長として加わっていません。",
        hard: "議長として表決に加わっていません（地方自治法第116条第2項）。",
      };
  }
}

/** 賛成・反対の表決か（欠席・退席・議長は理由が未記載でも断り書きを出さない）。 */
export function isOperatorVoteCast(vote: OperatorVote) {
  return vote === "for" || vote === "against";
}

/** AIに渡す原文。言いかえずに引用させるため、画面と同じ文をそのまま並べる。 */
export function formatOperatorStanceForPrompt(
  stance: OperatorStance,
  billName: string
) {
  const lines = [`賛否：${operatorVoteText(stance.vote, billName).hard}`];
  if (stance.reasons.length > 0)
    lines.push("理由：", ...stance.reasons.map((reason) => `・${reason}`));
  else if (isOperatorVoteCast(stance.vote)) lines.push("理由：未記載");
  lines.push(`記載日：${formatProgressDateWithYear(stance.writtenOn)}`);
  return lines.join("\n");
}

export const operatorStanceInputSchema = z
  .object({
    vote: z.enum(OPERATOR_VOTES).nullable(),
    reasons: z.string(),
    writtenOn: z.string().nullable(),
  })
  .strict()
  .superRefine((input, ctx) => {
    const reasons = parseOperatorReasons(input.reasons);
    if (!input.vote) {
      if (reasons.length > 0)
        ctx.addIssue({
          code: "custom",
          path: ["reasons"],
          message: "賛否を選ばずに理由だけを保存することはできません",
        });
      return;
    }
    if (!input.writtenOn || !isProgressDate(input.writtenOn))
      ctx.addIssue({
        code: "custom",
        path: ["writtenOn"],
        message: "書いた日を YYYY-MM-DD 形式で入力してください",
      });
    if (reasons.length > OPERATOR_REASON_MAX_ITEMS)
      ctx.addIssue({
        code: "custom",
        path: ["reasons"],
        message: `理由は${OPERATOR_REASON_MAX_ITEMS}つまでにしてください`,
      });
    const chars = reasons.join("").length;
    if (chars > OPERATOR_REASONS_MAX_CHARS)
      ctx.addIssue({
        code: "custom",
        path: ["reasons"],
        message: `理由は合わせて${OPERATOR_REASONS_MAX_CHARS}字までにしてください（今は${chars}字）`,
      });
  });

export type OperatorStanceInput = z.infer<typeof operatorStanceInputSchema>;

export function toOperatorStanceColumns(
  input: OperatorStanceInput
): OperatorStanceColumns {
  if (!input.vote)
    return {
      operator_vote: null,
      operator_reasons: null,
      operator_stance_written_on: null,
    };
  const reasons = parseOperatorReasons(input.reasons);
  return {
    operator_vote: input.vote,
    operator_reasons: reasons.length > 0 ? reasons.join("\n") : null,
    operator_stance_written_on: input.writtenOn,
  };
}
