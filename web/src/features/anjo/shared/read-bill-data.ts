type ReadResult<T> = {
  data: T;
  error: { code?: string } | null;
  status: number;
};

/**
 * 公開中の議案・説明を覚えておく秒数。
 * 管理画面やSQLで直した文は、この秒数が過ぎた次のアクセスから順に新しくなる。
 */
export const ANJO_DATA_REVALIDATE_SECONDS = 60;

/**
 * 1回ごとの待ち時間（ミリ秒）。起動直後はDBの最初の応答が遅いことがあるため、
 * 最初の1回だけ長めに待ち、やり直しは短く切り上げる。
 */
export const ANJO_READ_TIMEOUTS_MS = [10_000, 5_000, 5_000] as const;

/** 読み取り専用。書き込みや有料AI呼び出しには使用しない。 */
export async function readBillData<T>(
  operation: "bill-list" | "bill-detail",
  read: (signal: AbortSignal) => PromiseLike<ReadResult<T>>
): Promise<T> {
  const attempts = ANJO_READ_TIMEOUTS_MS.length;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      ANJO_READ_TIMEOUTS_MS[attempt - 1]
    );
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
    const retry = retryable && attempt < attempts;
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
