import { describe, expect, it } from "vitest";
import { ANJO_PHOTOS, getAnjoPhoto } from "./photos";

describe("議案に合うイメージ写真", () => {
  it.each([
    ["安城市総合斎苑の使用料", "flowers"],
    ["水道事業会計補正予算", "water"],
    ["下水道事業会計決算", "pipes"],
    ["一般会計補正予算", "budget"],
    ["土地取得特別会計決算", "land"],
    ["有料駐車場事業会計決算", "parking"],
    ["介護保険事業会計補正予算", "health"],
    ["国民健康保険事業決算", "health"],
    ["廃棄物の減量に関する条例", "recycling"],
    ["高齢者給食サービス", "food"],
    ["介護保険償還金管理事務", "budget"],
    ["固定資産税システム管理事業", "technology"],
    ["教育委員会委員の任命", "documents"],
    ["選択的夫婦別姓制度の意見書", "documents"],
    ["新しく追加した題材", "documents"],
  ] as const)("%s は %s の写真を使う", (subject, key) => {
    expect(getAnjoPhoto(subject)).toBe(ANJO_PHOTOS[key]);
  });

  it("全素材に撮影者・出典・利用条件と確認日が残る", () => {
    for (const photo of Object.values(ANJO_PHOTOS)) {
      expect(photo.src).toMatch(/^\/anjo\/photos\/[a-z]+\.jpg$/);
      expect(photo.author).not.toBe("");
      expect(photo.source).toMatch(/^https:\/\/www\.pexels\.com\/photo\//);
      expect(photo.license).toBe("https://www.pexels.com/license/");
      expect(photo.checkedOn).toBe("2026-09-30");
    }
  });
});
