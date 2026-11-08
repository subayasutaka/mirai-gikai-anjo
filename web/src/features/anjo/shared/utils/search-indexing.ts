/** 検索エンジンに載せないパス（下書きの確認用・API）。 */
export const NOINDEX_PATH_PREFIXES = ["/preview/", "/api/"];

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

/** robots.txt の中身を決める。Basic認証で閉じている間は、どこも巡回させない。 */
export function buildRobotsRules(basicAuthEnabled: boolean, siteUrl: string) {
  if (basicAuthEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: NOINDEX_PATH_PREFIXES },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

/** sitemap.xml に載せる URL を、サイトのURLとパスの一覧から作る。 */
export function buildSitemapEntries(siteUrl: string, paths: string[]) {
  return paths.map((path) => ({ url: `${siteUrl}${path}` }));
}
