import { describe, expect, it } from "vitest";
import { isSearchIndexable, resolveSiteUrl } from "./search-indexing";

describe("isSearchIndexable", () => {
  it("認証なしの公開ページは検索エンジンに載せる", () => {
    expect(isSearchIndexable("/", false)).toBe(true);
    expect(isSearchIndexable("/bills", false)).toBe(true);
    expect(
      isSearchIndexable("/bills/00000000-0000-0000-0000-000000000000", false)
    ).toBe(true);
  });

  it("下書きの確認用ページとAPIは載せない", () => {
    expect(
      isSearchIndexable(
        "/preview/bills/00000000-0000-0000-0000-000000000000",
        false
      )
    ).toBe(false);
    expect(isSearchIndexable("/api/anjo-chat", false)).toBe(false);
  });

  it("Basic認証で閉じている間はどのページも載せない", () => {
    expect(isSearchIndexable("/", true)).toBe(false);
  });
});

describe("resolveSiteUrl", () => {
  it("NEXT_PUBLIC_WEB_URL を優先し、末尾の / を外す", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_WEB_URL: "https://example.test/",
        VERCEL_PROJECT_PRODUCTION_URL: "other.example.test",
      })
    ).toBe("https://example.test");
  });

  it("無ければ Vercel の本番ドメインを使う", () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "anjo.example.test" })
    ).toBe("https://anjo.example.test");
  });

  it("どちらも無ければ手元の開発用URLにする", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
