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

/** 安城の閲覧画面は force-dynamic / no-store のため、遠隔キャッシュはない。 */
export async function invalidateWebCache(
  _tags?: WebCacheTag[]
): Promise<void> {}
