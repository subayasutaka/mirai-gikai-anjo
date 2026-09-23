import { describe, expect, it } from "vitest";
import { formatProgressDate, isProgressDate } from "./progress-dates";

describe("milestone civil dates", () => {
  it.each([
    ["2026-08-27", "8月27日（木）"],
    ["2026-09-03", "9月3日（木）"],
    ["2026-09-04", "9月4日（金）"],
    ["2026-09-15", "9月15日（火）"],
    ["2026-09-12", "9月12日（土）"],
    ["2026-09-13", "9月13日（日）"],
    ["2026-09-14", "9月14日（月）"],
    ["2026-09-16", "9月16日（水）"],
    ["2024-02-29", "2月29日（木）"],
    ["2027-01-01", "1月1日（金）"],
  ])("formats %s without padding or a timezone shift", (input, expected) => {
    expect(formatProgressDate(input)).toBe(expected);
  });

  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-9-3", "2026-09-03T00:00:00Z", "invalid", ""])(
    "rejects invalid or non-civil date %s", (value) => {
      expect(isProgressDate(value)).toBe(false);
      expect(formatProgressDate(value)).toBeNull();
    }
  );

  it("leaves unknown dates unknown", () => {
    expect(formatProgressDate(null)).toBeNull();
    expect(formatProgressDate(undefined)).toBeNull();
  });
});
