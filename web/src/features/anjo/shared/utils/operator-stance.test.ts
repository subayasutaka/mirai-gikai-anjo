import { describe, expect, it } from "vitest";
import { hasOperatorDebate } from "./operator-stance";

describe("運営者の討論があるか", () => {
  it("すば康貴議員の見出しがあれば討論欄へ案内する", () => {
    expect(
      hasOperatorDebate([
        undefined,
        "### 森下祥子議員（反対）\n\n- 要旨\n\n### すば康貴議員（反対）\n\n- 要旨",
      ])
    ).toBe(true);
  });
  it("ほかの議員だけが討論した議案では案内しない", () => {
    expect(
      hasOperatorDebate([
        "### 森下祥子議員（反対）\n\n- すば康貴議員の発言にふれた要旨",
      ])
    ).toBe(false);
    expect(hasOperatorDebate([undefined, undefined])).toBe(false);
  });
});
