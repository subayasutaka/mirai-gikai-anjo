/** 委員会の段階（4段階のうち3番目）を「省略」と表示するか。 */
export const COMMITTEE_STEP_INDEX = 2;

export function isSkippedProgressStep(
  index: number,
  committeeOmitted?: boolean | null
): boolean {
  return committeeOmitted === true && index === COMMITTEE_STEP_INDEX;
}
