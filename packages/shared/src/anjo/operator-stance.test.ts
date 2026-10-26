import { describe, expect, it } from "vitest";
import {
  formatOperatorStanceForPrompt,
  operatorStanceForPrompt,
  operatorStanceInputSchema,
  operatorStanceState,
  operatorVoteText,
  parseOperatorReasons,
  readOperatorStance,
  toOperatorStanceColumns,
} from "./operator-stance";

describe("すば康貴の賛否と理由", () => {
  it("理由は1行に1つとして読み、行頭の記号と空行を除く", () => {
    expect(parseOperatorReasons("・一つ目\n\n- 二つ目\r\n  三つ目  ")).toEqual([
      "一つ目",
      "二つ目",
      "三つ目",
    ]);
    expect(parseOperatorReasons(null)).toEqual([]);
  });

  it("賛否と書いた日がそろった行だけを欄として読む", () => {
    expect(
      readOperatorStance({
        operator_vote: "against",
        operator_reasons: "理由A",
        operator_stance_written_on: "2026-10-30",
      })
    ).toEqual({ vote: "against", reasons: ["理由A"], writtenOn: "2026-10-30" });
    expect(
      readOperatorStance({
        operator_vote: null,
        operator_reasons: null,
        operator_stance_written_on: null,
      })
    ).toBeNull();
    expect(
      readOperatorStance({
        operator_vote: "unknown",
        operator_reasons: null,
        operator_stance_written_on: "2026-10-30",
      })
    ).toBeNull();
  });

  it("人事の同意案は同意・不同意、ほかは賛成・反対で書く", () => {
    expect(operatorVoteText("for", "同意第6号 教育委員会委員の任命について")).toEqual(
      { normal: "同意しました", hard: "同意" }
    );
    expect(operatorVoteText("against", "同意第5号 委員の選任について").hard).toBe(
      "不同意"
    );
    expect(operatorVoteText("against", "認定第1号 一般会計決算").normal).toBe(
      "反対しました"
    );
    expect(operatorVoteText("chair", "第63号議案 補正予算").hard).toContain(
      "地方自治法第116条第2項"
    );
  });

  it("AIには画面と同じ文を原文のまま渡す", () => {
    expect(
      formatOperatorStanceForPrompt(
        { vote: "for", reasons: ["理由A", "理由B"], writtenOn: "2026-10-30" },
        "第63号議案 補正予算"
      )
    ).toBe("賛否：賛成\n理由：\n・理由A\n・理由B\n記載日：2026年10月30日");
    expect(
      formatOperatorStanceForPrompt(
        { vote: "against", reasons: [], writtenOn: "2026-10-30" },
        "認定第1号 一般会計決算"
      )
    ).toBe("賛否：反対\n理由：未記載\n記載日：2026年10月30日");
  });

  it("理由は3つまで・合わせて300字まで、書いた日は必須", () => {
    const ok = { vote: "for", reasons: "A\nB\nC", writtenOn: "2026-10-30" };
    expect(operatorStanceInputSchema.safeParse(ok).success).toBe(true);
    expect(
      operatorStanceInputSchema.safeParse({ ...ok, reasons: "A\nB\nC\nD" })
        .success
    ).toBe(false);
    expect(
      operatorStanceInputSchema.safeParse({ ...ok, reasons: "あ".repeat(301) })
        .success
    ).toBe(false);
    expect(
      operatorStanceInputSchema.safeParse({ ...ok, reasons: "あ".repeat(300) })
        .success
    ).toBe(true);
    expect(
      operatorStanceInputSchema.safeParse({ ...ok, writtenOn: null }).success
    ).toBe(false);
    expect(
      operatorStanceInputSchema.safeParse({ ...ok, writtenOn: "2026-02-30" })
        .success
    ).toBe(false);
  });

  it("賛否を選ばずに理由だけは保存しない。賛否を外すと3項目とも空にする", () => {
    expect(
      operatorStanceInputSchema.safeParse({
        vote: null,
        reasons: "理由だけ",
        writtenOn: null,
      }).success
    ).toBe(false);
    expect(
      toOperatorStanceColumns({ vote: null, reasons: "", writtenOn: "2026-10-30" })
    ).toEqual({
      operator_vote: null,
      operator_reasons: null,
      operator_stance_written_on: null,
    });
    expect(
      toOperatorStanceColumns({
        vote: "for",
        reasons: "・A\n\nB",
        writtenOn: "2026-10-30",
      })
    ).toEqual({
      operator_vote: "for",
      operator_reasons: "A\nB",
      operator_stance_written_on: "2026-10-30",
    });
  });
});

describe("欄の出し方（画面とAIで共通）", () => {
  const base = {
    name: "認定第1号 令和7年度安城市一般会計歳入歳出決算について",
    status: "enacted",
    operator_vote: "against",
    operator_reasons: "理由A",
    operator_stance_written_on: "2026-10-30",
  };
  it("報告案件には欄を出さない", () => {
    expect(
      operatorStanceState({ ...base, name: "報告第12号 専決処分について" })
    ).toEqual({ state: "hidden" });
  });
  it("議決前は登録があっても賛否を出さず、AIにも渡さない", () => {
    expect(operatorStanceState({ ...base, status: "introduced" })).toEqual({
      state: "pending",
    });
    expect(
      operatorStanceForPrompt({ ...base, status: "introduced" })
    ).toBeUndefined();
  });
  it("議決後で未登録なら、まだ載せていない状態にする", () => {
    expect(
      operatorStanceState({
        ...base,
        operator_vote: null,
        operator_reasons: null,
        operator_stance_written_on: null,
      })
    ).toEqual({ state: "missing" });
  });
  it("否決された議案でも賛否を出し、AIには原文を渡す", () => {
    expect(
      operatorStanceState({ ...base, status: "rejected" })
    ).toMatchObject({ state: "shown", stance: { vote: "against" } });
    expect(operatorStanceForPrompt(base)).toBe(
      "賛否：反対\n理由：\n・理由A\n記載日：2026年10月30日"
    );
  });
  it("書いた日の形式が正しくない行は欄として読まない", () => {
    expect(
      operatorStanceState({ ...base, operator_stance_written_on: "2026-13-01" })
    ).toEqual({ state: "missing" });
  });
});
