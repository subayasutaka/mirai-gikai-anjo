import "server-only";

/**
 * 「すば康貴の賛否と理由」欄を出すか。欄・画面下の説明・AIの案内文を同じ日に切り替えるため、
 * 1つの環境変数でまとめて切り替える。
 */
export function isOperatorStanceEnabled() {
  return process.env.ANJO_OPERATOR_STANCE_ENABLED === "true";
}
