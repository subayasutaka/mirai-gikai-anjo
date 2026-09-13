import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Root } from "hast";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import { beforeAll, describe, expect, it } from "vitest";
import {
  readingSegments,
  rehypeReadings,
  rubyNodes,
  splitKanaReading,
} from "./furigana";

let tokenizer: Tokenizer<IpadicFeatures>;
beforeAll(async () => {
  tokenizer = await new Promise((resolve, reject) =>
    kuromoji
      .builder({
        dicPath: join(
          dirname(
            createRequire(import.meta.url).resolve("kuromoji/package.json")
          ),
          "dict"
        ),
      })
      .build((error, result) => (error ? reject(error) : resolve(result)))
  );
});

describe("automatic local furigana", () => {
  it("reads monthly budget periods without treating 分から as 分かる", () => {
    const text = "10月分から12月分まで";
    const result = readingSegments(text, (part) => tokenizer.tokenize(part));
    expect(result).toContainEqual({
      text: "10月分",
      reading: "じゅうがつぶん",
    });
    expect(result).toContainEqual({
      text: "12月分",
      reading: "じゅうにがつぶん",
    });
    expect(result.map((part) => part.text).join("")).toBe(text);
  });
  it.each([
    ["日", "にち"],
    ["月", "げつ"],
    ["火", "か"],
    ["水", "すい"],
    ["木", "もく"],
    ["金", "きん"],
    ["土", "ど"],
  ])("reads the weekday abbreviation %s as %s", (weekday, reading) => {
    const text = `9月3日（${weekday}）`;
    const segments = readingSegments(text, (value) =>
      tokenizer.tokenize(value)
    );
    expect(segments).toEqual([
      { text: "9月3日", reading: "くがつみっか" },
      { text: "（" },
      { text: weekday, reading },
      { text: "）" },
    ]);
    expect(segments.map((segment) => segment.text).join("")).toBe(text);
  });

  it("preserves ordinary readings of wood and water outside a date", () => {
    expect(
      readingSegments("木と水", (value) => tokenizer.tokenize(value))
    ).toEqual([
      { text: "木", reading: "き" },
      { text: "と" },
      { text: "水", reading: "みず" },
    ]);
  });
  it.each([
    ["詳しく", "クワシク", [{ text: "詳", reading: "くわ" }, { text: "しく" }]],
    ["進ん", "ススン", [{ text: "進", reading: "すす" }, { text: "ん" }]],
    [
      "取り扱い",
      "トリアツカイ",
      [
        { text: "取", reading: "と" },
        { text: "り" },
        { text: "扱", reading: "あつか" },
        { text: "い" },
      ],
    ],
    ["お金", "オカネ", [{ text: "お" }, { text: "金", reading: "かね" }]],
    [
      "引き上げる",
      "ヒキアゲル",
      [
        { text: "引", reading: "ひ" },
        { text: "き" },
        { text: "上", reading: "あ" },
        { text: "げる" },
      ],
    ],
    [
      "市外の方",
      "シガイノカタ",
      [
        { text: "市外", reading: "しがい" },
        { text: "の" },
        { text: "方", reading: "かた" },
      ],
    ],
  ])("leaves source kana outside ruby: %s", (text, reading, expected) => {
    expect(splitKanaReading(text, reading)).toEqual(expected);
  });
  it("automatically separates kana in newly added sentences using the real dictionary", () => {
    const text =
      "詳しく説明する。委員会質疑まで進んでいます。新しい取り扱いを確かめる。";
    const result = readingSegments(text, (part) => tokenizer.tokenize(part));
    expect(result.map((x) => x.text).join("")).toBe(text);
    expect(result).toContainEqual({ text: "説明", reading: "せつめい" });
    expect(result).toContainEqual({ text: "詳", reading: "くわ" });
    expect(result).toContainEqual({ text: "進", reading: "すす" });
    for (const part of result.filter((x) => x.reading))
      expect(part.text).not.toMatch(/[ぁ-んァ-ヶ]/);
  });
  it("preserves text when an unknown reading cannot be aligned", () => {
    expect(splitKanaReading("取り扱い", "フメイ")).toEqual([
      { text: "取り扱い" },
    ]);
  });
  it("preserves source text, spaces, fees, emoji and punctuation while adding readings", () => {
    const text = "安城市総合斎苑 50,000円 → 70,000円。\nAIに質問 😊";
    const result = readingSegments(text, (part) => tokenizer.tokenize(part));
    expect(result.map((part) => part.text).join("")).toBe(text);
    expect(result).toContainEqual({ text: "安城市", reading: "あんじょうし" });
    expect(result).toContainEqual({
      text: "総合斎苑",
      reading: "そうごうさいえん",
    });
    expect(result).toContainEqual({ text: "質問", reading: "しつもん" });
  });
  it("reads calendar dates and source-document terminology in context", () => {
    const result = readingSegments(
      "原資料は2027年4月1日と2026年9月12日を記載",
      (part) => tokenizer.tokenize(part)
    );
    expect(result).toContainEqual({ text: "原資料", reading: "げんしりょう" });
    expect(result).toContainEqual({
      text: "4月1日",
      reading: "しがつついたち",
    });
    expect(result).toContainEqual({
      text: "9月12日",
      reading: "くがつじゅうににち",
    });
  });
  it("uses confirmed local-name and council-term readings", () => {
    const result = readingSegments(
      "すば康貴：上程→議案質疑→委員会質疑→採決",
      (part) => tokenizer.tokenize(part)
    );
    expect(
      result.filter((part) => part.reading).map((part) => part.reading)
    ).toEqual([
      "やすたか",
      "じょうてい",
      "ぎあんしつぎ",
      "いいんかいしつぎ",
      "さいけつ",
    ]);
  });
  it("reads water-intake wells and school-meal kitchens as facility names", () => {
    const result = readingSegments("取水井と中部調理場", (part) =>
      tokenizer.tokenize(part)
    );
    expect(result).toContainEqual({ text: "取水井", reading: "しゅすいせい" });
    expect(result).toContainEqual({
      text: "調理場",
      reading: "ちょうりじょう",
    });
  });
  it("keeps unknown and non-kanji words without inventing readings", () => {
    expect(
      readingSegments("未知語カナ", () => [
        { surface_form: "未知語", reading: "*" },
        { surface_form: "カナ", reading: "カナ" },
      ])
    ).toEqual([{ text: "未知語" }, { text: "カナ" }]);
  });
  it("treats arbitrary content as text and leaves link destinations and code untouched", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "a",
          properties: { href: "https://example.com/議案" },
          children: [{ type: "text", value: "議案" }],
        },
        {
          type: "element",
          tagName: "code",
          properties: {},
          children: [{ type: "text", value: "議案" }],
        },
      ],
    };
    rehypeReadings({ 議案: [{ text: "議案", reading: "ぎあん" }] })()(tree);
    expect(tree.children[0]).toMatchObject({
      properties: { href: "https://example.com/議案" },
      children: [{ tagName: "ruby" }],
    });
    expect(tree.children[1]).toMatchObject({
      children: [{ type: "text", value: "議案" }],
    });
    expect(rubyNodes([{ text: "<script>alert(1)</script>" }])).toEqual([
      { type: "text", value: "<script>alert(1)</script>" },
    ]);
  });
});
