import type { ANJO_PROGRESS_STEPS } from "./config";

export type AnjoProgressDates = Partial<
  Record<(typeof ANJO_PROGRESS_STEPS)[number]["dateField"], string | null>
>;

/** A meeting date is a civil date, independent of server/browser timezone. */
export function isProgressDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function formatProgressDate(value?: string | null): string | null {
  if (!value || !isProgressDate(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  const weekday = "日月火水木金土"[date.getUTCDay()];
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日（${weekday}）`;
}
