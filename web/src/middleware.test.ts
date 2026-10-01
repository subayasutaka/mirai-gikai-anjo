import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  middleware,
  isDevRoute,
  isHtmlAcceptHeader,
  isValidDifficultyLevel,
  shouldApplyDifficultyCookie,
} from "./middleware";

describe("shouldApplyDifficultyCookie", () => {
  it("通常のページパスではtrueを返す", () => {
    expect(shouldApplyDifficultyCookie("/")).toBe(true);
    expect(shouldApplyDifficultyCookie("/bills/abc")).toBe(true);
  });

  it("APIパスではfalseを返す（レスポンスにSet-Cookieを乗せない）", () => {
    expect(shouldApplyDifficultyCookie("/api/open-data/bills")).toBe(false);
    expect(shouldApplyDifficultyCookie("/api/chat")).toBe(false);
  });
});

describe("isValidDifficultyLevel", () => {
  it("should return true for 'normal'", () => {
    expect(isValidDifficultyLevel("normal")).toBe(true);
  });

  it("should return true for 'hard'", () => {
    expect(isValidDifficultyLevel("hard")).toBe(true);
  });

  it("should return false for invalid value", () => {
    expect(isValidDifficultyLevel("easy")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isValidDifficultyLevel("")).toBe(false);
  });

  it("should return false for null", () => {
    expect(isValidDifficultyLevel(null)).toBe(false);
  });
});

describe("isHtmlAcceptHeader", () => {
  it("should return true for text/html", () => {
    expect(isHtmlAcceptHeader("text/html")).toBe(true);
  });

  it("should return true for accept header with text/html among others", () => {
    expect(
      isHtmlAcceptHeader(
        "text/html,application/xhtml+xml,application/xml;q=0.9"
      )
    ).toBe(true);
  });

  it("should return false for application/json", () => {
    expect(isHtmlAcceptHeader("application/json")).toBe(false);
  });

  it("should return false for image/png", () => {
    expect(isHtmlAcceptHeader("image/png")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isHtmlAcceptHeader("")).toBe(false);
  });
});

describe("isDevRoute", () => {
  it("/dev と /dev/ 配下は開発用ルートと判定する", () => {
    expect(isDevRoute("/dev")).toBe(true);
    expect(isDevRoute("/dev/preview")).toBe(true);
  });

  it("/developers など /dev で始まる通常ページは対象外", () => {
    expect(isDevRoute("/developers")).toBe(false);
    expect(isDevRoute("/developers/open-data-api")).toBe(false);
  });

  it("その他のパスは対象外", () => {
    expect(isDevRoute("/")).toBe(false);
    expect(isDevRoute("/terms")).toBe(false);
  });
});

describe("安城実証のアクセス制限", () => {
  afterEach(() => vi.unstubAllEnvs());
  it.each([
    "/bills",
    "/api/anjo-chat",
    "/preview/bills/c875ef6b-65c9-4ed5-bdce-a0df9a79a923",
  ])("%s はJSON/RSCでも認証が必要", async (path) => {
    vi.stubEnv("BASIC_AUTH_USER", "test-user");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "test-password");
    const response = await middleware(
      new NextRequest(`https://example.test${path}`, {
        headers: { Accept: "text/x-component" },
      })
    );
    expect(response.status).toBe(401);
  });
  it("Vercel上の実証は認証設定が欠けると表示しない", async () => {
    vi.stubEnv("BASIC_AUTH_USER", "");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("ANJO_PILOT_MODE", "true");
    expect(
      (await middleware(new NextRequest("https://example.test/bills"))).status
    ).toBe(503);
  });
  it("認証済みでも旧APIの入口は開かない", async () => {
    vi.stubEnv("BASIC_AUTH_USER", "test-user");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "test-password");
    const response = await middleware(
      new NextRequest("https://example.test/api/chat", {
        headers: { Authorization: `Basic ${btoa("test-user:test-password")}` },
      })
    );
    expect(response.status).toBe(404);
  });
  it("認証済みページにも索引禁止とキャッシュ抑制が付く", async () => {
    vi.stubEnv("BASIC_AUTH_USER", "test-user");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "test-password");
    const response = await middleware(
      new NextRequest("https://example.test/bills", {
        headers: { Authorization: `Basic ${btoa("test-user:test-password")}` },
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
});
