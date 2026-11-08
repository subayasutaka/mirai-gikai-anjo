/** 検索エンジンに載せないパス（下書きの確認用・API）。 */
const NOINDEX_PATH_PREFIXES = ["/preview/", "/api/"];

/**
 * 検索エンジンに載せてよいページか判定する。
 * Basic認証で閉じている間は、どのページも載せない。
 */
export function isSearchIndexable(
  pathname: string,
  basicAuthEnabled: boolean
): boolean {
  if (basicAuthEnabled) return false;
  return !NOINDEX_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** robots.txt で巡回を断るパス。 */
export const ROBOTS_DISALLOW_PATHS = NOINDEX_PATH_PREFIXES;

/**
 * 公開サイトのURL（末尾の / なし）を決める。
 * NEXT_PUBLIC_WEB_URL を優先し、無ければ Vercel の本番ドメインを使う。
 */
export function resolveSiteUrl(
  env: Record<string, string | undefined>
): string {
  const url =
    env.NEXT_PUBLIC_WEB_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
