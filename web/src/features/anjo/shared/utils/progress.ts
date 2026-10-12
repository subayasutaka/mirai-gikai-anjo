/** 委員会の段階（4段階のうち3番目）を「省略」と表示するか。 */
export const COMMITTEE_STEP_INDEX = 2;

export function isSkippedProgressStep(
  index: number,
  committeeOmitted?: boolean | null
): boolean {
  return committeeOmitted === true && index === COMMITTEE_STEP_INDEX;
}

/** 複数の委員会で分けて審査した議案の、委員会の段階の説明。 */
export function describeCommitteeSplit(
  committeeCount?: number | null
): { normal: string; hard: string } | null {
  if (!committeeCount || committeeCount < 2) return null;
  return {
    normal: `${committeeCount}つの委員会で分けて調べる`,
    hard: `${committeeCount}委員会に分割して付託・審査`,
  };
}
