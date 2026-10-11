import type { Element, Root, RootContent } from "hast";

export type ReadingSegment = { text: string; reading?: string };
export type ReadingMap = Record<string, ReadingSegment[]>;
export type JapaneseToken = { surface_form: string; reading?: string };

function hiragana(value: string): string {
  return value.replace(/[ァ-ヶ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
}

// Kana in the source anchors the corresponding kana in the dictionary reading.
// This handles prefixes, inflections, and internal kana (e.g. お金、進ん、取り扱い).
export function splitKanaReading(
  text: string,
  reading?: string
): ReadingSegment[] {
  if (!reading || reading === "*" || !/[\p{Script=Han}々〆]/u.test(text))
    return [{ text }];
  const parts =
    text.match(/[\p{Script=Han}々〆]+|[^\p{Script=Han}々〆]+/gu) || [];
  const pattern = parts
    .map((part) =>
      /^[\p{Script=Han}々〆]+$/u.test(part)
        ? "(.+?)"
        : hiragana(part).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("");
  const match = hiragana(reading).match(new RegExp(`^${pattern}$`, "u"));
  // An uncertain alignment must not attach an invented reading to a kanji.
  if (!match) return [{ text }];
  let capture = 1;
  return parts.map((part) =>
    /^[\p{Script=Han}々〆]+$/u.test(part)
      ? { text: part, reading: match[capture++] }
      : { text: part }
  );
}

// Local names and council terms take precedence over the general dictionary.
const OVERRIDES: Record<string, string> = {
  安城: "あんじょう",
  安城市: "あんじょうし",
  康貴: "やすたか",
  総合斎苑: "そうごうさいえん",
  斎苑: "さいえん",
  上程: "じょうてい",
  議案質疑: "ぎあんしつぎ",
  委員会質疑: "いいんかいしつぎ",
  採決: "さいけつ",
  令和: "れいわ",
  原案: "げんあん",
  胎: "たい",
  原資料: "げんしりょう",
  取水井: "しゅすいせい",
  調理場: "ちょうりじょう",
  公図: "こうず",
  市外の方: "しがいのかた",
  以上の方: "いじょうのかた",
  未満の方: "みまんのかた",
};
const overridePattern = new RegExp(
  `(\\d{1,2}月(?:分|\\d{1,2}日(?:（[日月火水木金土]）)?)?|${Object.keys(
    OVERRIDES
  )
    .sort((a, b) => b.length - a.length)
    .join("|")})`,
  "g"
);

export function readingSegments(
  text: string,
  tokenize: (text: string) => JapaneseToken[]
): ReadingSegment[] {
  return text
    .split(overridePattern)
    .filter(Boolean)
    .flatMap((part) => {
      const date = part.match(
        /^(\d{1,2})月(?:(\d{1,2})日(?:（([日月火水木金土])）)?|(分))?$/
      );
      if (date) {
        const months = [
          "",
          "いちがつ",
          "にがつ",
          "さんがつ",
          "しがつ",
          "ごがつ",
          "ろくがつ",
          "しちがつ",
          "はちがつ",
          "くがつ",
          "じゅうがつ",
          "じゅういちがつ",
          "じゅうにがつ",
        ];
        const specialDays: Record<number, string> = {
          1: "ついたち",
          2: "ふつか",
          3: "みっか",
          4: "よっか",
          5: "いつか",
          6: "むいか",
          7: "なのか",
          8: "ようか",
          9: "ここのか",
          10: "とおか",
          14: "じゅうよっか",
          20: "はつか",
          24: "にじゅうよっか",
        };
        const digits = [
          "",
          "いち",
          "に",
          "さん",
          "よん",
          "ご",
          "ろく",
          "しち",
          "はち",
          "く",
        ];
        const month = months[Number(date[1])];
        const day = Number(date[2]);
        if (month && (!date[2] || (day >= 1 && day <= 31))) {
          const dayReading = date[2]
            ? specialDays[day] ||
              `${day >= 20 ? digits[Math.floor(day / 10)] : ""}${day >= 10 ? "じゅう" : ""}${digits[day % 10]}にち`
            : "";
          const weekday = date[3];
          const segments: ReadingSegment[] = [
            {
              text: weekday ? part.slice(0, -3) : part,
              reading: month + dayReading + (date[4] ? "ぶん" : ""),
            },
          ];
          if (weekday) {
            const weekdays: Record<string, string> = {
              日: "にち",
              月: "げつ",
              火: "か",
              水: "すい",
              木: "もく",
              金: "きん",
              土: "ど",
            };
            segments.push(
              { text: "（" },
              { text: weekday, reading: weekdays[weekday] },
              { text: "）" }
            );
          }
          return segments;
        }
      }
      if (Object.hasOwn(OVERRIDES, part))
        return splitKanaReading(part, OVERRIDES[part]);
      return tokenize(part).flatMap((token) =>
        splitKanaReading(token.surface_form, token.reading)
      );
    });
}

export function rubyNodes(segments: ReadingSegment[]): RootContent[] {
  return segments.map(
    ({ text, reading }): RootContent =>
      reading
        ? {
            type: "element",
            tagName: "ruby",
            properties: {},
            children: [
              { type: "text", value: text },
              {
                type: "element",
                tagName: "rt",
                properties: { ariaHidden: "true" },
                children: [{ type: "text", value: reading }],
              },
            ],
          }
        : { type: "text", value: text }
  );
}

// Transform only text nodes. Markdown links still use ReactMarkdown's safe URL handling.
export function rehypeReadings(readings: ReadingMap) {
  return () => (tree: Root) => {
    function walk(parent: Root | Element) {
      parent.children = parent.children.flatMap((node): RootContent[] => {
        if (node.type === "text" && Object.hasOwn(readings, node.value))
          return rubyNodes(readings[node.value]);
        if (
          node.type === "element" &&
          !["ruby", "code", "pre"].includes(node.tagName)
        )
          walk(node);
        return [node];
      }) as typeof parent.children;
    }
    walk(tree);
  };
}
