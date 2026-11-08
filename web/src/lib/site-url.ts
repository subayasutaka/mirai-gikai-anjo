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
