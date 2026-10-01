// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  InitialDifficulty,
  ReadingControls,
  ReadingPreferences,
} from "./reading-preferences";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function renderSettings(difficulty?: string) {
  return render(
    <ReadingPreferences>
      <ReadingControls />
      <InitialDifficulty difficulty={difficulty} />
      <input aria-label="書きかけの質問" defaultValue="いつから？" />
    </ReadingPreferences>
  );
}

describe("reading switches", () => {
  it("starts easy and toggles detail and furigana independently without losing the question", () => {
    const { container } = renderSettings();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "料金はいくら変わりますか？" },
    });
    expect(
      screen
        .getByRole("switch", { name: "くわしい説明に切り替え" })
        .getAttribute("aria-checked")
    ).toBe("false");
    fireEvent.click(
      screen.getByRole("switch", { name: "くわしい説明に切り替え" })
    );
    fireEvent.click(screen.getByRole("switch", { name: "ふりがなを表示" }));
    expect(
      container.querySelector(".anjo-site")?.getAttribute("data-detailed")
    ).toBe("true");
    expect(
      container.querySelector(".anjo-site")?.getAttribute("data-furigana")
    ).toBe("true");
    fireEvent.click(
      screen.getByRole("switch", { name: "くわしい説明に切り替え" })
    );
    expect(
      screen
        .getByRole("switch", { name: "ふりがなを表示" })
        .getAttribute("aria-checked")
    ).toBe("true");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "料金はいくら変わりますか？"
    );
    expect(localStorage.getItem("anjo-furigana")).toBe("true");
  });
  it("restores only furigana and honors an explicit detailed link", () => {
    localStorage.setItem("anjo-furigana", "true");
    renderSettings("hard");
    expect(
      screen
        .getAllByRole("switch")
        .map((control) => control.getAttribute("aria-checked"))
    ).toEqual(["true", "true"]);
  });
  it("still switches when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderSettings();
    fireEvent.click(screen.getByRole("switch", { name: "ふりがなを表示" }));
    expect(
      screen
        .getByRole("switch", { name: "ふりがなを表示" })
        .getAttribute("aria-checked")
    ).toBe("true");
  });
});
