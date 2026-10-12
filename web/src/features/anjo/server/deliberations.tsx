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
    討論: "採決の前に議員が述べた賛成・反対の意見",
    一般質問: "一般質問での関連するやりとり",
  };
  return (
    <section className="anjo-deliberations">
      <h2>
        <ReadingText
          normal="議員の質問・意見と市の回答"
          hard="議案質疑・委員会質疑・討論・一般質問"
        />
      </h2>
      {DELIBERATION_HEADINGS.filter(
        // 討論は記録を載せた案件だけに出す。未入手を「討論なし」と誤解させないため。
        (heading) => heading !== "討論" || easy[heading] || detailed[heading]
      ).map((heading) => (
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
                (heading === "一般質問"
                  ? "ありません。"
                  : "このページに掲載した記録はまだありません。")
              }
              hard={
                detailed[heading] ||
                easy[heading] ||
                (heading === "一般質問"
                  ? "ありません。"
                  : "この案件に関する記録は未掲載です。")
              }
            />
          </div>
        </details>
      ))}
    </section>
  );
}
