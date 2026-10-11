import { type NextRequest, NextResponse } from "next/server";
import {
  DIFFICULTY_COOKIE_NAME,
  DIFFICULTY_COOKIE_OPTIONS,
  type DifficultyLevelEnum,
} from "./features/bill-difficulty/shared/types";
import { isDifficultyLevel } from "./features/bill-difficulty/shared/utils/is-difficulty-level";
import {
  createUnauthorizedResponse,
  getBasicAuthConfig,
  validateBasicAuth,
} from "./lib/basic-auth";
import { isAnjoWebRoute } from "./features/anjo/shared/route-policy";

/**
 * 開発用プレビュー（/dev 配下）のルートか判定する。
 * 単純な startsWith("/dev") だと /developers 等の通常ページまで
 * 巻き込むため、完全一致か "/dev/" 配下のみを対象にする。
 */
export function isDevRoute(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

export async function middleware(request: NextRequest) {
  if (!isAnjoWebRoute(request.nextUrl.pathname))
    return new NextResponse("Not found", { status: 404 });
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "private, no-store");
  // URLパラメータからdifficulty Cookieをセット
  _applyDifficultyCookie(request, response);

  const authConfig = getBasicAuthConfig();

  // Basic認証の設定がない場合はスキップ
  if (!authConfig) {
    if (process.env.VERCEL && process.env.ANJO_PILOT_MODE !== "false") {
      return new NextResponse("非公式実証の準備中です。", { status: 503 });
    }
    return response;
  }

  // 議案APIとRSCも同じ認証で保護する。

  // Basic認証の検証
  if (validateBasicAuth(request, authConfig)) {
    return response;
  }

  return createUnauthorizedResponse();
}

/**
 * 有効な難易度レベルかチェック
 */
export function isValidDifficultyLevel(
  value: string | null
): value is DifficultyLevelEnum {
  return isDifficultyLevel(value);
}

/**
 * difficulty Cookie の付与対象パスか判定する。
 * オープンデータAPI等も difficulty クエリを受け取るため、APIレスポンスに
 * Set-Cookie が乗ってUIの表示設定を書き換えてしまわないよう除外する
 */
export function shouldApplyDifficultyCookie(pathname: string): boolean {
  return !pathname.startsWith("/api/");
}

/**
 * URLパラメータからdifficultyを取得し、レスポンスのCookieにセット
 */
function _applyDifficultyCookie(
  request: NextRequest,
  response: NextResponse
): void {
  if (!shouldApplyDifficultyCookie(request.nextUrl.pathname)) return;

  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");

  if (isValidDifficultyLevel(difficulty)) {
    response.cookies.set(
      DIFFICULTY_COOKIE_NAME,
      difficulty,
      DIFFICULTY_COOKIE_OPTIONS
    );
  }
}

export function isHtmlAcceptHeader(accept: string): boolean {
  return accept.includes("text/html");
}

export const config = {
  matcher: [
    /*
     * _next/static, _next/image, favicon.ico, 画像ファイル等の
     * 静的アセットを除外し、ページリクエストのみでミドルウェアを実行する
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
