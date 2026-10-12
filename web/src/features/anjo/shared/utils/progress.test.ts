import { describe, expect, it } from "vitest";
import {
  COMMITTEE_STEP_INDEX,
  describeCommitteeSplit,
  isSkippedProgressStep,
} from "./progress";

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

describe("describeCommitteeSplit", () => {
  it("2つ以上の委員会で分けた審査を説明する", () => {
    expect(describeCommitteeSplit(4)).toEqual({
      normal: "4つの委員会で分けて調べる",
      hard: "4委員会に分割して付託・審査",
    });
  });

  it.each([
    null,
    undefined,
    0,
    1,
  ])("1つの委員会だけなら通常の説明にする: %s", (count) => {
    expect(describeCommitteeSplit(count)).toBeNull();
  });
});
