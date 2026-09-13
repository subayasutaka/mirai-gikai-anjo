import { describe, expect, it } from "vitest";
import {
  countAnjoDocuments,
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
  isAnjoSubmissionPlanned,
} from "./document-kind";

describe("自治体の議案・認定・報告", () => {
  it("全角・空白入りの正式番号を認識し、題名中の報告は種別にしない", () => {
    expect(getAnjoDocumentKind("認 定 第 ８ 号 下水道決算")).toBe("certification");
    expect(getAnjoDocumentKind("報告第１２号 専決処分について")).toBe("report");
    expect(getAnjoDocumentKind("第61号議案 報告手続の変更")).toBe("bill");
    expect(getAnjoDocumentKind("同 意 第 ５ 号 委員の選任")).toBe("consent");
  });
  it("報告を可決と表示せず、決算認定は認定の用語で表示する", () => {
    expect(getAnjoDocumentStatus("報告第12号", "enacted")).toBe("報告資料を掲載");
    expect(getAnjoDocumentStatus("認定第1号", "enacted")).toBe("採決・認定");
    expect(getAnjoDocumentStatus("認定第8号", "rejected")).toBe("採決・不認定");
    expect(getAnjoDocumentStatus("認定第2号", "in_receiving_house")).toBe("決算審査");
    expect(getAnjoDocumentStatus("第61号議案", "enacted")).toBe("採決・原案可決");
    expect(getAnjoDocumentStatus("同意第5号", "preparing")).toBe("提出予定");
    expect(getAnjoDocumentStatus("同意第5号", "enacted")).toBe("採決・同意");
    expect(getAnjoDocumentStatus("同意第6号", "rejected")).toBe("採決・不同意");
  });
  it("報告・認定を通常議案の件数に混ぜない", () => {
    expect(countAnjoDocuments([
      { name: "第59号議案" }, { name: "第61号議案" },
      { name: "認定第1号" }, { name: "報告第12号" },
      { name: "同意第5号" },
    ])).toEqual({ bill: 2, certification: 1, consent: 1, report: 1 });
    expect(countAnjoDocuments([])).toEqual({ bill: 0, certification: 0, consent: 0, report: 0 });
  });
  it("人事案の予定と実際の提出を、日付の経過ではなく登録状態で区別する", () => {
    expect(isAnjoSubmissionPlanned("同意第5号", "preparing")).toBe(true);
    expect(isAnjoSubmissionPlanned("同意第5号", "introduced")).toBe(false);
    expect(isAnjoSubmissionPlanned("同意第5号", "enacted")).toBe(false);
    expect(isAnjoSubmissionPlanned("第61号議案", "preparing")).toBe(false);
  });
});
