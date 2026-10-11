import { describe, expect, it } from "vitest";
import { isAnjoWebRoute } from "./route-policy";

describe("安城の公開範囲", () => {
  it("初期対象だけを許可する", () => {
    expect(isAnjoWebRoute("/api/anjo-chat")).toBe(true);
    expect(
      isAnjoWebRoute("/contents/00000000-0000-4000-8000-000000000001")
    ).toBe(true);
    expect(isAnjoWebRoute("/bills/00000000-0000-0000-0000-000000000000")).toBe(
      true
    );
    for (const path of [
      "/api/chat",
      "/api/interview/chat",
      "/api/open-data/bills",
      "/report/123",
      "/developers",
      "/bills/x/interview",
    ]) {
      expect(isAnjoWebRoute(path)).toBe(false);
    }
  });
});
