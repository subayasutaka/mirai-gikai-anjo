import "server-only";
import { Furigana } from "./furigana";

/** Use the same reading preference for headings, labels and explanations. */
export function ReadingText({
  normal,
  hard,
}: {
  normal: string;
  hard: string;
}) {
  return (
    <>
      <span data-reading-level="normal">
        <Furigana>{normal}</Furigana>
      </span>
      <span data-reading-level="hard">
        <Furigana>{hard}</Furigana>
      </span>
    </>
  );
}
