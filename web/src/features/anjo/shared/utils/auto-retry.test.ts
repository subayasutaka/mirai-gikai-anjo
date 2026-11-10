import { describe, expect, it } from "vitest";
import { AUTO_RETRY_WINDOW_MS, shouldAutoRetry } from "./auto-retry";

describe("読み込み失敗時の自動の読み直し", () => {
  const now = 1_800_000_000_000;

  it("まだ読み直していなければ読み直す", () => {
    expect(shouldAutoRetry(null, now)).toBe(true);
  });

  it("直前に読み直したばかりなら、くり返さない", () => {
    expect(shouldAutoRetry(String(now - 1_000), now)).toBe(false);
  });

  it("待つ時間の1ミリ秒前までは、くり返さない", () => {
    expect(shouldAutoRetry(String(now - AUTO_RETRY_WINDOW_MS + 1), now)).toBe(
      false
    );
  });

  it("時間がたてば、また1回だけ読み直す", () => {
    expect(shouldAutoRetry(String(now - AUTO_RETRY_WINDOW_MS), now)).toBe(true);
  });

  it("記録が壊れていれば、読み直す", () => {
    expect(shouldAutoRetry("abc", now)).toBe(true);
  });

  it("記録が未来の時刻なら（時計のずれ）、読み直す", () => {
    expect(shouldAutoRetry(String(now + 5_000), now)).toBe(true);
  });
});
