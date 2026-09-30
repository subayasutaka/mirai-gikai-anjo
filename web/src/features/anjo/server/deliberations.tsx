import "server-only";
import {
  DELIBERATION_HEADINGS,
  splitDeliberations,
} from "../shared/utils/deliberations";
import { ReadingMarkdown, ReadingText } from "./reading-text";
export function AnjoDeliberations({
  normal,
  hard,
}: {
  normal: string;
  hard: string;
}) {
  const easy = splitDeliberations(normal).records;
  const detailed = splitDeliberations(hard).records;
  const labels = {
    議案質疑: "本会議での質問と市の回答",
    委員会質疑: "委員会での質問と市の回答",
    一般質問: "一般質問での関連するやりとり",
  };
  return (
    <section className="anjo-deliberations">
      <h2>
        <ReadingText
          normal="議員の質問と市の回答"
          hard="議案質疑・委員会質疑・一般質問"
        />
      </h2>
      {DELIBERATION_HEADINGS.map((heading) => (
        <details
          className="anjo-disclosure"
          key={heading}
          open={!!(easy[heading] || detailed[heading])}
        >
          <summary>
            <ReadingText normal={labels[heading]} hard={heading} />
          </summary>
          <div className="anjo-markdown">
            <ReadingMarkdown
              normal={
                easy[heading] ||
                detailed[heading] ||
                "このページに掲載した記録はまだありません。"
              }
              hard={
                detailed[heading] ||
                easy[heading] ||
                "この案件に関する記録は未掲載です。"
              }
            />
          </div>
        </details>
      ))}
    </section>
  );
}
