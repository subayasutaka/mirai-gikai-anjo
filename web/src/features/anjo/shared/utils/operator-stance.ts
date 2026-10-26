/** 討論の欄に、運営者すば康貴の討論の要約があるか（見出し「### すば康貴議員（…）」）。 */
export function hasOperatorDebate(debateRecords: (string | undefined)[]) {
  return debateRecords.some((record) =>
    /^### すば康貴議員/m.test(record ?? "")
  );
}
