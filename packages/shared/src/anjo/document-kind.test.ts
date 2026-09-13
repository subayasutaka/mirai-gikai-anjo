import { describe, expect, it } from "vitest";
import {
  countAnjoDocuments,
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
} from "./document-kind";

describe("自治体の議案・認定・報告", () => {
  it("全角・空白入りの正式番号を認識し、題名中の報告は種別にしない", () => {
    expect(getAnjoDocumentKind("認 定 第 ８ 号 下水道決算")).toBe("certification");
    expect(getAnjoDocumentKind("報告第１２号 専決処分について")).toBe("report");
    expect(getAnjoDocumentKind("第61号議案 報告手続の変更")).toBe("bill");
  });
  it("報告を可決と表示せず、決算認定は認定の用語で表示する", () => {
    expect(getAnjoDocumentStatus("報告第12号", "enacted")).toBe("報告資料を掲載");
    expect(getAnjoDocumentStatus("認定第1号", "enacted")).toBe("採決・認定");
    expect(getAnjoDocumentStatus("認定第8号", "rejected")).toBe("採決・不認定");
    expect(getAnjoDocumentStatus("認定第2号", "in_receiving_house")).toBe("決算審査");
    expect(getAnjoDocumentStatus("第61号議案", "enacted")).toBe("採決・原案可決");
  });
  it("報告・認定を通常議案の件数に混ぜない", () => {
    expect(countAnjoDocuments([
      { name: "第59号議案" }, { name: "第61号議案" },
      { name: "認定第1号" }, { name: "報告第12号" },
    ])).toEqual({ bill: 2, certification: 1, report: 1 });
    expect(countAnjoDocuments([])).toEqual({ bill: 0, certification: 0, report: 0 });
  });
});
