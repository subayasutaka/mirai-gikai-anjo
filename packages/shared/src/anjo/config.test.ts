import { describe, expect, it } from "vitest";
import { ANJO_PROGRESS_STEPS, ANJO_STATUS_LABELS, getAnjoProgressIndex, isAnjoDecidedStatus, readContactEmail } from "./config";

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

describe("運営者の連絡先", () => {
  it("設定がないとき・形式が正しくないときは出さない", () => {
    expect(readContactEmail(undefined)).toBeNull();
    expect(readContactEmail("  ")).toBeNull();
    expect(readContactEmail("not-an-address")).toBeNull();
    expect(readContactEmail("a@b.jp?subject=x\"")).toBeNull();
  });
  it("前後の空白を除いて出す", () => {
    expect(readContactEmail(" info@example.jp ")).toBe("info@example.jp");
  });
});

it("可決・否決だけを議決済みとして扱う", () => {
  expect(isAnjoDecidedStatus("enacted")).toBe(true);
  expect(isAnjoDecidedStatus("rejected")).toBe(true);
  expect(isAnjoDecidedStatus("in_receiving_house")).toBe(false);
});
