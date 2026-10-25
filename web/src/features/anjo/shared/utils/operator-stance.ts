export const OPERATOR_STANCE_HEADING = "すば康貴の賛否と理由";

/** 説明文から「すば康貴の賛否と理由」の節を取り出す。欄4として説明とは別枠で表示するため。 */
export function splitOperatorStance(markdown: string) {
  let stance = "";
  const body = markdown.replace(
    /^## すば康貴の賛否と理由\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m,
    (_, content: string) => {
      stance = content.trim();
      return "";
    }
  );
  return { body: body.trim(), stance };
}
