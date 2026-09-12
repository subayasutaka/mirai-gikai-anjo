"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import { Switch } from "@/components/ui/switch";
import type { ReadingMap } from "../shared/utils/furigana";

const RubyContext = createContext<ReadingMap>({});
export function RubyText({ children }: { children: string }) {
  const readings = useContext(RubyContext);
  return (
    <span>
      {(readings[children] || [{ text: children }]).map(
        ({ text, reading }, index) =>
          reading ? (
            <ruby key={`${index}-${text}`}>
              {text}
              <rt>
                <span aria-hidden="true">{reading}</span>
              </rt>
            </ruby>
          ) : (
            text
          )
      )}
    </span>
  );
}

const ReadingContext = createContext({
  detailed: false,
  furigana: false,
  setDetailed: (_: boolean) => {},
  setFurigana: (_: boolean) => {},
});

export function ReadingPreferences({
  children,
  readings = {},
}: {
  children: ReactNode;
  readings?: ReadingMap;
}) {
  const [detailed, setDetailed] = useState(false);
  const [furigana, setFurigana] = useState(false);
  useEffect(() => {
    try {
      setFurigana(localStorage.getItem("anjo-furigana") === "true");
    } catch {
      /* Reading remains available when storage is blocked. */
    }
  }, []);
  function changeFurigana(value: boolean) {
    setFurigana(value);
    try {
      localStorage.setItem("anjo-furigana", String(value));
    } catch {
      /* This setting still works for the current page. */
    }
  }
  return (
    <RubyContext.Provider value={readings}>
      <ReadingContext.Provider
        value={{ detailed, furigana, setDetailed, setFurigana: changeFurigana }}
      >
        <div
          className="anjo-site"
          data-detailed={detailed}
          data-furigana={furigana}
        >
          {children}
        </div>
      </ReadingContext.Provider>
    </RubyContext.Provider>
  );
}

export function ReadingControls() {
  const detailId = useId();
  const rubyId = useId();
  const { detailed, furigana, setDetailed, setFurigana } =
    useContext(ReadingContext);
  return (
    <fieldset className="anjo-reading-controls" aria-label="読みやすさの設定">
      <label className="anjo-reading-control" htmlFor={detailId}>
        <span>
          <span className={!detailed ? "is-selected" : ""}>かんたん</span>
          <span aria-hidden="true"> / </span>
          <span className={detailed ? "is-selected" : ""}>くわしく</span>
        </span>
        <Switch
          className="anjo-switch"
          id={detailId}
          checked={detailed}
          onCheckedChange={setDetailed}
          aria-label="くわしい説明に切り替え"
        />
      </label>
      <label className="anjo-reading-control" htmlFor={rubyId}>
        <span>ふりがな</span>
        <Switch
          className="anjo-switch"
          id={rubyId}
          checked={furigana}
          onCheckedChange={setFurigana}
          aria-label="ふりがなを表示"
        />
      </label>
    </fieldset>
  );
}

export function InitialDifficulty({ difficulty }: { difficulty?: string }) {
  const { setDetailed } = useContext(ReadingContext);
  useEffect(() => {
    if (difficulty !== undefined) setDetailed(difficulty === "hard");
  }, [difficulty, setDetailed]);
  return null;
}
