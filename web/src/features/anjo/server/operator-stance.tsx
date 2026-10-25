import "server-only";
import { splitOperatorStance } from "../shared/utils/operator-stance";
import { ReadingMarkdown, ReadingText } from "./reading-text";

/** 欄4：運営者すば康貴の賛否と理由。記録の欄と見た目を分け、意見であることを明示する。 */
export function AnjoOperatorStance({
  normal,
  hard,
}: {
  normal: string;
  hard: string;
}) {
  const easy = splitOperatorStance(normal).stance;
  const detailed = splitOperatorStance(hard).stance;
  if (!easy && !detailed) return null;
  return (
    <section className="anjo-operator-stance">
      <p className="anjo-operator-stance-tag">
        <ReadingText normal="運営者の意見" hard="運営者の意見" />
      </p>
      <h2>
        <ReadingText
          normal="すば康貴の賛成・反対と、その理由"
          hard="すば康貴の賛否と理由"
        />
      </h2>
      <p className="anjo-operator-stance-lead">
        <ReadingText
          normal="この欄は、このサイトを運営する安城市議会議員のすば康貴の考えです。議会や市の考えではありません。ほかの議員の考えは、上の「議員の質問・意見」の欄と、議員ごとの賛成・反対の表で読めます。"
          hard="本欄は、運営者である安城市議会議員すば康貴個人の意見です。議会・市の見解ではありません。他の議員の発言・賛否は、議案質疑・委員会質疑・討論欄および議員別賛否表をご覧ください。"
        />
      </p>
      <div className="anjo-markdown">
        <ReadingMarkdown normal={easy || detailed} hard={detailed || easy} />
      </div>
    </section>
  );
}
