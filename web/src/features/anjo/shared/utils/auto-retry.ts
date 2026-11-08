/** 自動の読み直しは、この時間内に1回だけ。続けて失敗したら手動に任せる。 */
export const AUTO_RETRY_WINDOW_MS = 60_000;

/**
 * 読み込みに失敗したページを、自動で読み直してよいかを決める。
 * lastRetryAt は前回自動で読み直した時刻（ミリ秒、文字列）。無い・読めないときは読み直す。
 */
export function shouldAutoRetry(
  lastRetryAt: string | null,
  now: number
): boolean {
  const last = Number(lastRetryAt);
  if (!lastRetryAt || !Number.isFinite(last)) return true;
  return now - last >= AUTO_RETRY_WINDOW_MS || now < last;
}
