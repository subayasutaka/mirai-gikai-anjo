import { ANJO_STATUS_LABELS } from "./config";

export const ANJO_DOCUMENT_KINDS = [
  { kind: "bill", label: "議案" },
  { kind: "certification", label: "決算認定" },
  { kind: "consent", label: "人事の同意" },
  { kind: "report", label: "報告" },
] as const;

export type AnjoDocumentKind = (typeof ANJO_DOCUMENT_KINDS)[number]["kind"];

export function getAnjoDocumentKind(name: string): AnjoDocumentKind {
  const normalized = name.normalize("NFKC").replace(/\s/g, "");
  if (/^認定第\d+号/.test(normalized)) return "certification";
  if (/^報告第\d+号/.test(normalized)) return "report";
  if (/^同意第\d+号/.test(normalized)) return "consent";
  return "bill";
}

export function getAnjoDocumentStatus(name: string, status: string): string {
  const kind = getAnjoDocumentKind(name);
  if (kind === "report") return "報告資料を掲載";
  // 議会に出される前（説明会資料などで予定が示された段階）は種別を問わず「提出予定」。
  if (status === "preparing") return "提出予定";
  if (kind === "consent") {
    if (status === "enacted") return "採決・同意";
    if (status === "rejected") return "採決・不同意";
  }
  if (kind === "certification") {
    if (status === "enacted") return "採決・認定";
    if (status === "rejected") return "採決・不認定";
    if (status === "in_receiving_house") return "決算審査";
  }
  return ANJO_STATUS_LABELS[status] || "確認中";
}

/** 議会に出される前の案か（報告は採決がないため対象外）。 */
export function isAnjoSubmissionPlanned(name: string, status: string) {
  return getAnjoDocumentKind(name) !== "report" && status === "preparing";
}

export function countAnjoDocuments(documents: { name: string }[]) {
  const counts: Record<AnjoDocumentKind, number> = {
    bill: 0,
    certification: 0,
    consent: 0,
    report: 0,
  };
  for (const document of documents) counts[getAnjoDocumentKind(document.name)]++;
  return counts;
}
