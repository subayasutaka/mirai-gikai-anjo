/**
 * Web側で定義されているキャッシュタグと同じ値
 * web/src/lib/cache-tags.ts と同期を保つこと
 */
export const WEB_CACHE_TAGS = {
  BILLS: "bills",
  DIET_SESSIONS: "diet-sessions",
  INTERVIEW_CONFIGS: "interview-configs",
  PUBLIC_INTERVIEW_REPORTS: "public-interview-reports",
} as const;

export type WebCacheTag = (typeof WEB_CACHE_TAGS)[keyof typeof WEB_CACHE_TAGS];

/**
 * 安城の閲覧画面は遠隔からキャッシュを消さない。
 * 公開中の議案データは web 側で ANJO_DATA_REVALIDATE_SECONDS（60秒）ごとに新しくなる。
 */
export async function invalidateWebCache(
  _tags?: WebCacheTag[]
): Promise<void> {}
