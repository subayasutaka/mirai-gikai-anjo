import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

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
