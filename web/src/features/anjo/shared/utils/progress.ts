export function isCommitteeOmitted(note?: string | null): boolean {
  return /(?:^|[。\n])\s*委員会(?:への)?(?:付託|審査)(?:を|は)?省略(?:しました|しています|した|することに決定しました)?(?:[。\n]|$)/.test(
    note || ""
  );
}
