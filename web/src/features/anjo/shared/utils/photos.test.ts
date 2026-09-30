import { describe, expect, it } from "vitest";
import { ANJO_CASE_PHOTOS, ANJO_PHOTOS, getAnjoPhoto } from "./photos";

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
    ["教育委員会委員の任命", "education"],
    ["選択的夫婦別姓制度の意見書", "marriage"],
    ["新しく追加した題材", "documents"],
  ] as const)("%s は %s の写真を使う", (subject, key) => {
    expect(getAnjoPhoto(subject)).toBe(ANJO_PHOTOS[key]);
  });

  it("掲載中の23議案と8事業は一件ずつ異なる写真を使う", () => {
    const keys = Object.values(ANJO_CASE_PHOTOS);
    expect(keys).toHaveLength(31);
    expect(new Set(keys).size).toBe(31);
    for (const key of keys) expect(ANJO_PHOTOS[key]).toBeDefined();
  });

  it("題名が変わっても案件に選んだ写真を維持する", () => {
    expect(
      getAnjoPhoto("変更した題名", "011d889e-b0c4-4211-a72e-660097f74a98")
    ).toBe(ANJO_PHOTOS.food);
    expect(
      getAnjoPhoto("介護保険の決算", "7347b353-f520-4934-bdcf-68bcd9d82651")
    ).toBe(ANJO_PHOTOS.care);
    expect(getAnjoPhoto("新しい水道の案件", "unknown-id")).toBe(
      ANJO_PHOTOS.water
    );
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
