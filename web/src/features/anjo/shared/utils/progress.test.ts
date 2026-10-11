import { describe, expect, it } from "vitest";
import { COMMITTEE_STEP_INDEX, isSkippedProgressStep } from "./progress";

describe("isSkippedProgressStep", () => {
  it("委員会省略が登録された議案では委員会の段階だけを省略する", () => {
    expect(isSkippedProgressStep(COMMITTEE_STEP_INDEX, true)).toBe(true);
    for (const index of [0, 1, 3]) {
      expect(isSkippedProgressStep(index, true)).toBe(false);
    }
  });

  it.each([
    false,
    null,
    undefined,
  ])("委員会省略が登録されていなければ省略しない: %s", (committeeOmitted) => {
    expect(isSkippedProgressStep(COMMITTEE_STEP_INDEX, committeeOmitted)).toBe(
      false
    );
  });
});
