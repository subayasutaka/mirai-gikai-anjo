import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readBillData } from "./read-bill-data";

const bill = { id: "test-bill", name: "公開議案" };
const fetchMock = vi.fn<typeof fetch>();

function read() {
  const client = createClient("https://example.test", "test-key", {
    global: { fetch: fetchMock },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return readBillData("bill-detail", (signal) =>
    client
      .from("bills")
      .select("id,name")
      .eq("id", bill.id)
      .eq("publish_status", "published")
      .abortSignal(signal)
      .maybeSingle()
  );
}

describe("議案の読み取りの復旧", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("通信失敗のあとに取得をやり直し、公開条件を維持する", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(Response.json([bill]));
    const result = read();
    await vi.runAllTimersAsync();
    expect(await result).toEqual(bill);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(new URL(String(url)).searchParams.get("publish_status")).toBe(
        "eq.published"
      );
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("一時的な503のあとに復旧する", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "unavailable" }, { status: 503 })
      )
      .mockResolvedValueOnce(Response.json([bill]));
    const result = read();
    await vi.runAllTimersAsync();
    expect(await result).toEqual(bill);
  });

  it("応答しない通信を5秒で中止して、新しい接続で取得し直す", async () => {
    fetchMock
      .mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          })
      )
      .mockResolvedValueOnce(Response.json([bill]));
    const result = read();
    await vi.advanceTimersByTimeAsync(4_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.runAllTimersAsync();
    expect(await result).toEqual(bill);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][1]?.signal?.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    400, 401, 403,
  ])("権限・設定エラー%sでは繰り返さず失敗する", async (status) => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "private detail" }, { status })
    );
    await expect(read()).rejects.toThrow("議案の資料を読み込めませんでした。");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "private detail"
    );
  });

  it("接続障害が続いても3回で停止し、認証情報をログに含めない", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed with private-key"));
    const rejection = expect(read()).rejects.toThrow(
      "議案の資料を読み込めませんでした。"
    );
    await vi.runAllTimersAsync();
    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      JSON.stringify([
        ...vi.mocked(console.error).mock.calls,
        ...vi.mocked(console.warn).mock.calls,
      ])
    ).not.toContain("private-key");
  });

  it("見つからない議案は接続障害と混同しない", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    expect(await read()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
