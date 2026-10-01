import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";
import { isAnjoAdminRoute } from "./route-policy";
describe("暮らしの内容管理への入口", () => {
  it("一覧・作成・編集を認証処理へ通す", () => {
    for (const path of [
      routes.topics(),
      routes.topicNew(),
      routes.topicEdit("00000000-0000-4000-8000-000000000001"),
    ])
      expect(isAnjoAdminRoute(path)).toBe(true);
  });
  it("範囲外の公開操作は引き続き通さない", () => {
    for (const path of [
      "/contents/x/edit",
      "/contents/delete",
      "/interviews",
      "/api/open-data",
    ])
      expect(isAnjoAdminRoute(path)).toBe(false);
  });
});
