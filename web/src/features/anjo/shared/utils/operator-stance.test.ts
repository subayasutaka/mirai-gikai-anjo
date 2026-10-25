import { describe, expect, it } from "vitest";
import { splitOperatorStance } from "./operator-stance";

describe("splitOperatorStance", () => {
  it("節を本文から取り出す", () => {
    const result = splitOperatorStance(
      "## 何を確認する？\n\n本文\n\n## すば康貴の賛否と理由\n\n**反対しました**\n\n## 討論\n\n討論の要約"
    );
    expect(result.stance).toBe("**反対しました**");
    expect(result.body).toBe(
      "## 何を確認する？\n\n本文\n\n## 討論\n\n討論の要約"
    );
  });

  it("末尾の節も取り出す", () => {
    const result = splitOperatorStance(
      "本文\n\n## すば康貴の賛否と理由\n\n理由"
    );
    expect(result).toEqual({ body: "本文", stance: "理由" });
  });

  it("節がなければ空文字を返す", () => {
    expect(splitOperatorStance("本文")).toEqual({ body: "本文", stance: "" });
  });
});
