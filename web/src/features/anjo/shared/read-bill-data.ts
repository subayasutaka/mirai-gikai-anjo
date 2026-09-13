type ReadResult<T> = {
  data: T;
  error: { code?: string } | null;
  status: number;
};

/** 読み取り専用。書き込みや有料AI呼び出しには使用しない。 */
export async function readBillData<T>(
  operation: "bill-list" | "bill-detail",
  read: (signal: AbortSignal) => PromiseLike<ReadResult<T>>
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    let result: ReadResult<T>;
    try {
      result = await read(controller.signal);
    } finally {
      clearTimeout(timeout);
    }
    if (!result.error) return result.data;

    const retryable =
      result.status === 0 ||
      result.status === 408 ||
      result.status === 429 ||
      result.status >= 500;
    const retry = retryable && attempt < 3;
    // DBの生のエラー文・URL・認証情報・議案本文はログへ出さない。
    const diagnostic = { operation, attempt, status: result.status, retry };
    if (retry) {
      console.warn("[anjo-bill-read]", diagnostic);
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    } else {
      console.error("[anjo-bill-read]", diagnostic);
      break;
    }
  }
  throw new Error("議案の資料を読み込めませんでした。");
}
