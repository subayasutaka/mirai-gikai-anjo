import { describe, expect, it } from "vitest";
import { isCommitteeOmitted } from "./progress";

describe("isCommitteeOmitted", () => {
  it.each([
    "2026年9月15日提出。委員会付託を省略。",
    "委員会への付託は省略。",
    "委員会審査を省略しました。",
  ])("確定した省略を認識する: %s", (note) => {
    expect(isCommitteeOmitted(note)).toBe(true);
  });
  it.each([
    undefined,
    null,
    "",
    "委員会付託を省略しない。",
    "委員会付託を省略する予定です。",
    "委員会付託を省略するかは未確認。",
  ])("否定・予定・未確認は省略済みにしない: %s", (note) => {
    expect(isCommitteeOmitted(note)).toBe(false);
  });
});
