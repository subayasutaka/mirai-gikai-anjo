import { describe, expect, it } from "vitest";
import { ANJO_PROGRESS_STEPS, ANJO_STATUS_LABELS, getAnjoProgressIndex } from "./config";

describe("Anjo council progress", () => {
  it("shows committee questioning before the vote, without assuming passage", () => {
    const committee = getAnjoProgressIndex("in_receiving_house");
    expect(committee).toBeGreaterThan(getAnjoProgressIndex("in_originating_house"));
    expect(committee).toBeLessThan(getAnjoProgressIndex("enacted"));
    expect(committee).toBeLessThan(getAnjoProgressIndex("rejected"));
  });
  it("does not mark an unconfirmed state as introduced", () => {
    expect(getAnjoProgressIndex("preparing")).toBe(-1);
    expect(getAnjoProgressIndex("unknown")).toBe(-1);
  });
});

it("uses the final vote step for either result while preserving the result label", () => {
  for (const status of ["enacted", "rejected"]) {
    expect(getAnjoProgressIndex(status)).toBe(ANJO_PROGRESS_STEPS.length - 1);
    expect(ANJO_PROGRESS_STEPS[getAnjoProgressIndex(status)].label).toBe("採決");
  }
  expect(ANJO_STATUS_LABELS.enacted).not.toBe(ANJO_STATUS_LABELS.rejected);
});
