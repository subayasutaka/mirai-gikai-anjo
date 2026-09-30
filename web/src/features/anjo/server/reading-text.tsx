import "server-only";
import { AnjoMarkdown, Furigana } from "./furigana";

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

export function ReadingMarkdown({
  normal,
  hard,
}: {
  normal: string;
  hard: string;
}) {
  return (
    <>
      <div data-reading-level="normal">
        <AnjoMarkdown>{normal}</AnjoMarkdown>
      </div>
      <div data-reading-level="hard">
        <AnjoMarkdown>{hard}</AnjoMarkdown>
      </div>
    </>
  );
}
