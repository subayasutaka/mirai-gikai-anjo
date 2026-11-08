import { describe, expect, it } from "vitest";
import {
  buildRobotsRules,
  buildSitemapEntries,
  isSearchIndexable,
} from "./search-indexing";

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

describe("buildRobotsRules", () => {
  it("Basic認証で閉じている間は、どこも巡回させない", () => {
    expect(buildRobotsRules(true, "https://example.test")).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("公開中は全体を許し、下書きの確認用ページとAPIだけ断ってサイトマップを示す", () => {
    expect(buildRobotsRules(false, "https://example.test")).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/preview/", "/api/"],
      },
      sitemap: "https://example.test/sitemap.xml",
    });
  });
});

describe("buildSitemapEntries", () => {
  it("パスにサイトのURLを付ける", () => {
    expect(
      buildSitemapEntries("https://example.test", ["/", "/bills"])
    ).toEqual([
      { url: "https://example.test/" },
      { url: "https://example.test/bills" },
    ]);
  });
});
