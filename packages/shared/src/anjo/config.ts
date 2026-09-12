export const ANJO_SITE = {
  name: "みらい議会＠安城",
  operator: "すば康貴（安城市議会議員・無所属）",
  sourceCode: "https://github.com/subayasutaka/mirai-gikai-anjo",
  official: "https://anjo-shigikai.jp/know/result/r8/",
  disclaimer: "すば康貴個人による非公式実証です。安城市・安城市議会の公式サービスではありません。これは政党チームみらいが運営しているものではありません。",
} as const;

export const ANJO_STATUS_LABELS: Record<string, string> = {
  preparing: "確認中", introduced: "上程", in_originating_house: "議案質疑",
  in_receiving_house: "委員会質疑", enacted: "採決・原案可決", rejected: "採決・否決",
};

export const ANJO_SOURCE_MAX_BYTES = 9000;

// This Anjo fork reuses the upstream status enum for a single municipal chamber.
export const ANJO_PROGRESS_STEPS = [
  { label: "上程", description: "議案を議会に出す" },
  { label: "議案質疑", description: "本会議で質問する" },
  { label: "委員会質疑", description: "委員会で詳しく調べる" },
  { label: "採決", description: "賛成・反対を決める" },
] as const;

export function getAnjoProgressIndex(status: string): number {
  return ({ introduced: 0, in_originating_house: 1, in_receiving_house: 2, enacted: 3, rejected: 3 } as Record<string, number>)[status] ?? -1;
}
